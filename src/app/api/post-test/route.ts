// src/app/api/post-test/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postTestId, answers, durasiDetik } = await req.json();

  const postTest = await prisma.postTest.findUnique({
    where: { id: postTestId },
    include: {
      questions: { orderBy: { id: "asc" } },
      sopDocument: { select: { judul: true, id: true } },
    },
  });
  if (!postTest)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // answers format: { [questionId]: 'a' | 'b' | 'c' | 'd' }
  let jumlahBenar = 0;
  postTest.questions.forEach((q) => {
    if (answers[q.id] === q.jawabanBenar) jumlahBenar++;
  });
  const jumlahSalah = postTest.jumlahSoal - jumlahBenar;
  const skor = Math.round((jumlahBenar / postTest.jumlahSoal) * 100);
  const status = skor >= postTest.passingGrade ? "lulus" : "tidak_lulus";

  const prevAttempts = await prisma.postTestResult.count({
    where: { userId: session.user.id, postTestId },
  });

  const result = await prisma.postTestResult.create({
    data: {
      userId: session.user.id,
      postTestId,
      attemptNumber: prevAttempts + 1,
      skor,
      jumlahBenar,
      jumlahSalah,
      status,
      jawaban: answers,
      selesaiAt: new Date(),
    },
  });

  // Jika lulus, update learning progress ke step 6
  if (status === "lulus") {
    await prisma.learningProgress.updateMany({
      where: {
        userId: session.user.id,
        sopDocumentId: postTest.sopDocumentId,
      },
      data: { stepCurrent: 6, status: "selesai", completedAt: new Date() },
    });
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        sopDocumentId: postTest.sopDocumentId,
        tipe: "post_test",
        judul: "Post Test Lulus 🎉",
        pesan: `Selamat! Anda lulus Post Test "${postTest.sopDocument.judul}" dengan skor ${skor}.`,
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      sopDocumentId: postTest.sopDocumentId,
      action: `post_test_${status}`,
      deskripsi: `Mengerjakan Post Test "${postTest.sopDocument.judul}" — Skor: ${skor}/100 (${
        status === "lulus" ? "Lulus" : "Tidak Lulus"
      })`,
    },
  });

  // Return data lengkap supaya client bisa render result tanpa fetch ulang
  return NextResponse.json({
    resultId: result.id,
    attemptNumber: result.attemptNumber,
    skor,
    status,
    jumlahBenar,
    jumlahSalah,
    passingGrade: postTest.passingGrade,
    jumlahSoal: postTest.jumlahSoal,
    selesaiAt: result.selesaiAt,
    // Untuk review: kunci jawaban + jawaban user
    review: postTest.questions.map((q) => ({
      id: q.id,
      pertanyaan: q.pertanyaan,
      opsiA: q.opsiA,
      opsiB: q.opsiB,
      opsiC: q.opsiC,
      opsiD: q.opsiD,
      jawabanBenar: q.jawabanBenar,
      jawabanUser: answers[q.id] ?? null,
    })),
  });
}
