// src/lib/storage.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Lazy-init Supabase admin client.
 *
 * Kenapa lazy?
 * Saat Vercel build (collect page data phase), env vars seperti
 * SUPABASE_SERVICE_ROLE_KEY belum tentu tersedia. Kalau kita init
 * client di top-level (saat import), build akan crash dengan:
 *   "Failed to collect page data for /api/files/..."
 *
 * Solusi: init client hanya saat fungsi dipanggil (runtime), bukan saat import.
 * Pakai singleton pattern supaya tidak bikin client berulang kali.
 */
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Supabase env variables missing. Set NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY di Vercel Environment Variables (Settings → Environment Variables)."
    );
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _supabaseAdmin;
}

export const BUCKETS = {
  RAW_DOCUMENTS: "raw-documents",
  ATTACHMENTS: "sop-attachments",
  SOSIALISASI: "sosialisasi",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Upload file ke bucket. Return path relatif di bucket. */
export async function uploadFile(opts: {
  bucket: BucketName;
  path: string;
  file: Buffer | Blob | File | ArrayBuffer;
  contentType: string;
}): Promise<{ path: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(opts.bucket)
    .upload(opts.path, opts.file as Blob, {
      contentType: opts.contentType,
      upsert: false,
      cacheControl: "3600",
    });

  if (error) throw new Error(`Upload gagal: ${error.message}`);
  return { path: data.path };
}

/** Generate signed URL untuk download (default 1 jam). */
export async function getSignedUrl(opts: {
  bucket: BucketName;
  path: string;
  expiresIn?: number;
}): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(opts.bucket)
    .createSignedUrl(opts.path, opts.expiresIn ?? 3600);

  if (error) throw new Error(`Gagal generate URL: ${error.message}`);
  return data.signedUrl;
}

/** Hapus file dari bucket. */
export async function deleteFile(opts: {
  bucket: BucketName;
  path: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(opts.bucket)
    .remove([opts.path]);
  if (error) throw new Error(`Hapus file gagal: ${error.message}`);
}

/** Build path konsisten: {prefix}/{timestamp}_{safe-filename} */
export function buildStoragePath(opts: {
  prefix: string;
  filename: string;
}): string {
  const timestamp = Date.now();
  const safe = opts.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${opts.prefix}/${timestamp}_${safe}`;
}

/** Validasi mime type & ukuran sebelum upload. */
export function validateFile(
  file: File,
  opts: { maxSizeMb: number; allowedMime: string[] }
): { ok: true } | { ok: false; reason: string } {
  if (file.size > opts.maxSizeMb * 1024 * 1024) {
    return { ok: false, reason: `Ukuran file melebihi ${opts.maxSizeMb}MB` };
  }
  if (!opts.allowedMime.includes(file.type)) {
    return { ok: false, reason: `Tipe file tidak diizinkan: ${file.type}` };
  }
  return { ok: true };
}

/**
 * Export legacy `supabaseAdmin` untuk backward compat.
 * Tapi pakai Proxy untuk lazy init — supaya tidak crash di build time.
 *
 * Note: lebih baik pakai fungsi exported di atas (uploadFile, getSignedUrl, etc).
 * Tapi kalau ada code lain yang import supabaseAdmin langsung, ini biar tetap jalan.
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    return Reflect.get(client, prop, client);
  },
});
