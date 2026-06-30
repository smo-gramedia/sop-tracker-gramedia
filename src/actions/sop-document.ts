"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SopKategori, SopTipe, SopStatus } from "@prisma/client";

const SopDocumentSchema = z.object({
  kode:           z.string().min(1),
  judul:          z.string().min(1),
  deskripsi:      z.string().optional(),
  kategori:       z.enum(["sr","ss","sp","sg","petunjuk"]),
  tipe:           z.enum(["MP","PS","IK","petunjuk"]),
  permittedAccess:z.string().optional(),
  subcategoryId:  z.string().optional().nullable(),
  departmentId:   z.string().optional().nullable(),
  versi:          z.string().default("Original"),
  tanggalBerlaku: z.string().optional(),
  status:         z.enum(["aktif","draft","obsolete"]).default("draft"),
});

export async function createSopDocument(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData);
  const parsed = SopDocumentSchema.parse(raw);

  // ─── Item 5 & 6: Versioning Logic ─────────────────────────────────
  // Cek apakah ada SOP existing dengan kode yang sama
  // Boleh submit versi baru kalau yang lama statusnya 'obsolete' atau 'draft'
  // Reject (dengan pesan ramah) kalau yang lama masih 'aktif'
  const existing = await prisma.sopDocument.findFirst({
    where: { kode: parsed.kode },
    select: { id: true, versi: true, status: true },
  });

  if (existing) {
    if (existing.status === "aktif") {
      throw new Error(
        `SOP sudah dibuat dengan versi ${existing.versi}. Cek di tabel Upload Dokumen, hapus atau ubah status dokumen terlebih dahulu menjadi obsolete dan silahkan coba lagi.`
      );
    }
    // Kalau status 'obsolete' atau 'draft' → boleh lanjut submit versi baru
  }

  try {
    const doc = await prisma.sopDocument.create({
      data: {
        ...parsed,
        tanggalBerlaku: parsed.tanggalBerlaku ? new Date(parsed.tanggalBerlaku) : null,
        uploadedById: session.user.id,
      },
    });

    revalidatePath("/upload-dokumen");
    revalidatePath("/raw-dokumen");
    return { success: true, id: doc.id };
  } catch (err: any) {
    // ─── Backup error handler: kalau Prisma still throw P2002 (unique constraint) ──
    // (Misal race condition di mana 2 admin submit bersamaan dengan kode sama)
    if (err?.code === "P2002") {
      throw new Error(
        `SOP dengan kode ${parsed.kode} sudah terdaftar. Periksa di tabel Upload Dokumen, hapus atau ubah status dokumen lama menjadi obsolete terlebih dahulu.`
      );
    }
    throw err;
  }
}

export async function updateSopDocument(id: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData);
  const parsed = SopDocumentSchema.partial().parse(raw);

  try {
    await prisma.sopDocument.update({
      where: { id },
      data: {
        ...parsed,
        tanggalBerlaku: parsed.tanggalBerlaku ? new Date(parsed.tanggalBerlaku) : undefined,
        updatedById: session.user.id,
      },
    });

    revalidatePath("/upload-dokumen");
    revalidatePath("/raw-dokumen");
    return { success: true };
  } catch (err: any) {
    // ─── Handle composite unique constraint kode+versi ──
    if (err?.code === "P2002") {
      throw new Error(
        `Sudah ada SOP lain dengan kombinasi kode "${parsed.kode}" + versi "${parsed.versi}". Silahkan gunakan versi yang berbeda.`
      );
    }
    throw err;
  }
}

export async function deleteSopDocument(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");

  await prisma.sopDocument.delete({ where: { id } });
  revalidatePath("/upload-dokumen");
  return { success: true };
}

export async function getSopDocuments(opts?: {
  kategori?: SopKategori;
  status?: SopStatus;
  departmentId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page     = opts?.page     ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const skip     = (page - 1) * pageSize;

  const where = {
    ...(opts?.kategori     && { kategori:     opts.kategori }),
    ...(opts?.status       && { status:       opts.status }),
    ...(opts?.departmentId && { departmentId: opts.departmentId }),
    ...(opts?.search       && {
      OR: [
        { judul: { contains: opts.search, mode: "insensitive" as const } },
        { kode:  { contains: opts.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.sopDocument.findMany({
      where, skip, take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        department:  { select: { id: true, nama: true, kode: true } },
        subcategory: { select: { id: true, nama: true, kode: true } },
        uploadedBy:  { select: { id: true, nama: true } },
      },
    }),
    prisma.sopDocument.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ─────────────────────────────────────────────────────────────────────
// E3: Ambil daftar file sebuah SOP (untuk fitur "Ganti File" di Edit)
// ─────────────────────────────────────────────────────────────────────
export async function getSopFiles(sopId: string) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  const [attachments, raw] = await Promise.all([
    prisma.sopAttachment.findMany({
      where: { sopDocumentId: sopId },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        ukuranKb: true,
        tipe: true,
      },
      orderBy: { uploadedAt: "asc" },
    }),
    prisma.rawDocument.findFirst({
      where: { sopDocumentId: sopId },
      select: { id: true, filename: true, mimeType: true, ukuranKb: true },
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  const utama = attachments.find((a) => a.tipe === "utama") ?? null;
  const lampiran = attachments.filter((a) => a.tipe !== "utama");

  return { utama, raw, lampiran };
}
