// src/app/(user)/sop/[kategori]/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { SOP_KATEGORI_LABEL } from "@/lib/constants";
import type { SopKategori } from "@prisma/client";
import SopKategoriClient from "@/components/user/SopKategoriClient";

const VALID_KATEGORI = ["sr", "ss", "sp", "sg", "petunjuk"] as const;

// ─── Next.js 16: params sekarang Promise ───────────────────────────
type Props = { params: Promise<{ kategori: string }> };

export default async function SopKategoriPage({ params }: Props) {
  const { kategori } = await params;

  // Redirect: /sop/petunjuk → /juklak (halaman juklak yang utama)
  // Backward compat untuk bookmark/link lama
  if (kategori === "petunjuk") {
    redirect("/juklak");
  }

  if (!VALID_KATEGORI.includes(kategori as never)) notFound();

  const session = await auth();
  const isAdmin = ["admin", "superadmin"].includes(session!.user.role);

  const [documents, subcategories, divisions] = await Promise.all([
    prisma.sopDocument.findMany({
      where: { kategori: kategori as SopKategori, status: "aktif" },
      orderBy: { kode: "asc" },
      include: {
        department: {
          select: {
            id: true,
            nama: true,
            divisionId: true,
            division: { select: { id: true, nama: true } },
          },
        },
        subcategory: { select: { id: true, nama: true } },
        sopAttachments: {
          where: { tipe: "utama" },
          select: { id: true, filename: true },
          take: 1,
        },
      },
    }),
    kategori === "sg"
      ? prisma.sopSubcategory.findMany({ orderBy: { kode: "asc" } })
      : Promise.resolve([]),
    // Fetch divisions+departments untuk sidebar (kategori non-sg, non-petunjuk)
    kategori !== "sg"
      ? prisma.division.findMany({
          orderBy: { nama: "asc" },
          include: {
            departments: {
              orderBy: { nama: "asc" },
              select: { id: true, nama: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  // Get user's learning progress for these docs
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
    myProgress.map((p) => [p.sopDocumentId, p])
  );

  const pageTitle = SOP_KATEGORI_LABEL[kategori] ?? kategori.toUpperCase();

  return (
    <SopKategoriClient
      kategori={kategori}
      pageTitle={pageTitle}
      documents={documents as any}
      totalDocs={documents.length}
      progressList={myProgress}
      progressMap={progressMap}
      isAdmin={isAdmin}
      divisions={divisions as any}
      subcategories={subcategories as any}
    />
  );
}
