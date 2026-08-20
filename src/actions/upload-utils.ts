// ─── Batas ukuran (MB) ───────────────────────────────────────────────
// CATATAN: selama masih di Vercel, upload > ~4.5MB tetap gagal karena batas
// body request platform. Angka di bawah baru berlaku penuh setelah migrasi
// ke server internal.
import { BucketName } from "@/lib/storage";
import { createHash, createHmac } from "node:crypto";

export const MAX_RAW_MB = 50;
export const MAX_UTAMA_MB = 50;
export const MAX_LAMPIRAN_MB = 15; // lampiran WAJIB ZIP
export const MAX_SOSIALISASI_MB = 10; // bukti sosialisasi WAJIB PDF

export const PDF_MIME = "application/pdf";
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const DOC_MIME = "application/msword";

/**
 * Browser/OS mengirim MIME .zip berbeda-beda (bahkan kadang kosong atau
 * application/octet-stream). Normalisasi berdasarkan ekstensi agar validasi
 * konsisten DAN contentType yang dikirim ke Supabase selalu benar
 * (bucket punya daftar MIME yang diizinkan).
 */
export function effectiveMime(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".zip")) return "application/zip";
  if (name.endsWith(".pdf")) return PDF_MIME;
  if (name.endsWith(".docx")) return DOCX_MIME;
  if (name.endsWith(".doc")) return DOC_MIME;
  return file.type;
}

export type UploadRules = {
  maxSizeMb: number;
  allowedMime: string[];
  requireRole?: string[];
  /** Pesan yang ditampilkan bila tipe file tidak sesuai. */
  hint: string;
};

/** Aturan upload ditentukan oleh bucket + sub-tipe, bukan bucket saja. */
export function resolveRules(
  bucket: BucketName,
  attachmentTipe: "utama" | "lampiran",
): UploadRules {
  if (bucket === "raw-documents") {
    return {
      maxSizeMb: MAX_RAW_MB,
      allowedMime: [PDF_MIME, DOCX_MIME, DOC_MIME],
      requireRole: ["admin", "superadmin"],
      hint: "Raw dokumen harus berupa file .doc, .docx, atau .pdf.",
    };
  }

  if (bucket === "sop-attachments") {
    if (attachmentTipe === "utama") {
      return {
        maxSizeMb: MAX_UTAMA_MB,
        allowedMime: [PDF_MIME],
        requireRole: ["admin", "superadmin"],
        hint: "PDF utama harus berupa file PDF.",
      };
    }
    // Lampiran WAJIB ZIP — bila lebih dari satu berkas, satukan dalam 1 ZIP.
    return {
      maxSizeMb: MAX_LAMPIRAN_MB,
      allowedMime: ["application/zip"],
      requireRole: ["admin", "superadmin"],
      hint: `Lampiran harus berupa file ZIP (.zip), maksimal ${MAX_LAMPIRAN_MB}MB. Satukan seluruh berkas pendukung ke dalam satu file ZIP.`,
    };
  }

  // sosialisasi → WAJIB PDF
  return {
    maxSizeMb: MAX_SOSIALISASI_MB,
    allowedMime: [PDF_MIME],
    hint: `Bukti sosialisasi harus berupa file PDF, maksimal ${MAX_SOSIALISASI_MB}MB.`,
  };
}

export async function generateFileSignature(file: File) {
  const buffer = await file.arrayBuffer();
  const size = buffer.byteLength;
  const hash = createHash("sha256").update(Buffer.from(buffer)).digest("hex");
  return { size, hash };
}
export function buildQuery(params: Record<string, string | number>): string {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

export function sign(
  method: string,
  path: string,
  secret: string,
  ts: number,
  params?: Record<string, string | number>,
): string {
  const qs = buildQuery(params ?? {});
  const canonical = `${method}\n${path}\n${qs}\n${ts}`;
  return createHmac("sha256", secret).update(canonical).digest("hex");
}
