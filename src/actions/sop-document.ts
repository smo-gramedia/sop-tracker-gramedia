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
}

export async function updateSopDocument(id: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData);
  const parsed = SopDocumentSchema.partial().parse(raw);

  await prisma.sopDocument.update({
    where: { id },
    data: {
      ...parsed,
      tanggalBerlaku: parsed.tanggalBerlaku ? new Date(parsed.tanggalBerlaku) : undefined,
      updatedById: session.user.id,
    },
  });

  revalidatePath("/upload-dokumen");
  return { success: true };
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
