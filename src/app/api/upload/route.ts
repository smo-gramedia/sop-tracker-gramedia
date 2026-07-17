// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BUCKETS,
  uploadFile,
  buildStoragePath,
  deleteFile,
  type BucketName,
} from "@/lib/storage";

// ─── Batas ukuran (MB) ───────────────────────────────────────────────
// CATATAN: selama masih di Vercel, upload > ~4.5MB tetap gagal karena batas
// body request platform. Angka di bawah baru berlaku penuh setelah migrasi
// ke server internal.
const MAX_RAW_MB = 50;
const MAX_UTAMA_MB = 50;
const MAX_LAMPIRAN_MB = 15; // lampiran WAJIB ZIP
const MAX_SOSIALISASI_MB = 10; // bukti sosialisasi WAJIB PDF

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME = "application/msword";

/**
 * Browser/OS mengirim MIME .zip berbeda-beda (bahkan kadang kosong atau
 * application/octet-stream). Normalisasi berdasarkan ekstensi agar validasi
 * konsisten DAN contentType yang dikirim ke Supabase selalu benar
 * (bucket punya daftar MIME yang diizinkan).
 */
function effectiveMime(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".zip")) return "application/zip";
  if (name.endsWith(".pdf")) return PDF_MIME;
  if (name.endsWith(".docx")) return DOCX_MIME;
  if (name.endsWith(".doc")) return DOC_MIME;
  return file.type;
}

type UploadRules = {
  maxSizeMb: number;
  allowedMime: string[];
  requireRole?: string[];
  /** Pesan yang ditampilkan bila tipe file tidak sesuai. */
  hint: string;
};

