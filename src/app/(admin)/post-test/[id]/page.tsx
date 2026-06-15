// src/app/(admin)/post-test/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PostTestDetailClient from "@/components/admin/PostTestDetailClient";

// ─── Next.js 16: params sekarang Promise ───────────────────────────
type Props = { params: Promise<{ id: string }> };

export default async function PostTestDetailPage({ params }: Props) {
  const { id } = await params;
  const postTest = await prisma.postTest.findUnique({
    where: { id },
    include: {
      sopDocument: {
        select: {
          id: true,
          kode: true,
          judul: true,
          kategori: true,
          department: { select: { nama: true } },
        },
      },
      questions: {
        orderBy: { id: "asc" },
      },
      results: {
        orderBy: [{ dikerjakanAt: "desc" }],
        include: {
          user: {
            select: {
              id: true,
              kodeUser: true,
              tipeUser: true,
              nama: true,
              unit: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!postTest) notFound();

  // Hitung total questions (untuk display 17/20)
  const totalQuestions = postTest.questions.length;

  // Stats summary
  const totalResults = postTest.results.length;
  const uniqueUsers = new Set(postTest.results.map((r) => r.userId)).size;
  const lulusCount = postTest.results.filter((r) => r.status === "lulus").length;
  const tidakLulusCount = postTest.results.filter(
    (r) => r.status === "tidak_lulus"
  ).length;
  const avgSkor =
    totalResults > 0
      ? Math.round(
          postTest.results.reduce((sum, r) => sum + r.skor, 0) / totalResults
        )
      : 0;

  return (
    <PostTestDetailClient
      postTest={{
        id: postTest.id,
        passingGrade: postTest.passingGrade,
        durasiMenit: postTest.durasiMenit,
        jumlahSoal: postTest.jumlahSoal,
        sopDocument: postTest.sopDocument,
      }}
      questions={postTest.questions.map((q) => ({
        id: q.id,
        pertanyaan: q.pertanyaan,
        opsiA: q.opsiA,
        opsiB: q.opsiB,
        opsiC: q.opsiC,
        opsiD: q.opsiD,
        jawabanBenar: q.jawabanBenar,
      }))}
      results={postTest.results.map((r) => ({
        id: r.id,
        userId: r.userId,
        attemptNumber: r.attemptNumber,
        skor: r.skor,
        jumlahBenar: r.jumlahBenar,
        jumlahSalah: r.jumlahSalah,
        status: r.status,
        dikerjakanAt: r.dikerjakanAt.toISOString(),
        selesaiAt: r.selesaiAt?.toISOString() ?? null,
        user: r.user,
      }))}
      totalQuestions={totalQuestions}
      stats={{
        totalResults,
        uniqueUsers,
        lulusCount,
        tidakLulusCount,
        avgSkor,
      }}
    />
  );
}
