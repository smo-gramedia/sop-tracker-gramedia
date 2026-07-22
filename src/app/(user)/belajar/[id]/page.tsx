// src/app/(user)/belajar/[id]/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BelajarClient from "@/components/user/BelajarClient";
import AksesDitolak from "@/components/user/AksesDitolak";
import {
  canAccessKategori,
  isTipeBelumDitentukan,
  PESAN_TIDAK_BERHAK,
  PESAN_TIPE_BELUM_DITENTUKAN,
} from "@/lib/access";

// ─── Next.js 16: params sekarang Promise, harus di-await ──────────
type Props = { params: Promise<{ id: string }> };

export default async function BelajarPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const [doc, progress, postTest, latestAttachment, note] = await Promise.all([
    prisma.sopDocument.findUnique({
      where: { id },
      include: {
        department: { select: { nama: true } },
        subcategory: { select: { nama: true } },
        rawDocuments: { orderBy: { uploadedAt: "desc" }, take: 1 },
        // Fetch ALL sopAttachments (akan di-split per tipe di client)
        sopAttachments: {
          orderBy: { uploadedAt: "asc" },
          select: {
            id: true,
            filename: true,
            mimeType: true,
            ukuranKb: true,
            tipe: true,
            uploadedAt: true,
          },
        },
      },
    }),
    prisma.learningProgress.findUnique({
      where: {
        userId_sopDocumentId: {
          userId: session!.user.id,
          sopDocumentId: id,
        },
      },
    }),
    prisma.postTest.findUnique({
      where: { sopDocumentId: id },
      include: { questions: { orderBy: { id: "asc" } } },
    }),
    prisma.sosialisasiAttachment.findFirst({
      where: { userId: session!.user.id, sopDocumentId: id },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.learningNote.findUnique({
      where: {
        userId_sopDocumentId: {
          userId: session!.user.id,
          sopDocumentId: id,
        },
      },
    }),
  ]);

  if (!doc) notFound();

  // ─── Pembatasan akses per tipe akun ───────────────────────────────
  // Mencegah user membuka SOP di luar kategori unitnya lewat tautan langsung.
  const me = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { tipeUser: true },
  });
  const aktor = { role: session!.user.role, tipeUser: me?.tipeUser ?? null };

  if (isTipeBelumDitentukan(aktor)) {
    return (
      <AksesDitolak
        judul="Tipe Akun Belum Ditentukan"
        pesan={PESAN_TIPE_BELUM_DITENTUKAN}
      />
    );
  }
  if (!canAccessKategori(aktor, doc.kategori)) {
    return (
      <AksesDitolak
        judul="Dokumen Tidak Tersedia"
        pesan={PESAN_TIDAK_BERHAK}
      />
    );
  }

  // Get post test results
  const myResults = postTest
    ? await prisma.postTestResult.findMany({
        where: { userId: session!.user.id, postTestId: postTest.id },
        orderBy: { attemptNumber: "asc" },
      })
    : [];

  return (
    <BelajarClient
      doc={doc}
      progress={progress}
      postTest={postTest}
      latestAttachment={latestAttachment}
      myResults={myResults}
      userId={session!.user.id}
      initialNote={note?.konten ?? ""}
    />
  );
}