/** Aturan upload ditentukan oleh bucket + sub-tipe, bukan bucket saja. */
function resolveRules(
  bucket: BucketName,
  attachmentTipe: "utama" | "lampiran"
): UploadRules {
  if (bucket === "raw-documents") {
    return {
      maxSizeMb: MAX_RAW_MB,
      allowedMime: [PDF_MIME, DOCX_MIME, DOC_MIME],
      requireRole: ["admin", "superadmin"],
      hint: "Raw dokumen harus berupa file .doc, .docx, atau .pdf.",
    };
  }

  if (bucket === "sop-attachments") {
    if (attachmentTipe === "utama") {
      return {
        maxSizeMb: MAX_UTAMA_MB,
        allowedMime: [PDF_MIME],
        requireRole: ["admin", "superadmin"],
        hint: "PDF utama harus berupa file PDF.",
      };
    }
    // Lampiran WAJIB ZIP — bila lebih dari satu berkas, satukan dalam 1 ZIP.
    return {
      maxSizeMb: MAX_LAMPIRAN_MB,
      allowedMime: ["application/zip"],
      requireRole: ["admin", "superadmin"],
      hint: `Lampiran harus berupa file ZIP (.zip), maksimal ${MAX_LAMPIRAN_MB}MB. Satukan seluruh berkas pendukung ke dalam satu file ZIP.`,
    };
  }

  // sosialisasi → WAJIB PDF
  return {
    maxSizeMb: MAX_SOSIALISASI_MB,
    allowedMime: [PDF_MIME],
    hint: `Bukti sosialisasi harus berupa file PDF, maksimal ${MAX_SOSIALISASI_MB}MB.`,
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as BucketName | null;
  const sopDocumentId = formData.get("sopDocumentId") as string | null;
  const tipe = formData.get("tipe") as
    | "raw"
    | "attachment"
    | "sosialisasi"
    | null;

  // Untuk SopAttachment, ada sub-tipe: 'utama' | 'lampiran'
  const attachmentTipe =
    (formData.get("attachmentTipe") as "utama" | "lampiran" | null) ??
    "lampiran";

  // E3: bila ada replaceId, ini operasi GANTI FILE (bukan tambah baru).
  const replaceId = formData.get("replaceId") as string | null;

  if (!file || !bucket || !tipe) {
    return NextResponse.json(
      { error: "Missing fields: file, bucket, tipe" },
      { status: 400 }
    );
  }
  if (!Object.values(BUCKETS).includes(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }
  if (!sopDocumentId) {
    return NextResponse.json(
      { error: "sopDocumentId required" },
      { status: 400 }
    );
  }

  const rules = resolveRules(bucket, attachmentTipe);
  if (rules.requireRole && !rules.requireRole.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validasi ukuran & tipe — pakai MIME hasil normalisasi ekstensi.
  const mime = effectiveMime(file);
  if (file.size > rules.maxSizeMb * 1024 * 1024) {
    return NextResponse.json(
      {
        error: `Ukuran file melebihi ${rules.maxSizeMb}MB (file Anda ${(
          file.size /
          1024 /
          1024
        ).toFixed(1)}MB).`,
      },
      { status: 400 }
    );
  }
  if (!rules.allowedMime.includes(mime)) {
    return NextResponse.json({ error: rules.hint }, { status: 400 });
  }

  // Verifikasi SOP exists
  const sop = await prisma.sopDocument.findUnique({
    where: { id: sopDocumentId },
    select: { id: true },
  });
  if (!sop) {
    return NextResponse.json({ error: "SOP not found" }, { status: 404 });
  }

  // Untuk attachment 'utama', enforce: hanya 1 PDF utama per SOP
  // (dilewati saat REPLACE, karena memang sedang mengganti utama yang ada)
  if (!replaceId && tipe === "attachment" && attachmentTipe === "utama") {
    const existingUtama = await prisma.sopAttachment.findFirst({
      where: { sopDocumentId, tipe: "utama" },
      select: { id: true },
    });
    if (existingUtama) {
      return NextResponse.json(
        {
          error:
            "PDF utama sudah ada. Hapus dulu yang lama, atau pilih tipe 'lampiran'.",
        },
        { status: 400 }
      );
    }
  }

  try {
    // ─── E3: MODE GANTI FILE ────────────────────────────────────────────
    //   Validasi & lookup record lama DULU (sebelum upload) supaya tidak ada
    //   file "yatim" bila validasi gagal. Lalu upload baru → update record →
    //   hapus file lama (best-effort).
    if (replaceId) {
      const ukuranKb = Math.round(file.size / 1024);

      if (tipe === "raw") {
        const old = await prisma.rawDocument.findUnique({
          where: { id: replaceId },
          select: { filename: true, sopDocumentId: true },
        });
        if (!old || old.sopDocumentId !== sopDocumentId) {
          return NextResponse.json(
            { error: "Dokumen yang akan diganti tidak ditemukan." },
            { status: 404 }
          );
        }
        const path = buildStoragePath({
          prefix: sopDocumentId,
          filename: file.name,
        });
        const buffer = Buffer.from(await file.arrayBuffer());
        await uploadFile({ bucket, path, file: buffer, contentType: mime });
        await prisma.rawDocument.update({
          where: { id: replaceId },
          data: {
            filename: path,
            mimeType: mime,
            ukuranKb,
            uploadedById: session.user.id,
          },
        });
        try {
          await deleteFile({ bucket, path: old.filename });
        } catch (e) {
          console.error("[upload] Gagal hapus file lama (raw):", e);
        }
        return NextResponse.json({ id: replaceId, path, bucket, replaced: true });
      }

      if (tipe === "attachment") {
        const old = await prisma.sopAttachment.findUnique({
          where: { id: replaceId },
          select: { filename: true, sopDocumentId: true, tipe: true },
        });
        if (!old || old.sopDocumentId !== sopDocumentId) {
          return NextResponse.json(
            { error: "Lampiran yang akan diganti tidak ditemukan." },
            { status: 404 }
          );
        }
        // Aturan mengikuti tipe lampiran LAMA (utama tetap PDF, lampiran tetap ZIP)
        const oldRules = resolveRules(
          bucket,
          (old.tipe as "utama" | "lampiran") ?? "lampiran"
        );
        if (!oldRules.allowedMime.includes(mime)) {
          return NextResponse.json({ error: oldRules.hint }, { status: 400 });
        }
        if (file.size > oldRules.maxSizeMb * 1024 * 1024) {
          return NextResponse.json(
            { error: `Ukuran file melebihi ${oldRules.maxSizeMb}MB.` },
            { status: 400 }
          );
        }
        const path = buildStoragePath({
          prefix: sopDocumentId,
          filename: file.name,
        });
        const buffer = Buffer.from(await file.arrayBuffer());
        await uploadFile({ bucket, path, file: buffer, contentType: mime });
        await prisma.sopAttachment.update({
          where: { id: replaceId },
          data: {
            filename: path,
            mimeType: mime,
            ukuranKb,
            uploadedById: session.user.id,
          },
        });
        try {
          await deleteFile({ bucket, path: old.filename });
        } catch (e) {
          console.error("[upload] Gagal hapus file lama (attachment):", e);
        }
        return NextResponse.json({ id: replaceId, path, bucket, replaced: true });
      }

      return NextResponse.json(
        { error: "Tipe replace tidak valid." },
        { status: 400 }
      );
    }

    const path = buildStoragePath({
      prefix: sopDocumentId,
      filename: file.name,
    });
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile({ bucket, path, file: buffer, contentType: mime });

    const ukuranKb = Math.round(file.size / 1024);

    if (tipe === "raw") {
      const row = await prisma.rawDocument.create({
        data: {
          sopDocumentId,
          filename: path,
          mimeType: mime,
          ukuranKb,
          uploadedById: session.user.id,
        },
      });
      return NextResponse.json({ id: row.id, path, bucket });
    }

    if (tipe === "attachment") {
      const row = await prisma.sopAttachment.create({
        data: {
          sopDocumentId,
          filename: path,
          mimeType: mime,
          ukuranKb,
          uploadedById: session.user.id,
          tipe: attachmentTipe,
        },
      });
      return NextResponse.json({
        id: row.id,
        path,
        bucket,
        tipe: attachmentTipe,
      });
    }

    if (tipe === "sosialisasi") {
      const existing = await prisma.sosialisasiAttachment.count({
        where: { userId: session.user.id, sopDocumentId },
      });
      const row = await prisma.sosialisasiAttachment.create({
        data: {
          userId: session.user.id,
          sopDocumentId,
          filename: path,
          mimeType: mime,
          ukuranKb,
          uploadKe: existing + 1,
          status: "menunggu",
        },
      });

      const admins = await prisma.user.findMany({
        where: { role: { in: ["admin", "superadmin"] }, status: "aktif" },
        select: { id: true },
      });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            sopDocumentId,
            tipe: "attachment" as const,
            judul: "Bukti Sosialisasi Baru",
            pesan: `${
              session.user.name ?? "User"
            } mengupload bukti sosialisasi (upload ke-${existing + 1}).`,
          })),
        });
      }

      return NextResponse.json({ id: row.id, path, bucket });
    }

    return NextResponse.json({ error: "Invalid tipe" }, { status: 400 });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
