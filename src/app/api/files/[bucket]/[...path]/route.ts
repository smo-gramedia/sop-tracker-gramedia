// src/app/api/files/[bucket]/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUCKETS, getSignedUrl, type BucketName } from "@/lib/storage";

/**
 * Secure file access endpoint.
 * Generate signed URL (5 menit) lalu redirect.
 *
 * Authorization:
 * - SOSIALISASI: hanya owner atau admin/superadmin
 * - RAW_DOCUMENTS / ATTACHMENTS: semua user login (validasi permittedAccess di halaman SOP)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bucket: string; path: string[] }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bucket: bucketParam, path: pathParts } = await params;
  const bucket = bucketParam as BucketName;
  if (!Object.values(BUCKETS).includes(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }

  const path = pathParts.join("/");
  if (!path) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }

  // Authorization layer per bucket
  if (bucket === BUCKETS.SOSIALISASI) {
    // FIX: prisma.sosialisasiAttachment (camelCase)
    const att = await prisma.sosialisasiAttachment.findFirst({
      where: { filename: path },
      select: { userId: true },
    });
    if (!att) {
      return NextResponse.json(
        { error: "File metadata not found" },
        { status: 404 }
      );
    }
    const isOwner = att.userId === session.user.id;
    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // raw-documents & sop-attachments: semua user login boleh akses.
  // Validasi permittedAccess sudah dilakukan di halaman SOP (server component).

  try {
    const sp = req.nextUrl.searchParams;

    // ─── Fix B2: mode "ambil URL" untuk Office Online viewer ────────────
    //   ?url=1 → balas JSON { url } (signed URL langsung), TIDAK redirect.
    //   Dipakai untuk pratinjau .docx via view.officeapps.live.com yang
    //   butuh URL file yang dapat diakses publik oleh server Microsoft.
    if (sp.get("url") === "1") {
      const url = await getSignedUrl({
        bucket,
        path,
        expiresIn: 600, // 10 menit — beri waktu viewer mengambil file
      });
      return NextResponse.json({ url });
    }

    // ─── Fix B4: mode unduh vs pratinjau ────────────────────────────────
    //   ?dl=1            → unduh dengan nama file asli
    //   ?dl=<namafile>   → unduh dengan nama kustom
    //   (tanpa ?dl)      → inline / pratinjau (PDF & gambar tampil di tab)
    const dlParam = sp.get("dl");
    const download =
      dlParam == null ? undefined : dlParam === "1" ? true : dlParam;

    const signedUrl = await getSignedUrl({
      bucket,
      path,
      expiresIn: 300, // 5 menit
      download,
    });
    return NextResponse.redirect(signedUrl);
  } catch (e) {
    console.error("Signed URL error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
