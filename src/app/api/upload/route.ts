import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { UPLOAD_MAX_SIZE_KB } from "@/lib/constants";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const type     = formData.get("type") as string | null;  // "sosialisasi" | "sop" | "raw"
  const sopId    = formData.get("sopDocumentId") as string | null;

  if (!file || !type || !sopId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const ukuranKb = Math.round(file.size / 1024);
  if (ukuranKb > UPLOAD_MAX_SIZE_KB) {
    return NextResponse.json({ error: `File terlalu besar. Maksimal ${UPLOAD_MAX_SIZE_KB} KB.` }, { status: 400 });
  }

  // In production: upload to Supabase Storage, get URL
  // For now we just record metadata
  const filename = file.name;
  const mimeType = file.type;

  if (type === "sosialisasi") {
    const prevCount = await prisma.sosialisasiAttachment.count({
      where: { userId: session.user.id, sopDocumentId: sopId },
    });
    const attachment = await prisma.sosialisasiAttachment.create({
      data: {
        userId:        session.user.id,
        sopDocumentId: sopId,
        filename, mimeType, ukuranKb,
        uploadKe:      prevCount + 1,
        status:        "menunggu",
      },
    });
    // Update learning progress to step 4 done
    await prisma.learningProgress.updateMany({
      where: { userId: session.user.id, sopDocumentId: sopId },
      data:  { stepCurrent: 4, lastAccessedAt: new Date() },
    });
    // Notify admin (create notification for all admins)
    const admins = await prisma.user.findMany({
      where: { role: { in: ["admin","superadmin"] }, status: "aktif" },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId:        a.id,
        sopDocumentId: sopId,
        tipe:          "attachment" as const,
        judul:         "Bukti sosialisasi baru",
        pesan:         `${session.user.name} mengupload bukti sosialisasi. Perlu verifikasi.`,
      })),
    });
    return NextResponse.json({ success: true, id: attachment.id });
  }

  return NextResponse.json({ error: "Unknown upload type" }, { status: 400 });
}
