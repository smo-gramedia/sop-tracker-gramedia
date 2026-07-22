// src/app/(user)/juklak/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JuklakClient from "@/components/user/JuklakClient";

export default async function JuklakPage() {
  const session = await auth();
  const isAdmin = ["admin", "superadmin"].includes(session!.user.role);

  // Akun Audit boleh view/download tanpa menyelesaikan pembelajaran.
  const me = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { tipeUser: true },
  });
  const isAudit = me?.tipeUser === "audit";

  // Ambil semua dokumen kategori "petunjuk" yang aktif
  const documents = await prisma.sopDocument.findMany({
    where: {
      kategori: "petunjuk",
      status: "aktif",
    },
    orderBy: [{ juklakKategori: "asc" }, { kode: "asc" }],
    select: {
      id: true,
      kode: true,
      judul: true,
      deskripsi: true,
      versi: true,
      tanggalBerlaku: true,
      permittedAccess: true,
      juklakKategori: true,
      department: { select: { id: true, nama: true } },
      sopAttachments: {
        where: { tipe: "utama" },
        select: { id: true, filename: true },
        take: 1,
      },
    },
  });

  // Progress per dokumen (full: stepCurrent + status)
  const myProgress = await prisma.learningProgress.findMany({
    where: {
      userId: session!.user.id,
      sopDocumentId: { in: documents.map((d) => d.id) },
    },
    select: {
      sopDocumentId: true,
      stepCurrent: true,
      status: true,
    },
  });
  const progressMap = Object.fromEntries(
    myProgress.map((p) => [
      p.sopDocumentId,
      { stepCurrent: p.stepCurrent, status: p.status },
    ])
  );

  // Unique values untuk filter
  const accessValues = Array.from(
    new Set(documents.map((d) => d.permittedAccess).filter(Boolean) as string[])
  ).sort();
  const departmentValues = Array.from(
    new Set(documents.map((d) => d.department?.nama).filter(Boolean) as string[])
  ).sort();

  return (
    <JuklakClient
      documents={documents.map((d) => ({
        id: d.id,
        kode: d.kode,
        judul: d.judul,
        deskripsi: d.deskripsi,
        versi: d.versi,
        tanggalBerlaku: d.tanggalBerlaku?.toISOString() ?? null,
        permittedAccess: d.permittedAccess,
        juklakKategori: d.juklakKategori,
        departmentNama: d.department?.nama ?? null,
        sopAttachments: d.sopAttachments,
      }))}
      progressMap={progressMap}
      accessValues={accessValues}
      departmentValues={departmentValues}
      isAdmin={isAdmin}
      isAudit={isAudit}
    />
  );
}
