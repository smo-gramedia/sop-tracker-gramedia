"use server";
import { prisma } from "@/lib/prisma";
import { BucketName, deleteFile } from "@/lib/storage";
import { Session } from "next-auth";
import { resolveRules } from "@/actions/upload-utils";

export async function replaceFileAction({
  file,
  mime,
  bucket,
  sopDocumentId,
  tipe,
  replaceId,
  session,
  sizeOnKb,
  path,
  remoteId,
}: {
  path: string;
  file: File;
  mime: string;
  bucket: BucketName;
  sopDocumentId: string;
  tipe: string;
  replaceId: string;
  session: Session;
  sizeOnKb: number;
  remoteId: string;
}) {
  if (tipe === "raw") {
    const old = await prisma.rawDocument.findUnique({
      where: { id: replaceId },
      select: { filename: true, sopDocumentId: true, remoteId: true },
    });
    if (old?.sopDocumentId !== sopDocumentId) {
      return {
        error: "Dokumen yang akan diganti tidak ditemukan.",
        status: 404,
      };
    }

    await prisma.rawDocument.update({
      where: { id: replaceId },
      data: {
        filename: path,
        mimeType: mime,
        ukuranKb: sizeOnKb,
        uploadedById: session.user.id,
        remoteId: remoteId,
      },
    });
    try {
      await deleteFile({ id: old.remoteId });
    } catch (e) {
      console.error("[upload] Gagal hapus file lama (raw):", e);
    }
    return { id: replaceId, path, remoteId, bucket, replaced: true };
  }

  if (tipe === "attachment") {
    const old = await prisma.sopAttachment.findUnique({
      where: { id: replaceId },
      select: {
        filename: true,
        sopDocumentId: true,
        tipe: true,
        remoteId: true,
      },
    });
    if (old?.sopDocumentId !== sopDocumentId) {
      return {
        error: "Lampiran yang akan diganti tidak ditemukan.",
        status: 404,
      };
    }
    // Aturan mengikuti tipe lampiran LAMA (utama tetap PDF, lampiran tetap ZIP)
    const oldRules = resolveRules(
      bucket,
      (old.tipe as "utama" | "lampiran") ?? "lampiran",
    );
    if (!oldRules.allowedMime.includes(mime)) {
      return { error: oldRules.hint, status: 400 };
    }
    if (file.size > oldRules.maxSizeMb * 1024 * 1024) {
      return {
        error: `Ukuran file melebihi ${oldRules.maxSizeMb}MB.`,
        status: 400,
      };
    }

    await prisma.sopAttachment.update({
      where: { id: replaceId },
      data: {
        filename: path,
        remoteId: remoteId,
        mimeType: mime,
        ukuranKb: sizeOnKb,
        uploadedById: session.user.id,
      },
    });
    try {
      await deleteFile({ id: old.remoteId });
    } catch (e) {
      console.error("[upload] Gagal hapus file lama (attachment):", e);
    }
    return { id: replaceId, path, remoteId, bucket, replaced: true };
  }

  return { error: "Tipe replace tidak valid.", status: 400 };
}

export async function addFileUploadAction({
  mime,
  bucket,
  sopDocumentId,
  tipe,
  session,
  attachmentTipe,
  path,
  sizeOnKb,
  remoteId,
}: {
  path: string;
  sizeOnKb: number;
  mime: string;
  bucket: BucketName;
  sopDocumentId: string;
  tipe: string;
  session: Session;
  attachmentTipe: "utama" | "lampiran";
  remoteId: string;
}) {
  if (tipe === "raw") {
    const row = await prisma.rawDocument.create({
      data: {
        sopDocumentId,
        filename: path,
        mimeType: mime,
        ukuranKb: sizeOnKb,
        uploadedById: session.user.id,
        remoteId: remoteId,
      },
    });
    return { id: row.id, path, remoteId, bucket };
  }

  if (tipe === "attachment") {
    const row = await prisma.sopAttachment.create({
      data: {
        sopDocumentId,
        filename: path,
        mimeType: mime,
        ukuranKb: sizeOnKb,
        uploadedById: session.user.id,
        tipe: attachmentTipe,
        remoteId: remoteId,
      },
    });
    return { id: row.id, path, remoteId, bucket, tipe: attachmentTipe };
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
        ukuranKb: sizeOnKb,
        uploadKe: existing + 1,
        status: "menunggu",
        remoteId: remoteId,
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

    return { id: row.id, path, remoteId, bucket };
  }

  return { error: "Invalid tipe", status: 400 };
}
