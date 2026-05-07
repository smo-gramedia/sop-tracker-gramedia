// src/app/(admin)/struktur-organisasi/directorate/page.tsx
import { prisma } from "@/lib/prisma";
import DirectorateClient from "@/components/admin/DirectorateClient";

export default async function DirectoratePage() {
  const items = await prisma.directorate.findMany({
    orderBy: { kode: "asc" },
    include: { _count: { select: { divisions: true } } },
  });

  return <DirectorateClient items={items} />;
}
