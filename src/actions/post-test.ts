"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitPostTest(
  postTestId: string,
  answers: Record<string, string>,   // { questionId: "a"|"b"|"c"|"d" }
  durasiDetik: number
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const postTest = await prisma.postTest.findUnique({
    where: { id: postTestId },
    include: { questions: true, sopDocument: true },
  });
  if (!postTest) throw new Error("Post test tidak ditemukan");

  // Count correct / wrong
  let jumlahBenar = 0;
  postTest.questions.forEach(q => {
    if (answers[q.id] === q.jawabanBenar) jumlahBenar++;
  });
  const jumlahSalah = postTest.jumlahSoal - jumlahBenar;
  const skor        = Math.round((jumlahBenar / postTest.jumlahSoal) * 100);
  const status      = skor >= postTest.passingGrade ? "lulus" : "tidak_lulus";

  // Get attempt number
  const prevAttempts = await prisma.postTestResult.count({
    where: { userId: session.user.id, postTestId },
  });

  const result = await prisma.postTestResult.create({
    data: {
      userId:        session.user.id,
      postTestId,
      attemptNumber: prevAttempts + 1,
      skor,
      jumlahBenar,
      jumlahSalah,
      status,
      jawaban:       answers,
      selesaiAt:     new Date(),
    },
  });

  // Update learning progress if lulus
  if (status === "lulus") {
    await prisma.learningProgress.updateMany({
      where: { userId: session.user.id, sopDocumentId: postTest.sopDocumentId },
      data:  { stepCurrent: 6, status: "selesai", completedAt: new Date() },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId:        session.user.id,
      sopDocumentId: postTest.sopDocumentId,
      action:        `post_test_${status}`,
      deskripsi:     `Mengerjakan Post Test "${postTest.sopDocument.judul}" — Skor: ${skor} (${status})`,
    },
  });

  // Notify if passed
  if (status === "lulus") {
    await prisma.notification.create({
      data: {
        userId:        session.user.id,
        sopDocumentId: postTest.sopDocumentId,
        tipe:          "post_test",
        judul:         "Post Test Lulus 🎉",
        pesan:         `Selamat! Anda lulus Post Test "${postTest.sopDocument.judul}" dengan skor ${skor}.`,
      },
    });
  }

  revalidatePath("/profil");
  return { success: true, skor, status, jumlahBenar, jumlahSalah, resultId: result.id };
}
