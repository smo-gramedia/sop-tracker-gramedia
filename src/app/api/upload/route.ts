import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUCKETS, uploadFile, type BucketName } from "@/lib/storage";
import { addFileUploadAction, replaceFileAction } from "@/actions/upload";
import { effectiveMime, resolveRules } from "@/actions/upload-utils";
import { Session } from "next-auth";

function validateFileSizeAndMime(session: Session, formData: FormData) {
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as BucketName | null;
  const tipe = formData.get("tipe") as
    "raw" | "attachment" | "sosialisasi" | null;

  // Untuk SopAttachment, ada sub-tipe: 'utama' | 'lampiran'
  const attachmentTipe =
    (formData.get("attachmentTipe") as "utama" | "lampiran" | null) ??
    "lampiran";

  if (!file || !bucket || !tipe) {
    return { error: "Missing fields: file, bucket, tipe", status: 400 };
  }
  if (!Object.values(BUCKETS).includes(bucket)) {
    return { error: "Invalid bucket", status: 400 };
  }

  const rules = resolveRules(bucket, attachmentTipe);
  if (rules.requireRole && !rules.requireRole.includes(session.user.role)) {
    return { error: "Forbidden", status: 403 };
  }

  // Validasi ukuran & tipe — pakai MIME hasil normalisasi ekstensi.
  const mime = effectiveMime(file);
  if (file.size > rules.maxSizeMb * 1024 * 1024) {
    return {
      error: `Ukuran file melebihi ${rules.maxSizeMb}MB (file Anda ${(
        file.size /
        1024 /
        1024
      ).toFixed(1)}MB).`,
      status: 400,
    };
  }
  if (!rules.allowedMime.includes(mime)) {
    return { error: rules.hint, status: 400 };
  }

  return { mime, file, bucket, tipe, attachmentTipe, session };
}
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const sopDocumentId = formData.get("sopDocumentId") as string | null;
  if (!sopDocumentId) {
    return NextResponse.json({ error: "sopDocumentId required", status: 400 });
  }
  // Verifikasi SOP exists
  const sop = await prisma.sopDocument.findUnique({
    where: { id: sopDocumentId },
    select: { id: true },
  });
  if (!sop) {
    return NextResponse.json({ error: "SOP not found" }, { status: 404 });
  }

  const result = validateFileSizeAndMime(session, formData);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }
  const { mime, file, bucket, tipe, attachmentTipe } = result;

  const sizeOnKb = Math.round(file.size / 1024);

  // E3: bila ada replaceId, ini operasi GANTI FILE (bukan tambah baru).
  const replaceId = formData.get("replaceId") as string | null;
  // Untuk attachment 'utama', enforce: hanya 1 PDF utama per SOP
  // (dilewati saat REPLACE, karena memang sedang mengganti utama yang ada)
  if (!replaceId && tipe === "attachment" && attachmentTipe === "utama") {
    const existingUtama = await prisma.sopAttachment.findFirst({
      where: { sopDocumentId, tipe: "utama" },
      select: { id: true },
    });
    if (existingUtama) {
      return NextResponse.json(
        {
          error:
            "PDF utama sudah ada. Hapus dulu yang lama, atau pilih tipe 'lampiran'.",
        },
        { status: 400 },
      );
    }
  }

  try {
    const uploadResult = await uploadFile({ bucket, file, contentType: mime });

    const result = replaceId
      ? await replaceFileAction({
          bucket,
          file,
          sizeOnKb,
          mime,
          path: uploadResult.remotePath,
          replaceId,
          session,
          sopDocumentId,
          tipe,
          remoteId: uploadResult.fileId,
        })
      : await addFileUploadAction({
          attachmentTipe,
          bucket,
          mime,
          path: uploadResult.remotePath,
          sizeOnKb,
          sopDocumentId,
          session,
          tipe,
          remoteId: uploadResult.fileId,
        });
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    } else {
      return NextResponse.json(result);
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 },
    );
  }
}
