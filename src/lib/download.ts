// src/lib/download.ts
/**
 * Helper untuk download/akses file yang tersimpan di Supabase Storage.
 * Routing via /api/files endpoint (yang akan generate signed URL).
 */

export function getFileUrl(bucket: string, path: string): string {
  return `/api/files/${bucket}/${path}`
}

/** Trigger browser download. */
export function downloadFile(
  bucket: string,
  path: string,
  filename?: string,
): void {
  const url = getFileUrl(bucket, path)
  const a = document.createElement('a')
  a.href = url
  if (filename) a.download = filename
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/** Buka file di tab baru (untuk preview PDF/gambar). */
export function previewFile(bucket: string, path: string): void {
  const url = getFileUrl(bucket, path)
  window.open(url, '_blank', 'noopener,noreferrer')
}
