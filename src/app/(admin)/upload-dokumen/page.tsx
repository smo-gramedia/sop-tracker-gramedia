// src/app/(admin)/upload-dokumen/page.tsx  (replace existing)
import { prisma } from "@/lib/prisma";
import { getSopDocuments } from "@/actions/sop-document";
import UploadDokumenClient from "@/components/admin/UploadDokumenClient";

export default async function UploadDokumenPage() {
  const [{ data: docs, total }, directorates, subcategories] = await Promise.all([
    getSopDocuments({ pageSize: 50 }),
    prisma.directorate.findMany({
      orderBy: { kode: "asc" },
      include: {
        divisions: {
          orderBy: { kode: "asc" },
          include: { departments: { orderBy: { kode: "asc" } } },
        },
      },
    }),
    prisma.sopSubcategory.findMany({ orderBy: { kode: "asc" } }),
  ]);

  return (
    <UploadDokumenClient
      docs={docs}
      total={total}
      directorates={directorates}
      subcategories={subcategories}
    />
  );
}
