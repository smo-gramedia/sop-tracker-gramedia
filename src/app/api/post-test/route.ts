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

  // ─── Guard (Fix B1): jumlahSoal harus > 0 supaya tidak division-by-zero.
  //     (jumlahBenar / 0) → NaN, dan NaN ditolak Prisma untuk kolom Int
  //     `skor` → memicu error 500 → crash "Unexpected end of JSON input". ──
  const totalSoal =
    postTest.jumlahSoal && postTest.jumlahSoal > 0
      ? postTest.jumlahSoal
      : postTest.questions.length;
  if (!totalSoal || totalSoal <= 0) {
    return NextResponse.json(
      {
        error:
          "Konfigurasi Post Test belum valid (jumlah soal 0). Hubungi admin.",
      },
      { status: 400 }
    );
  }

  // answers format: { [questionId]: 'a' | 'b' | 'c' | 'd' }
  let jumlahBenar = 0;
  postTest.questions.forEach((q) => {
    if (answers[q.id] === q.jawabanBenar) jumlahBenar++;
  });
  const jumlahSalah = totalSoal - jumlahBenar;
  const skor = Math.round((jumlahBenar / totalSoal) * 100);
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

    // ─── Operasi turunan (best-effort, Fix B1) ──────────────────────────
    //     Hasil tes (result) SUDAH tersimpan di atas. Kegagalan operasi di
    //     bawah ini TIDAK boleh menggagalkan submit — sebelumnya error di
    //     salah satunya akan ter-`throw` menjadi 500 tanpa body JSON dan
    //     membuat layar tes crash. Sekarang cukup di-log. ───────────────────
    if (status === "lulus") {
      try {
        await prisma.learningProgress.updateMany({
          where: {
            userId: session.user.id,
            sopDocumentId: postTest.sopDocumentId,
          },
          data: { stepCurrent: 6, status: "selesai", completedAt: new Date() },
        });
      } catch (e) {
        console.error("[post-test] Gagal update learningProgress:", e);
      }
      try {
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            sopDocumentId: postTest.sopDocumentId,
            tipe: "post_test",
            judul: "Post Test Lulus 🎉",
            pesan: `${namaKaryawan} (NIK ${nikKaryawan}) lulus Post Test "${postTest.sopDocument.judul}" dengan skor ${skor}.`,
          },
        });
      } catch (e) {
        console.error("[post-test] Gagal buat notifikasi:", e);
      }
    }

    try {
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
    } catch (e) {
      console.error("[post-test] Gagal tulis activity log:", e);
    }

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
      jumlahSoal: totalSoal,
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
    // ─── PENTING (Fix B1): SELALU kembalikan JSON, jangan `throw`. ────────
    //     `throw` di route handler menghasilkan response 500 TANPA body JSON,
    //     yang memicu "Failed to execute 'json' on 'Response': Unexpected end
    //     of JSON input" di browser. Detail error tetap di-log di Vercel
    //     untuk menelusuri akar masalah sebenarnya. ─────────────────────────
    console.error("[post-test] Submit gagal:", err);
    return NextResponse.json(
      {
        error:
          "Terjadi kesalahan di server saat menyimpan hasil. Silakan coba lagi dalam beberapa saat.",
      },
      { status: 500 }
    );
  }
}
