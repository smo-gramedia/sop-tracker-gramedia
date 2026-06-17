// src/app/(user)/cari/page.tsx
import { prisma } from "@/lib/prisma";
import CariClient from "@/components/user/CariClient";

// ─── Next.js 16: searchParams sekarang Promise ──────────────────
type Props = {
  searchParams: Promise<{ q?: string; kategori?: string }>;
};

export default async function CariPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const kategoriFilter = params.kategori ?? "";

  // Kalau query kosong, return tanpa fetch
  if (q.length < 2) {
    return <CariClient query={q} results={[]} total={0} kategoriFilter={kategoriFilter} />;
  }

  const where = {
    status: "aktif" as const,
    ...(kategoriFilter && { kategori: kategoriFilter as any }),
    OR: [
      { kode: { contains: q, mode: "insensitive" as const } },
      { judul: { contains: q, mode: "insensitive" as const } },
      { deskripsi: { contains: q, mode: "insensitive" as const } },
    ],
  };

  const [results, total] = await Promise.all([
    prisma.sopDocument.findMany({
      where,
      take: 50, // max 50 hasil per halaman
      orderBy: { kode: "asc" },
      select: {
        id: true,
        kode: true,
        judul: true,
        kategori: true,
        deskripsi: true,
        versi: true,
        createdAt: true,
        department: { select: { nama: true } },
      },
    }),
    prisma.sopDocument.count({ where }),
  ]);

  return (
    <CariClient
      query={q}
      results={results}
      total={total}
      kategoriFilter={kategoriFilter}
    />
  );
}
