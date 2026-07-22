// src/app/api/learning/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getStepLockInfo } from "@/lib/learning-gates";
import { canAccessKategori } from "@/lib/access";

// Update step progress with server-side gate enforcement
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sopDocumentId, step } = await req.json();

  // Validasi range
  if (typeof step !== "number" || step < 0 || step > 6) {
    return NextResponse.json(
      { error: "Invalid step (must be 0-6)" },
      { status: 400 }
    );
  }

  // ─── Pembatasan kategori per tipe akun ─────────────────────────────
  // Tanpa ini, user bisa memulai/melanjutkan pembelajaran SOP di luar
  // kategori unitnya dengan memanggil endpoint ini secara langsung.
  const [sopDoc, meUser] = await Promise.all([
    prisma.sopDocument.findUnique({
      where: { id: sopDocumentId },
      select: { kategori: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tipeUser: true },
    }),
  ]);
  if (!sopDoc) {
    return NextResponse.json({ error: "SOP tidak ditemukan" }, { status: 404 });
  }
  if (
    !canAccessKategori(
      { role: session.user.role, tipeUser: meUser?.tipeUser ?? null },
      sopDoc.kategori
    )
  ) {
    return NextResponse.json(
      { error: "Dokumen ini tidak tersedia untuk tipe akun Anda." },
      { status: 403 }
    );
  }

  // ─── SERVER-SIDE GATE ENFORCEMENT ──────────────────────────────────
  // Cek attachment status & post test result untuk validasi
  const [latestAttachment, postTest] = await Promise.all([
    prisma.sosialisasiAttachment.findFirst({
      where: { userId: session.user.id, sopDocumentId },
      orderBy: { uploadedAt: "desc" },
      select: { status: true },
    }),
    prisma.postTest.findUnique({
      where: { sopDocumentId },
      select: { id: true },
    }),
  ]);

  // Cek apakah user pernah lulus post test
  let hasPassedPostTest = false;
  if (postTest) {
    const passedResult = await prisma.postTestResult.findFirst({
      where: {
        userId: session.user.id,
        postTestId: postTest.id,
        status: "lulus",
      },
      select: { id: true },
    });
    hasPassedPostTest = !!passedResult;
  }

  const ctx = {
    attachmentStatus: (latestAttachment?.status as any) ?? null,
    hasPassedPostTest,
  };

  const lockInfo = getStepLockInfo(step, ctx);
  if (lockInfo.locked) {
    return NextResponse.json(
      { error: lockInfo.reason || "Step belum accessible" },
      { status: 403 }
    );
  }

  // ─── PERSIST ──────────────────────────────────────────────────────
  const progress = await prisma.learningProgress.upsert({
    where: {
      userId_sopDocumentId: { userId: session.user.id, sopDocumentId },
    },
    create: {
      userId: session.user.id,
      sopDocumentId,
      stepCurrent: step,
      status: step >= 6 ? "selesai" : "dipelajari",
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    },
    update: {
      stepCurrent: step,
      status: step >= 6 ? "selesai" : "dipelajari",
      lastAccessedAt: new Date(),
      ...(step >= 6 && { completedAt: new Date() }),
    },
  });

  // Log activity
  const stepLabels = [
    "Petunjuk",
    "Akses Dokumen",
    "Baca Dokumen",
    "Lampiran",
    "Upload Bukti",
    "Post Test",
    "Selesai",
  ];
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      sopDocumentId,
      action: "step_progress",
      deskripsi: `Menyelesaikan step ${step}: ${stepLabels[step] ?? step}`,
    },
  });

  return NextResponse.json(progress);
}
