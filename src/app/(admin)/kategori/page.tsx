// src/app/(admin)/kategori/page.tsx  (replace existing)
import { prisma } from "@/lib/prisma";
import KategoriClient from "@/components/admin/KategoriClient";

export default async function KategoriPage() {
  const subcategories = await prisma.sopSubcategory.findMany({
    orderBy: { kode: "asc" },
    include: { _count: { select: { sopDocuments: true } } },
  });
  return <KategoriClient subcategories={subcategories}/>;
}
