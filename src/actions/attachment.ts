"use server";

// src/actions/attachment.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────────
// GET — Fetch list attachments untuk admin review
// ─────────────────────────────────────────────────────────────────
export async function getAttachments(opts?: {
  status?: "menunggu" | "disetujui" | "ditolak" | "pending";
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["admin", "superadmin"].includes(session.user.role)) {
    throw new Error("Forbidden");
  }

  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const where = opts?.status ? { status: opts.status } : {};

  const [data, total] = await Promise.all([
    prisma.sosialisasiAttachment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { uploadedAt: "desc" },
      include: {
        user: {
          select: { id: true, nama: true, unit: true, email: true },
        },
        sopDocument: {
          select: { id: true, kode: true, judul: true },
        },
      },
    }),
    prisma.sosialisasiAttachment.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─────────────────────────────────────────────────────────────────
// REVIEW — Setujui / tolak / pending attachment
// ─────────────────────────────────────────────────────────────────
export async function reviewAttachment(
  attachmentId: string,
  decision: "disetujui" | "ditolak" | "pending",
  alasanTolak?: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["admin", "superadmin"].includes(session.user.role)) {
    throw new Error("Forbidden");
  }

  if (decision === "ditolak" && !alasanTolak?.trim()) {
    throw new Error("Alasan tolak wajib diisi");
  }

  const att = await prisma.sosialisasiAttachment.update({
    where: { id: attachmentId },
    data: {
      status: decision,
      alasanTolak: decision === "ditolak" ? alasanTolak ?? null : null,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  // Jika disetujui → buka step 5 (post test) di learningProgress
  if (decision === "disetujui") {
    await prisma.learningProgress.upsert({
      where: {
        userId_sopDocumentId: {
          userId: att.userId,
          sopDocumentId: att.sopDocumentId,
        },
      },
      update: { stepCurrent: 5 },
      create: {
        userId: att.userId,
        sopDocumentId: att.sopDocumentId,
        stepCurrent: 5,
        status: "dipelajari",
        startedAt: new Date(),
      },
    });
  }

  // Notifikasi ke user (hanya untuk decision yang final)
  if (decision === "disetujui" || decision === "ditolak") {
    await prisma.notification.create({
      data: {
        userId: att.userId,
        sopDocumentId: att.sopDocumentId,
        tipe: "attachment",
        judul: decision === "disetujui" ? "Bukti Disetujui" : "Bukti Ditolak",
        pesan:
          decision === "disetujui"
            ? "Bukti sosialisasi Anda disetujui. Silakan lanjut ke Post Test."
            : `Bukti sosialisasi ditolak. Alasan: ${alasanTolak ?? "-"}`,
      },
    });
  }

  // Activity log
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      sopDocumentId: att.sopDocumentId,
      action: `attachment_${decision}`,
      deskripsi: `${
        decision === "disetujui"
          ? "Setujui"
          : decision === "ditolak"
          ? "Tolak"
          : "Pending"
      } bukti sosialisasi attachment ${attachmentId}`,
    },
  });

  revalidatePath("/attachment");
  return { success: true };
}

// Alias backward-compat (kalau ada code lain yang masih panggil verifyAttachment)
export const verifyAttachment = reviewAttachment;

// ─────────────────────────────────────────────────────────────────
// DELETE — Hapus attachment (cleanup superadmin)
// ─────────────────────────────────────────────────────────────────
export async function deleteAttachment(attachmentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "superadmin") {
    throw new Error("Hanya superadmin yang boleh menghapus attachment");
  }

  await prisma.sosialisasiAttachment.delete({
    where: { id: attachmentId },
  });

  revalidatePath("/attachment");
  return { success: true };
}
