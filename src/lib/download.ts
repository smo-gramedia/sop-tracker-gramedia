// src/lib/download.ts
/**
 * Helper untuk download/akses file yang tersimpan di Supabase Storage.
 * Routing via /api/files endpoint (yang akan generate signed URL).
 */

/**
 * URL akses file lewat /api/files.
 *
 * `opts.download` (Fix B4):
 *  - true   → mode unduh (Content-Disposition: attachment) dgn nama file asli
 *  - string → mode unduh dengan nama file kustom
 *  - kosong → mode inline (pratinjau di tab)
 */
export function getFileUrl(
  bucket: string,
  path: string,
  opts?: { download?: boolean | string },
): string {
  const base = `/api/files/${bucket}/${path}`
  if (opts?.download === undefined || opts.download === false) return base
  const dl = opts.download === true ? '1' : encodeURIComponent(opts.download)
  return `${base}?dl=${dl}`
}

/**
 * Trigger unduhan file ke komputer lokal.
 *
 * Catatan (Fix B4): /api/files me-redirect ke signed URL Supabase yang
 * cross-origin, sehingga atribut HTML `download` pada anchor DIABAIKAN
 * browser. Pemaksaan unduh kini dilakukan di sisi server lewat parameter
 * ?dl= (Supabase mengirim Content-Disposition: attachment).
 */
export function downloadFile(
  bucket: string,
  path: string,
  filename?: string,
): void {
  const url = getFileUrl(bucket, path, { download: filename ?? true })
  const a = document.createElement('a')
  a.href = url
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
