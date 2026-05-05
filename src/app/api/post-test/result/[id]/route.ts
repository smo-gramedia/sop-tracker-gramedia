// src/app/api/post-test/result/[id]/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await prisma.postTestResult.findUnique({
    where: { id: params.id },
    include: {
      postTest: {
        include: {
          questions: { orderBy: { id: "asc" } },
        },
      },
    },
  });

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Authorization: hanya owner yang boleh lihat
  if (result.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse jawaban user dari jsonb
  const userAnswers = (result.jawaban as Record<string, string>) ?? {};

  return NextResponse.json({
    resultId: result.id,
    attemptNumber: result.attemptNumber,
    skor: result.skor,
    status: result.status,
    jumlahBenar: result.jumlahBenar,
    jumlahSalah: result.jumlahSalah,
    passingGrade: result.postTest.passingGrade,
    jumlahSoal: result.postTest.jumlahSoal,
    selesaiAt: result.selesaiAt,
    review: result.postTest.questions.map((q) => ({
      id: q.id,
      pertanyaan: q.pertanyaan,
      opsiA: q.opsiA,
      opsiB: q.opsiB,
      opsiC: q.opsiC,
      opsiD: q.opsiD,
      jawabanBenar: q.jawabanBenar,
      jawabanUser: userAnswers[q.id] ?? null,
    })),
  });
}
