// src/app/(admin)/struktur-organisasi/department/page.tsx
import { prisma } from "@/lib/prisma";
import DepartmentClient from "@/components/admin/DepartmentClient";

export default async function DepartmentPage() {
  const [items, directorates] = await Promise.all([
    prisma.department.findMany({
      orderBy: [
        { division: { directorate: { nama: "asc" } } },
        { division: { nama: "asc" } },
        { kode: "asc" },
      ],
      include: {
        division: {
          select: {
            id: true,
            nama: true,
            directorate: {
              select: { id: true, nama: true, singkatan: true },
            },
          },
        },
        _count: { select: { sopDocuments: true } },
      },
    }),
    prisma.directorate.findMany({
      orderBy: { nama: "asc" },
      include: {
        divisions: {
          orderBy: { nama: "asc" },
          select: { id: true, nama: true, directorateId: true },
        },
      },
    }),
  ]);

  return <DepartmentClient items={items} directorates={directorates} />;
}
