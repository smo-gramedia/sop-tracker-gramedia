// src/app/(admin)/struktur-organisasi/division/page.tsx
import { prisma } from "@/lib/prisma";
import DivisionClient from "@/components/admin/DivisionClient";

export default async function DivisionPage() {
  const [items, directorates] = await Promise.all([
    prisma.division.findMany({
      orderBy: [{ directorate: { nama: "asc" } }, { kode: "asc" }],
      include: {
        directorate: {
          select: { id: true, nama: true, singkatan: true },
        },
        _count: { select: { departments: true } },
      },
    }),
    prisma.directorate.findMany({
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, singkatan: true },
    }),
  ]);

  return <DivisionClient items={items} directorates={directorates} />;
}
