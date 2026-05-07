// src/app/api/sop/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedUrl, BUCKETS } from "@/lib/storage";
import JSZip from "jszip";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sopId = params.id;
  const isAdmin = ["admin", "superadmin"].includes(session.user.role);

  // ─── Fetch SOP + attachments ──────────────────────────────────
  const sop = await prisma.sopDocument.findUnique({
    where: { id: sopId },
    select: {
      id: true,
      kode: true,
      judul: true,
      sopAttachments: {
        select: {
          id: true,
          filename: true,
          mimeType: true,
          tipe: true,
        },
      },
    },
  });

  if (!sop) {
    return NextResponse.json({ error: "SOP not found" }, { status: 404 });
  }

  if (sop.sopAttachments.length === 0) {
    return NextResponse.json(
      { error: "Belum ada file untuk SOP ini" },
      { status: 404 }
    );
  }

  // ─── Authorization: User biasa harus selesai 100% ──────────────
  if (!isAdmin) {
    const progress = await prisma.learningProgress.findUnique({
      where: {
        userId_sopDocumentId: {
          userId: session.user.id,
          sopDocumentId: sopId,
        },
      },
      select: { stepCurrent: true, status: true },
    });

    const isCompleted =
      progress?.status === "selesai" && progress?.stepCurrent === 6;

    if (!isCompleted) {
      return NextResponse.json(
        { error: "Selesaikan pembelajaran SOP terlebih dahulu (100%)" },
        { status: 403 }
      );
    }
  }

  // ─── Generate ZIP ──────────────────────────────────────────────
  try {
    const zip = new JSZip();

    // Helper: download file dari Supabase signed URL → arraybuffer
    async function fetchFile(path: string): Promise<ArrayBuffer> {
      const url = await getSignedUrl({
        bucket: BUCKETS.ATTACHMENTS,
        path,
        expiresIn: 300,
      });
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Gagal fetch ${path}: ${res.status}`);
      }
      return res.arrayBuffer();
    }

    // Add files ke ZIP
    for (const att of sop.sopAttachments) {
      const buffer = await fetchFile(att.filename);
      // Extract just the filename (path is like "uuid/name.ext")
      const baseName = att.filename.split("/").pop() || att.filename;

      // Untuk PDF utama, prefix dengan kode SOP supaya gampang dikenali
      const finalName =
        att.tipe === "utama"
          ? `[Utama] ${sop.kode.replace(/\//g, "-")} - ${baseName}`
          : baseName;

      zip.file(finalName, buffer);
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    // Sanitize filename (hapus karakter yang tidak valid untuk filename)
    const safeKode = sop.kode.replace(/[\/\\?%*:|"<>]/g, "-");
    const safeName = sop.judul.replace(/[\/\\?%*:|"<>]/g, "-");
    const zipFilename = `${safeKode} ${safeName}.zip`;

    // Log activity (best-effort, jangan block kalau gagal)
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          sopDocumentId: sopId,
          action: "download_sop",
          deskripsi: `Download SOP "${sop.judul}" (${sop.sopAttachments.length} file)`,
        },
      });
    } catch (e) {
      console.warn("Log download failed:", e);
    }

    return new Response(zipBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Content-Length": String(zipBuffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Download ZIP error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal download" },
      { status: 500 }
    );
  }
}
