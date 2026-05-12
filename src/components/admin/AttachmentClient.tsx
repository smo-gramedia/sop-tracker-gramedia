"use client";

// src/components/admin/AttachmentClient.tsx
import { useState, useMemo } from "react";
import { Search, Download } from "lucide-react";
import { formatTanggal } from "@/lib/utils";
import AttachmentActions from "./AttachmentActions";

type Attachment = {
  id: string;
  status: string;
  filename: string;
  uploadKe: number;
  uploadedAt: Date;
  alasanTolak?: string | null;
  user: {
    id: string;
    nama: string;
    unit: string | null;
    email: string;
  };
  sopDocument: {
    id: string;
    kode: string;
    judul: string;
  };
};

type Props = {
  attachments: Attachment[];
  total: number;
  menunggu: number;
  disetujui: number;
  ditolak: number;
};

export default function AttachmentClient({
  attachments,
  total,
  menunggu,
  disetujui,
  ditolak,
}: Props) {
  // ─── Filter state ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  // ─── Filtered list ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return attachments.filter((att) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          att.user.nama.toLowerCase().includes(q) ||
          (att.user.unit?.toLowerCase().includes(q) ?? false) ||
          att.user.email.toLowerCase().includes(q) ||
          att.sopDocument.judul.toLowerCase().includes(q) ||
          att.sopDocument.kode.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter && att.status !== statusFilter) return false;
      return true;
    });
  }, [attachments, search, statusFilter]);

  // ─── Export Excel ───────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true);
    try {
      // Get IDs of filtered attachments
      const ids = filtered.map((a) => a.id);
      const res = await fetch("/api/attachment/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Export gagal (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `attachment-sosialisasi-${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal export");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Monitoring</p>
          <h1 className="font-display font-bold text-3xl mt-1">
            Attachment Sosialisasi SOP
          </h1>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || filtered.length === 0}
          className="bg-foreground text-background rounded-xl px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            filtered.length === 0
              ? "Tidak ada data untuk di-export"
              : "Export data ke Excel"
          }
        >
          <Download size={14} />
          {exporting ? "Meng-export..." : "Export Excel"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Masuk", value: total, color: "text-foreground" },
          { label: "Menunggu", value: menunggu, color: "text-amber-600" },
          { label: "Disetujui", value: disetujui, color: "text-green-600" },
          { label: "Ditolak", value: ditolak, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="bg-background rounded-xl border p-5">
            <div className={`font-display font-bold text-3xl ${s.color}`}>
              {s.value}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-background border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama user, unit, atau nama SOP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent border-none outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background border rounded-xl px-3 py-2 text-sm min-w-[160px]"
        >
          <option value="">Semua Status</option>
          <option value="menunggu">Menunggu</option>
          <option value="disetujui">Disetujui</option>
          <option value="ditolak">Ditolak</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-background rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Nama User
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                SOP
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Upload ke-
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Tanggal
              </th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((att) => (
              <tr
                key={att.id}
                className="border-b last:border-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="font-medium">{att.user.nama}</div>
                  <div className="text-xs text-muted-foreground">
                    {att.user.unit ?? "—"}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="text-sm font-medium">
                    {att.sopDocument.judul}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {att.sopDocument.kode}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <AttStatusBadge status={att.status} />
                </td>
                <td className="px-5 py-3 text-center text-muted-foreground">
                  {att.uploadKe}
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {formatTanggal(att.uploadedAt)}
                </td>
                <td className="px-5 py-3">
                  <AttachmentActions attachment={att} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-muted-foreground"
                >
                  {attachments.length === 0
                    ? "Belum ada bukti sosialisasi yang diupload."
                    : "Tidak ada bukti yang sesuai filter"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground text-right">
            Menampilkan {filtered.length} dari {attachments.length} bukti
            sosialisasi
          </div>
        )}
      </div>
    </div>
  );
}

function AttStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    menunggu: "bg-amber-50 text-amber-700 border-amber-200",
    disetujui: "bg-green-50 text-green-700 border-green-200",
    ditolak: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-gray-50 text-gray-600 border-gray-200",
  };
  const labels: Record<string, string> = {
    menunggu: "Menunggu",
    disetujui: "Disetujui",
    ditolak: "Ditolak",
    pending: "Pending",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
        map[status] ?? ""
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
