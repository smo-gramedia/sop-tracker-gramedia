// src/app/api/search/route.ts
/**
 * Global Search API
 *
 * Endpoint: GET /api/search?q={keyword}&limit={n}
 *
 * Cari SOP berdasarkan kode, judul, atau deskripsi.
 * Hanya return dokumen dengan status='aktif' untuk user-facing search.
 * Untuk admin yang butuh akses ke semua status, pakai page /upload-dokumen.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { allowedKategori } from "@/lib/access";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limitParam = parseInt(searchParams.get("limit") ?? "5", 10);
  // Hard cap: 50 supaya tidak abuse
  const limit = Math.min(Math.max(limitParam, 1), 50);

  // Minimum 2 karakter supaya tidak cari kata yang terlalu generic
  if (q.length < 2) {
    return NextResponse.json({ results: [], total: 0, query: q });
  }

  // ─── Batasi hasil sesuai tipe akun ────────────────────────────────
  // Tanpa ini, pencarian akan membocorkan judul & kode SOP dari kategori
  // yang seharusnya tidak dapat diakses unit tersebut.
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tipeUser: true },
  });
  const kategoriBoleh = allowedKategori({
    role: session.user.role,
    tipeUser: me?.tipeUser ?? null,
  });
  if (kategoriBoleh.length === 0) {
    return NextResponse.json({ results: [], total: 0, query: q });
  }

  // Search di kode, judul, dan deskripsi (case-insensitive)
  // Hanya status 'aktif' supaya tidak tampilkan SOP obsolete/draft
  const where = {
    status: "aktif" as const,
    kategori: { in: kategoriBoleh as never[] },
    OR: [
      { kode: { contains: q, mode: "insensitive" as const } },
      { judul: { contains: q, mode: "insensitive" as const } },
      { deskripsi: { contains: q, mode: "insensitive" as const } },
    ],
  };

  const [results, total] = await Promise.all([
    prisma.sopDocument.findMany({
      where,
      take: limit,
      orderBy: [
        // Prioritas: kode match exact dulu, lalu judul, lalu deskripsi
        { kode: "asc" },
      ],
      select: {
        id: true,
        kode: true,
        judul: true,
        kategori: true,
        deskripsi: true,
        versi: true,
        department: { select: { nama: true } },
      },
    }),
    prisma.sopDocument.count({ where }),
  ]);

  return NextResponse.json({
    results,
    total,
    query: q,
    limit,
  });
}
