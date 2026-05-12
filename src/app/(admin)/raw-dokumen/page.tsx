// src/app/(admin)/raw-dokumen/page.tsx
import { prisma } from "@/lib/prisma";
import RawDokumenClient from "@/components/admin/RawDokumenClient";

export default async function RawDokumenPage() {
  const rawDocs = await prisma.rawDocument.findMany({
    orderBy: { uploadedAt: "desc" },
    include: {
      sopDocument: {
        select: {
          kode: true,
          judul: true,
          kategori: true,
          status: true, // ← TAMBAH: untuk filter status di client
          department: { select: { nama: true } },
        },
      },
      uploadedBy: { select: { nama: true } },
    },
  });

  return <RawDokumenClient rawDocs={rawDocs} />;
}
