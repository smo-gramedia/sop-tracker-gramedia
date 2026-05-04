// src/app/(user)/juklak/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JuklakClient from "@/components/user/JuklakClient";

export default async function JuklakPage() {
  const session = await auth();

  // Ambil semua dokumen kategori "petunjuk" yang aktif
  const documents = await prisma.sopDocument.findMany({
    where: {
      kategori: "petunjuk",
      status: "aktif",
    },
    orderBy: { kode: "asc" },
    select: {
      id: true,
      kode: true,
      judul: true,
      tanggalBerlaku: true,
      permittedAccess: true,
      department: { select: { id: true, nama: true } },
    },
  });

  // Untuk progress badge per dokumen (apakah user sedang/sudah belajar)
  const myProgress = await prisma.learningProgress.findMany({
    where: {
      userId: session!.user.id,
      sopDocumentId: { in: documents.map((d) => d.id) },
    },
    select: {
      sopDocumentId: true,
      status: true,
    },
  });
  const progressMap = Object.fromEntries(
    myProgress.map((p) => [p.sopDocumentId, p.status])
  );

  // Unique permitted access values untuk filter dropdown
  const accessValues = Array.from(
    new Set(documents.map((d) => d.permittedAccess).filter(Boolean) as string[])
  ).sort();

  // Unique departemen untuk filter "Kategori" (di prototype dia panggil "Kategori"
  // tapi sebenarnya ini grouping per departemen. Saya pakai departemen.)
  const departmentValues = Array.from(
    new Set(documents.map((d) => d.department?.nama).filter(Boolean) as string[])
  ).sort();

  return (
    <JuklakClient
      documents={documents.map((d) => ({
        id: d.id,
        kode: d.kode,
        judul: d.judul,
        tanggalBerlaku: d.tanggalBerlaku?.toISOString() ?? null,
        permittedAccess: d.permittedAccess,
        departmentNama: d.department?.nama ?? null,
        progressStatus: progressMap[d.id] ?? null,
      }))}
      accessValues={accessValues}
      departmentValues={departmentValues}
    />
  );
}
