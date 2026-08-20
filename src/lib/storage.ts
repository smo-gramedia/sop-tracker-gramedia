import "dotenv/config";
import { generateFileSignature, sign } from "@/actions/upload-utils";
import { prisma } from "@/lib/prisma";
type MANIFEST = {
  filename: string;
  directory: string;
  size: number;
  sha256: string;
};
const API_KEY = process.env.FTP_API_KEY;
const SECRET = process.env.FTP_SECRET_KEY;

async function getFileUploadToken(opts: {
  manifest: MANIFEST;
  timestamp: number;
}) {
  if (!API_KEY) throw new Error("FTP_API_KEY tidak diset di env");
  if (!SECRET) throw new Error("FTP_SECRET_KEY tidak diset di env");
  const signature = sign(
    "POST",
    "/api/v1/ftp/upload",
    SECRET,
    opts.timestamp,
    opts.manifest,
  );
  const response = await fetch(`${process.env.FTP_HOST}/api/v1/ftp/upload`, {
    method: "POST",
    headers: {
      "X-API-KEY": API_KEY,
      "X-TIMESTAMP": String(opts.timestamp),
      "X-SIGNATURE": signature,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(opts.manifest),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Gagal request token upload: ${response.status} ${response.statusText} - ${text}`,
    );
  }
  const result = (await response.json()) as {
    success: boolean;
    data?: { uploadToken: string; expiresAt: number };
  };
  if (!result.success || !result.data) {
    throw new Error(`Gagal request token upload: ${JSON.stringify(result)}`);
  }

  return result.data;
}
export const BUCKETS = {
  RAW_DOCUMENTS: "raw-documents",
  ATTACHMENTS: "sop-attachments",
  SOSIALISASI: "sosialisasi",
} as const;

export const getFileRemoteId = async ({
  path,
  bucket,
}: {
  path: string;
  bucket: BucketName;
}) => {
  switch (bucket) {
    case "raw-documents":
      return await prisma.rawDocument.findFirst({
        where: { filename: path },
        select: { remoteId: true },
      });
    case "sop-attachments":
      return await prisma.sopAttachment.findFirst({
        where: { filename: path },
        select: { remoteId: true },
      });
    case "sosialisasi":
      return await prisma.sosialisasiAttachment.findFirst({
        where: { filename: path },
        select: { remoteId: true },
      });
    default:
      throw new Error(`Bucket ${bucket} tidak dikenali`);
  }
};
export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Upload file ke bucket. Return path relatif di bucket. */
export async function uploadFile(opts: {
  bucket: BucketName;
  file: File;
  contentType: string;
}) {
  if (!API_KEY) throw new Error("FTP_API_KEY tidak diset di env");
  if (!SECRET) throw new Error("FTP_SECRET_KEY tidak diset di env");
  const { size, hash } = await generateFileSignature(opts.file);
  const manifest: MANIFEST = {
    filename: opts.file.name,
    directory: opts.bucket,
    size,
    sha256: hash,
  };
  const timestamp = Math.floor(Date.now() / 1000);
  const tokenData = await getFileUploadToken({ manifest, timestamp });
  const signature = sign("PUT", `/api/v1/ftp/blob/:token`, SECRET, timestamp);
  const form = new FormData();
  form.append("file", opts.file, opts.file.name);
  const response = await fetch(
    `${process.env.FTP_HOST}/api/v1/ftp/blob/${tokenData.uploadToken}`,
    {
      method: "PUT",
      headers: {
        "X-API-KEY": API_KEY,
        "X-TIMESTAMP": String(timestamp),
        "X-SIGNATURE": signature,
      },
      body: form,
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Gagal upload file: ${response.status} ${response.statusText} - ${text}`,
    );
  }
  const data: {
    success: boolean;
    message: string;
    data: {
      fileId: string;
      filename: string;
      directory: BucketName;
      remotePath: string;
      size: number;
      sha256: string;
    };
    meta: { timestamp: string };
  } = await response.json();
  if (data.success) {
    return {
      ...data.data,
    };
  }
  throw new Error(`Gagal upload file: ${data.message}`);
}

/**
 * Generate signed URL untuk akses file (default 1 jam).
 *
 * Opsi `download` (Fix B4):
 *  - undefined / false → URL inline (browser preview, mis. PDF & gambar).
 *  - true              → paksa unduh dengan nama file asli.
 *  - string            → paksa unduh dengan nama file kustom.
 * Saat bertanda download, Supabase menambahkan Content-Disposition:
 * attachment pada URL, sehingga browser MENGUNDUH (bukan menampilkan) —
 * meski URL-nya cross-origin (di mana atribut HTML `download` diabaikan).
 */
export async function getSignedUrl(opts: {
  bucket: BucketName;
  path: string;
  expiresIn?: number;
  download?: boolean | string;
}): Promise<string> {
  if (!API_KEY) throw new Error("FTP_API_KEY tidak diset di env");
  if (!SECRET) throw new Error("FTP_SECRET_KEY tidak diset di env");
  const { bucket, path, expiresIn } = opts;
  const result = await getFileRemoteId({ path, bucket }).catch((err) => {
    throw err;
  });
  if (!result?.remoteId) {
    throw new Error(`File ${path} di bucket ${bucket} tidak ditemukan`);
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign(
    "GET",
    `/api/v1/ftp/signed-url/:fileId`,
    SECRET,
    timestamp,
    {
      fileId: result.remoteId,
      ...(expiresIn && { expiresIn }),
    },
  );
  const response = await fetch(
    `${process.env.FTP_HOST}/api/v1/ftp/signed-url/${result.remoteId}${expiresIn ? `?expiresIn=${expiresIn}` : ""}`,
    {
      method: "GET",
      headers: {
        "X-API-KEY": API_KEY,
        "X-TIMESTAMP": String(timestamp),
        "X-SIGNATURE": signature,
      },
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Gagal Signed URL: ${response.status} ${response.statusText} - ${text}`,
    );
  }
  const data: {
    success: boolean;
    message: string;
    data: {
      fileId: string;
      filename: string;
      url: string;
      expiresAt: number;
    };
    meta: { timestamp: string };
  } = await response.json();
  if (data.success) {
    return data.data.url;
  }
  throw new Error(`Gagal Signed URL: ${data.message}`);
}

/** Hapus file dari bucket. */
export async function deleteFile(opts: {
  id: string;
}): Promise<{ fileId: string }> {
  if (!API_KEY) throw new Error("FTP_API_KEY tidak diset di env");
  if (!SECRET) throw new Error("FTP_SECRET_KEY tidak diset di env");
  const { id } = opts;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign(
    "DELETE",
    `/api/v1/ftp/file/:fileId`,
    SECRET,
    timestamp,
    { fileId: id },
  );
  const response = await fetch(
    `${process.env.FTP_HOST}/api/v1/ftp/file/${id}`,
    {
      method: "DELETE",
      headers: {
        "X-API-KEY": API_KEY,
        "X-TIMESTAMP": String(timestamp),
        "X-SIGNATURE": signature,
      },
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Gagal Hapus file: ${response.status} ${response.statusText} - ${text}`,
    );
  }
  const data: {
    success: boolean;
    message: string;
    data: {
      fileId: string;
    };
    meta: { timestamp: string };
  } = await response.json();
  if (data.success) {
    return {
      ...data.data,
    };
  }
  throw new Error(`Gagal menghapus file: ${data.message}`);
}

/** Unduh isi file (bytes) dari storage — dipakai untuk watermark PDF sisi server. */
export async function downloadFileBytes(opts: {
  bucket: BucketName;
  path: string;
}): Promise<Uint8Array> {
  // const supabase = getSupabaseAdmin();
  // const { data, error } = await supabase.storage
  //   .from(opts.bucket)
  //   .download(opts.path);
  // if (error || !data) {
  //   throw new Error(`Gagal mengunduh file: ${error?.message ?? "kosong"}`);
  // }
  // const buf = await data.arrayBuffer();
  return new Uint8Array();
}
