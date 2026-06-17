// src/app/api/post-test/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ─── Item 8: NIK & Nama wajib dari modal sebelum mulai test ─────
  const {
    postTestId,
    answers,
    durasiDetik,
    nikKaryawan,
    namaKaryawan,
  } = await req.json();

  // Validasi NIK & Nama (server-side, double-check dari modal)
  if (!nikKaryawan || !/^\d{6}$/.test(nikKaryawan)) {
    return NextResponse.json(
      { error: "NIK harus berupa 6 digit angka." },
      { status: 400 }
    );
  }
  if (!namaKaryawan || namaKaryawan.trim().length < 2) {
    return NextResponse.json(
      { error: "Nama karyawan wajib diisi (minimal 2 karakter)." },
      { status: 400 }
    );
  }

  const postTest = await prisma.postTest.findUnique({
    where: { id: postTestId },
    include: {
      questions: { orderBy: { id: "asc" } },
      sopDocument: { select: { judul: true, id: true } },
    },
  });
  if (!postTest)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ─── Dedup check: 1 NIK 1 attempt per post test ─────────────────
  const existing = await prisma.postTestResult.findFirst({
    where: {
      postTestId,
      nikKaryawan: nikKaryawan.trim(),
    },
    select: { id: true, namaKaryawan: true, skor: true, status: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: `NIK ${nikKaryawan} (${existing.namaKaryawan}) sudah pernah mengerjakan Post Test ini dengan skor ${existing.skor}. Setiap NIK hanya boleh 1x attempt per SOP.`,
        existingResultId: existing.id,
      },
      { status: 409 }
    );
  }

  // answers format: { [questionId]: 'a' | 'b' | 'c' | 'd' }
  let jumlahBenar = 0;
  postTest.questions.forEach((q) => {
    if (answers[q.id] === q.jawabanBenar) jumlahBenar++;
  });
  const jumlahSalah = postTest.jumlahSoal - jumlahBenar;
  const skor = Math.round((jumlahBenar / postTest.jumlahSoal) * 100);
  const status = skor >= postTest.passingGrade ? "lulus" : "tidak_lulus";

  // ─── attemptNumber: dihitung global per postTest (total semua karyawan) ──
  const prevAttempts = await prisma.postTestResult.count({
    where: { postTestId },
  });

  try {
    const result = await prisma.postTestResult.create({
      data: {
        userId: session.user.id, // tetap simpan unit kerja yang submit
        postTestId,
        attemptNumber: prevAttempts + 1,
        nikKaryawan: nikKaryawan.trim(),
        namaKaryawan: namaKaryawan.trim(),
        skor,
        jumlahBenar,
        jumlahSalah,
        status,
        jawaban: answers,
        selesaiAt: new Date(),
      },
    });

    // ─── Jika lulus: update learning progress ke step 6 (per unit kerja) ──
    // Catatan: progress unit kerja akan completed kalau MINIMAL 1 NIK lulus
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
          pesan: `${namaKaryawan} (NIK ${nikKaryawan}) lulus Post Test "${postTest.sopDocument.judul}" dengan skor ${skor}.`,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        sopDocumentId: postTest.sopDocumentId,
        action: `post_test_${status}`,
        deskripsi: `${namaKaryawan} (NIK ${nikKaryawan}) mengerjakan Post Test "${postTest.sopDocument.judul}" — Skor: ${skor}/100 (${
          status === "lulus" ? "Lulus" : "Tidak Lulus"
        })`,
      },
    });

    // Return data lengkap supaya client bisa render result tanpa fetch ulang
    return NextResponse.json({
      resultId: result.id,
      id: result.id, // alias supaya component yang baca `r.id` juga jalan
      attemptNumber: result.attemptNumber,
      nikKaryawan: result.nikKaryawan,
      namaKaryawan: result.namaKaryawan,
      skor,
      status,
      jumlahBenar,
      jumlahSalah,
      passingGrade: postTest.passingGrade,
      jumlahSoal: postTest.jumlahSoal,
      selesaiAt: result.selesaiAt,
      // Untuk review (hide kunci jawaban handled di client — lihat Item 1)
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
  } catch (err: any) {
    // ─── Backup: kalau race condition lolos cek dedup di atas ──
    if (err?.code === "P2002") {
      return NextResponse.json(
        {
          error: `NIK ${nikKaryawan} sudah pernah submit Post Test ini. Setiap NIK hanya boleh 1x attempt.`,
        },
        { status: 409 }
      );
    }
    throw err;
  }
}
