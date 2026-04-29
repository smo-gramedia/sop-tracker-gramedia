"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function reviewAttachment(
  attachmentId: string,
  decision: "disetujui" | "ditolak" | "pending",
  alasanTolak?: string
) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  const attachment = await prisma.sosialisasiAttachment.update({
    where: { id: attachmentId },
    data: {
      status:      decision,
      alasanTolak: decision === "ditolak" ? alasanTolak : null,
      reviewedById: session.user.id,
      reviewedAt:   new Date(),
    },
    include: { user: true, sopDocument: true },
  });

  // Send notification to user
  if (decision === "disetujui" || decision === "ditolak") {
    await prisma.notification.create({
      data: {
        userId:        attachment.userId,
        sopDocumentId: attachment.sopDocumentId,
        tipe:          "attachment",
        judul:         decision === "disetujui"
          ? "Bukti sosialisasi disetujui"
          : "Bukti sosialisasi ditolak",
        pesan: decision === "disetujui"
          ? `Bukti sosialisasi untuk SOP "${attachment.sopDocument.judul}" telah disetujui. Post Test sudah dapat dikerjakan.`
          : `Bukti sosialisasi untuk SOP "${attachment.sopDocument.judul}" ditolak. Alasan: ${alasanTolak ?? "—"}. Silakan upload ulang.`,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId:        attachment.userId,
        sopDocumentId: attachment.sopDocumentId,
        action:        decision === "disetujui" ? "attachment_disetujui" : "attachment_ditolak",
        deskripsi:     decision === "disetujui"
          ? `Bukti sosialisasi disetujui oleh admin`
          : `Bukti sosialisasi ditolak. Alasan: ${alasanTolak}`,
      },
    });
  }

  revalidatePath("/attachment");
  return { success: true };
}

export async function getAttachments(opts?: {
  status?: string;
  sopDocumentId?: string;
  search?: string;
  page?: number;
}) {
  const page = opts?.page ?? 1;
  const take = 20;
  const skip = (page - 1) * take;

  const where = {
    ...(opts?.status        && { status: opts.status as never }),
    ...(opts?.sopDocumentId && { sopDocumentId: opts.sopDocumentId }),
    ...(opts?.search        && {
      OR: [
        { user: { nama: { contains: opts.search, mode: "insensitive" as const } } },
        { sopDocument: { judul: { contains: opts.search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.sosialisasiAttachment.findMany({
      where, skip, take,
      orderBy: { uploadedAt: "desc" },
      include: {
        user:        { select: { id: true, nama: true, kodeKaryawan: true, unit: true } },
        sopDocument: { select: { id: true, kode: true, judul: true } },
        reviewedBy:  { select: { id: true, nama: true } },
      },
    }),
    prisma.sosialisasiAttachment.count({ where }),
  ]);

  return { data, total, page, pageSize: take, totalPages: Math.ceil(total / take) };
}
