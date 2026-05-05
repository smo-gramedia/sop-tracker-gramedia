// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BUCKETS,
  uploadFile,
  buildStoragePath,
  validateFile,
  type BucketName,
} from "@/lib/storage";

const BUCKET_RULES: Record<
  BucketName,
  { maxSizeMb: number; allowedMime: string[]; requireRole?: string[] }
> = {
  "raw-documents": {
    maxSizeMb: 50,
    allowedMime: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    requireRole: ["admin", "superadmin"],
  },
  "sop-attachments": {
    maxSizeMb: 50,
    allowedMime: [
      "application/zip",
      "application/x-zip-compressed",
      "application/pdf",
    ],
    requireRole: ["admin", "superadmin"],
  },
  sosialisasi: {
    maxSizeMb: 10,
    allowedMime: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    // user biasa juga boleh
  },
};

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

  const rules = BUCKET_RULES[bucket];
  if (rules.requireRole && !rules.requireRole.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const validation = validateFile(file, rules);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  // Verifikasi SOP exists — FIX: pakai prisma.sopDocument (camelCase)
  const sop = await prisma.sopDocument.findUnique({
    where: { id: sopDocumentId },
    select: { id: true },
  });
  if (!sop) {
    return NextResponse.json({ error: "SOP not found" }, { status: 404 });
  }

  try {
    const path = buildStoragePath({
      prefix: sopDocumentId,
      filename: file.name,
    });
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile({ bucket, path, file: buffer, contentType: file.type });

    const ukuranKb = Math.round(file.size / 1024);

    // Insert metadata sesuai tipe
    if (tipe === "raw") {
      // FIX: prisma.rawDocument (camelCase)
      const row = await prisma.rawDocument.create({
        data: {
          sopDocumentId,
          filename: path, // simpan path lengkap di kolom filename
          mimeType: file.type,
          ukuranKb,
          uploadedById: session.user.id,
        },
      });
      return NextResponse.json({ id: row.id, path, bucket });
    }

    if (tipe === "attachment") {
      // FIX: prisma.sopAttachment (camelCase)
      const row = await prisma.sopAttachment.create({
        data: {
          sopDocumentId,
          filename: path,
          mimeType: file.type,
          ukuranKb,
          uploadedById: session.user.id,
        },
      });
      return NextResponse.json({ id: row.id, path, bucket });
    }

    if (tipe === "sosialisasi") {
      // FIX: prisma.sosialisasiAttachment (camelCase)
      // Hitung uploadKe (berapa kali upload ulang)
      const existing = await prisma.sosialisasiAttachment.count({
        where: { userId: session.user.id, sopDocumentId },
      });
      const row = await prisma.sosialisasiAttachment.create({
        data: {
          userId: session.user.id,
          sopDocumentId,
          filename: path,
          mimeType: file.type,
          ukuranKb,
          uploadKe: existing + 1,
          status: "menunggu",
        },
      });

      // Notif ke admin — FIX: prisma.user dan prisma.notification (camelCase)
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
