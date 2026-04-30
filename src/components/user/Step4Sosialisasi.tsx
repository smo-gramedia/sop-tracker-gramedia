// src/components/user/Step4Sosialisasi.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { previewFile } from '@/lib/download'

interface SosialisasiAttachment {
  id: string
  filename: string
  mimeType: string
  ukuranKb: number
  uploadKe: number
  status: 'menunggu' | 'disetujui' | 'ditolak' | 'pending'
  alasanTolak: string | null
  uploadedAt: Date | string
}

interface Props {
  sopDocumentId: string
  /** Riwayat upload sosialisasi user untuk SOP ini (paling baru di atas). */
  existing: SosialisasiAttachment[]
}

const STATUS_LABEL: Record<SosialisasiAttachment['status'], string> = {
  menunggu: 'Menunggu Verifikasi',
  pending: 'Pending',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
}

const STATUS_COLOR: Record<SosialisasiAttachment['status'], string> = {
  menunggu: 'bg-amber-100 text-amber-800',
  pending: 'bg-gray-100 text-gray-800',
  disetujui: 'bg-green-100 text-green-800',
  ditolak: 'bg-red-100 text-red-800',
}

export function Step4Sosialisasi({ sopDocumentId, existing }: Props) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const latest = existing[0]
  const isApproved = latest?.status === 'disetujui'
  const isPending = latest?.status === 'menunggu'
  const canReupload = !latest || latest.status === 'ditolak'

  async function handleUpload() {
    if (!file) {
      setError('Pilih file terlebih dahulu')
      return
    }
    setUploading(true)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', 'sosialisasi')
    fd.append('tipe', 'sosialisasi')
    fd.append('sopDocumentId', sopDocumentId)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload gagal')
      setFile(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload gagal')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">
          Step 4 — Upload Bukti Sosialisasi
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Upload foto atau PDF bukti sosialisasi (max 10MB). File akan
          diverifikasi admin sebelum Bapak/Ibu bisa lanjut ke Post Test.
        </p>
      </div>

      {/* Status latest upload */}
      {latest && (
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">
              Upload terakhir (ke-{latest.uploadKe})
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLOR[latest.status]}`}
            >
              {STATUS_LABEL[latest.status]}
            </span>
          </div>

          <button
            onClick={() => previewFile('sosialisasi', latest.filename)}
            className="text-sm text-blue-600 hover:underline"
          >
            Lihat file
          </button>

          {latest.status === 'ditolak' && latest.alasanTolak && (
            <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">
              <strong>Alasan tolak:</strong> {latest.alasanTolak}
            </div>
          )}

          {isApproved && (
            <div className="mt-2 rounded bg-green-50 p-2 text-sm text-green-700">
              ✓ Bukti disetujui. Silakan lanjut ke Step 5 (Post Test).
            </div>
          )}
        </div>
      )}

      {/* Upload form (jika belum upload atau di-reject) */}
      {canReupload && (
        <div className="rounded-lg border bg-white p-4">
          <label className="mb-2 block text-sm font-medium">
            Pilih file (JPG / PNG / WebP / PDF, max 10MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setError(null)
            }}
            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />

          {file && (
            <p className="mt-2 text-xs text-gray-500">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}

          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Mengupload…' : 'Upload Bukti'}
          </button>
        </div>
      )}

      {/* Pesan kalau pending */}
      {isPending && (
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          Bukti Bapak/Ibu sedang menunggu verifikasi admin. Silakan cek
          notifikasi nanti.
        </div>
      )}

      {/* Riwayat upload (kalau lebih dari 1) */}
      {existing.length > 1 && (
        <details className="rounded-lg border bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Riwayat upload ({existing.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {existing.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between border-b pb-2 text-sm last:border-0"
              >
                <div>
                  <span className="font-medium">Upload ke-{item.uploadKe}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {new Date(item.uploadedAt).toLocaleString('id-ID')}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[item.status]}`}
                >
                  {STATUS_LABEL[item.status]}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
