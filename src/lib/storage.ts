// src/lib/storage.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Supabase env variables missing. Cek NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY di .env.local',
  )
}

/**
 * Supabase admin client.
 * Bypass RLS — HANYA gunakan di server (API routes & server actions).
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export const BUCKETS = {
  RAW_DOCUMENTS: 'raw-documents',
  ATTACHMENTS: 'sop-attachments',
  SOSIALISASI: 'sosialisasi',
} as const

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS]

/** Upload file ke bucket. Return path relatif di bucket. */
export async function uploadFile(opts: {
  bucket: BucketName
  path: string
  file: Buffer | Blob | File | ArrayBuffer
  contentType: string
}): Promise<{ path: string }> {
  const { data, error } = await supabaseAdmin.storage
    .from(opts.bucket)
    .upload(opts.path, opts.file as Blob, {
      contentType: opts.contentType,
      upsert: false,
      cacheControl: '3600',
    })

  if (error) throw new Error(`Upload gagal: ${error.message}`)
  return { path: data.path }
}

/** Generate signed URL untuk download (default 1 jam). */
export async function getSignedUrl(opts: {
  bucket: BucketName
  path: string
  expiresIn?: number
}): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(opts.bucket)
    .createSignedUrl(opts.path, opts.expiresIn ?? 3600)

  if (error) throw new Error(`Gagal generate URL: ${error.message}`)
  return data.signedUrl
}

/** Hapus file dari bucket. */
export async function deleteFile(opts: {
  bucket: BucketName
  path: string
}): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(opts.bucket)
    .remove([opts.path])
  if (error) throw new Error(`Hapus file gagal: ${error.message}`)
}

/** Build path konsisten: {prefix}/{timestamp}_{safe-filename} */
export function buildStoragePath(opts: {
  prefix: string
  filename: string
}): string {
  const timestamp = Date.now()
  const safe = opts.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${opts.prefix}/${timestamp}_${safe}`
}

/** Validasi mime type & ukuran sebelum upload. */
export function validateFile(
  file: File,
  opts: { maxSizeMb: number; allowedMime: string[] },
): { ok: true } | { ok: false; reason: string } {
  if (file.size > opts.maxSizeMb * 1024 * 1024) {
    return { ok: false, reason: `Ukuran file melebihi ${opts.maxSizeMb}MB` }
  }
  if (!opts.allowedMime.includes(file.type)) {
    return { ok: false, reason: `Tipe file tidak diizinkan: ${file.type}` }
  }
  return { ok: true }
}
