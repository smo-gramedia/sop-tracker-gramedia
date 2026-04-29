import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Update step progress
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sopDocumentId, step } = await req.json();

  const progress = await prisma.learningProgress.upsert({
    where: { userId_sopDocumentId: { userId: session.user.id, sopDocumentId } },
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
  const stepLabels = ["Petunjuk","Akses Dokumen","Baca Dokumen","Lampiran","Upload Bukti","Post Test","Selesai"];
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
