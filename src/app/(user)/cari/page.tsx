// src/app/(user)/cari/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import CariClient from "@/components/user/CariClient";
import { allowedKategori } from "@/lib/access";

// ─── Next.js 16: searchParams sekarang Promise ──────────────────
type Props = {
  searchParams: Promise<{ q?: string; kategori?: string }>;
};

export default async function CariPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const kategoriFilter = params.kategori ?? "";

  // ─── Batasi hasil sesuai tipe akun ────────────────────────────────
  // Halaman ini melakukan query sendiri (tidak lewat /api/search), jadi
  // penyaringannya harus dipasang di sini juga.
  const session = await auth();
  const me = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { tipeUser: true },
  });
  const kategoriBoleh = allowedKategori({
    role: session!.user.role,
    tipeUser: me?.tipeUser ?? null,
  });

  // Kalau query kosong atau akun belum bertipe, tidak perlu fetch
  if (q.length < 2 || kategoriBoleh.length === 0) {
    return (
      <CariClient
        query={q}
        results={[]}
        total={0}
        kategoriFilter={kategoriFilter}
        allowedKategori={kategoriBoleh}
      />
    );
  }

  // Filter kategori dari user tetap harus berada di dalam daftar yang boleh
  const kategoriEfektif =
    kategoriFilter && kategoriBoleh.includes(kategoriFilter as never)
      ? [kategoriFilter]
      : kategoriBoleh;

  const where = {
    status: "aktif" as const,
    kategori: { in: kategoriEfektif as never[] },
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
      allowedKategori={kategoriBoleh}
    />
  );
}
