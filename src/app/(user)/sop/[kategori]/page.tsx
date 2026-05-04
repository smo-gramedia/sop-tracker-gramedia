// src/app/(user)/sop/[kategori]/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { SOP_KATEGORI_LABEL } from "@/lib/constants";
import type { SopKategori } from "@prisma/client";
import SopKategoriClient from "@/components/user/SopKategoriClient";

const VALID_KATEGORI = ["sr", "ss", "sp", "sg"] as const;

type Props = { params: { kategori: string } };

export default async function SopKategoriPage({ params }: Props) {
  const { kategori } = params;

  // Backward compat: redirect /sop/petunjuk → /juklak
  if (kategori === "petunjuk") redirect("/juklak");

  if (!VALID_KATEGORI.includes(kategori as never)) notFound();

  const session = await auth();
  const userId = session!.user.id;

  // ─── Fetch SOPs untuk kategori ini ────────────────────────────
  const documents = await prisma.sopDocument.findMany({
    where: { kategori: kategori as SopKategori, status: "aktif" },
    orderBy: { kode: "asc" },
    include: {
      department: {
        include: {
          division: {
            include: { directorate: true },
          },
        },
      },
      subcategory: { select: { id: true, kode: true, nama: true } },
    },
  });

  // ─── Progress user ────────────────────────────────────────────
  const myProgress = await prisma.learningProgress.findMany({
    where: {
      userId,
      sopDocumentId: { in: documents.map((d) => d.id) },
    },
    select: { sopDocumentId: true, status: true, stepCurrent: true },
  });
  const progressMap = Object.fromEntries(
    myProgress.map((p) => [p.sopDocumentId, p])
  );

  const pageTitle = SOP_KATEGORI_LABEL[kategori] ?? kategori.toUpperCase();

  // ─── Build hierarchy tree khusus utk kategori ini ─────────────
  // Untuk SG: tree by Subcategory (tanpa department)
  // Untuk SR/SS/SP: tree by Division → Department
  if (kategori === "sg") {
    const subcategories = await prisma.sopSubcategory.findMany({
      orderBy: { kode: "asc" },
      select: { id: true, kode: true, nama: true, deskripsi: true },
    });

    // Hitung jumlah SOP per subcategory
    const subcategoryCounts: Record<string, number> = {};
    documents.forEach((d) => {
      if (d.subcategoryId) {
        subcategoryCounts[d.subcategoryId] =
          (subcategoryCounts[d.subcategoryId] ?? 0) + 1;
      }
    });

    return (
      <SopKategoriClient
        mode="subcategory"
        kategori={kategori}
        pageTitle={pageTitle}
        documents={documents.map((d) => serializeDoc(d, progressMap[d.id]))}
        subcategories={subcategories.map((s) => ({
          ...s,
          count: subcategoryCounts[s.id] ?? 0,
        }))}
      />
    );
  }

  // SR / SS / SP — Tree by Division → Department
  // Ambil semua division+department yang punya SOP kategori ini, atau semua
  // division (supaya sidebar tetap terisi walau belum ada SOP-nya)
  const allDivisions = await prisma.division.findMany({
    orderBy: { nama: "asc" },
    include: {
      departments: { orderBy: { nama: "asc" } },
      directorate: { select: { id: true, nama: true, singkatan: true } },
    },
  });

  // Hitung jumlah SOP per division & per department
  const divisionCounts: Record<string, number> = {};
  const departmentCounts: Record<string, number> = {};
  documents.forEach((d) => {
    if (d.department) {
      departmentCounts[d.department.id] =
        (departmentCounts[d.department.id] ?? 0) + 1;
      divisionCounts[d.department.divisionId] =
        (divisionCounts[d.department.divisionId] ?? 0) + 1;
    }
  });

  // Filter: hanya tampilkan division yang punya SOP (kalau tidak ada sama sekali, tampilkan semua)
  const divisionsWithCount = allDivisions
    .map((div) => ({
      id: div.id,
      kode: div.kode,
      nama: div.nama,
      deskripsi: div.deskripsi,
      directorateNama: div.directorate.nama,
      count: divisionCounts[div.id] ?? 0,
      departments: div.departments.map((dept) => ({
        id: dept.id,
        kode: dept.kode,
        nama: dept.nama,
        count: departmentCounts[dept.id] ?? 0,
      })),
    }))
    .filter((d) => d.count > 0);

  // Fallback: kalau filter di atas mengosongkan semua, tampilkan semua division
  const finalDivisions =
    divisionsWithCount.length > 0
      ? divisionsWithCount
      : allDivisions.map((div) => ({
          id: div.id,
          kode: div.kode,
          nama: div.nama,
          deskripsi: div.deskripsi,
          directorateNama: div.directorate.nama,
          count: 0,
          departments: div.departments.map((dept) => ({
            id: dept.id,
            kode: dept.kode,
            nama: dept.nama,
            count: 0,
          })),
        }));

  return (
    <SopKategoriClient
      mode="division"
      kategori={kategori}
      pageTitle={pageTitle}
      documents={documents.map((d) => serializeDoc(d, progressMap[d.id]))}
      divisions={finalDivisions}
    />
  );
}

// Serializer untuk dokumen — convert Date → string supaya bisa pass ke client component
function serializeDoc(d: any, progress: any) {
  return {
    id: d.id,
    kode: d.kode,
    judul: d.judul,
    deskripsi: d.deskripsi as string | null,
    tipe: d.tipe as string,
    versi: d.versi as string,
    tanggalBerlaku: d.tanggalBerlaku?.toISOString() ?? null,
    departmentId: d.departmentId as string | null,
    departmentNama: d.department?.nama ?? null,
    divisionId: d.department?.divisionId ?? null,
    divisionNama: d.department?.division?.nama ?? null,
    subcategoryId: d.subcategoryId as string | null,
    subcategoryNama: d.subcategory?.nama ?? null,
    progressStatus: (progress?.status as string | null) ?? null,
    stepCurrent: (progress?.stepCurrent as number | null) ?? null,
  };
}
