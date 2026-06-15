"use client";

// src/components/admin/RawDokumenClient.tsx
import { useState, useMemo } from "react";
import { Eye, Download, Search } from "lucide-react";
import { formatTanggal, formatFileSize } from "@/lib/utils";

type RawDoc = {
  id: string;
  filename: string;
  ukuranKb: number;
  uploadedAt: Date;
  sopDocument: {
    kode: string;
    judul: string;
    kategori: string;
    status?: string;
    department: { nama: string } | null;
  };
  uploadedBy: { nama: string };
};

export default function RawDokumenClient({ rawDocs }: { rawDocs: RawDoc[] }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  // ─── Filter state ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ─── Dynamic department list ────────────────────────────────────────
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    rawDocs.forEach((d) => {
      if (d.sopDocument.department?.nama) set.add(d.sopDocument.department.nama);
    });
    return Array.from(set).sort();
  }, [rawDocs]);

  // ─── Filtered list ──────────────────────────────────────────────────
  const filteredRawDocs = useMemo(() => {
    return rawDocs.filter((r) => {
      // Search: nama SOP, kode
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          r.sopDocument.judul.toLowerCase().includes(q) ||
          r.sopDocument.kode.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (kategoriFilter && r.sopDocument.kategori !== kategoriFilter)
        return false;
      if (deptFilter && r.sopDocument.department?.nama !== deptFilter)
        return false;
      if (statusFilter && r.sopDocument.status !== statusFilter) return false;
      return true;
    });
  }, [rawDocs, search, kategoriFilter, deptFilter, statusFilter]);

  function handleView(r: RawDoc) {
    // Buka file di tab baru
    window.open(`/api/files/raw-documents/${r.filename}`, "_blank");
  }

  async function handleDownload(r: RawDoc) {
    setDownloading(r.id);
    try {
      // Trigger download via temporary anchor
      const link = document.createElement("a");
      link.href = `/api/files/raw-documents/${r.filename}`;
      const downloadName =
        r.filename.split("/").pop() ||
        `${r.sopDocument.kode.replace(/\//g, "-")}.docx`;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal download");
    } finally {
      setTimeout(() => setDownloading(null), 800);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Manajemen Dokumen</p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl mt-1">Raw Dokumen</h1>
      </div>

      <div className="bg-muted/30 rounded-xl border p-4 mb-6 text-sm text-muted-foreground flex gap-2">
        <span>ℹ</span>
        <span>
          Raw dokumen berupa file Word (.docx) yang diunggah bersama SOP.
          Hanya tersedia untuk{" "}
          <strong className="text-foreground">view</strong> dan{" "}
          <strong className="text-foreground">download</strong>.
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-background border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama SOP atau kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent border-none outline-none"
          />
        </div>
        <select
          value={kategoriFilter}
          onChange={(e) => setKategoriFilter(e.target.value)}
          className="bg-background border rounded-xl px-3 py-2 text-sm min-w-[160px]"
        >
          <option value="">Semua Kategori</option>
          <option value="sr">SOP Operation</option>
          <option value="ss">Supporting Unit</option>
          <option value="sp">Publishing</option>
          <option value="sg">General</option>
          <option value="petunjuk">Petunjuk</option>
        </select>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="bg-background border rounded-xl px-3 py-2 text-sm min-w-[160px]"
        >
          <option value="">Semua Departemen</option>
          {departmentOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background border rounded-xl px-3 py-2 text-sm min-w-[140px]"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="draft">Draft</option>
          <option value="obsolete">Obsolete</option>
        </select>
      </div>

      <div className="bg-background rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Judul Dokumen
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Jenis Dokumen
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Departemen
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Tanggal Upload
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Ukuran
                </th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRawDocs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    {rawDocs.length === 0
                      ? "Belum ada raw dokumen"
                      : "Tidak ada dokumen yang sesuai filter"}
                  </td>
                </tr>
              ) : (
                filteredRawDocs.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium">{r.sopDocument.judul}</div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {r.sopDocument.kode}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <KategoriBadge kategori={r.sopDocument.kategori} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-sm">
                      {r.sopDocument.department?.nama ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.sopDocument.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {formatTanggal(r.uploadedAt)}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {formatFileSize(r.ukuranKb)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleView(r)}
                          className="text-xs border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors font-medium flex items-center gap-1.5"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          onClick={() => handleDownload(r)}
                          disabled={downloading === r.id}
                          className="text-xs bg-foreground text-background rounded-lg px-3 py-1.5 hover:bg-foreground/90 transition-colors font-medium flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Download size={12} />{" "}
                          {downloading === r.id ? "..." : "Download"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredRawDocs.length > 0 && (
          <div className="px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground text-right">
            Menampilkan {filteredRawDocs.length} dari {rawDocs.length} dokumen
          </div>
        )}
      </div>
    </div>
  );
}

function KategoriBadge({ kategori }: { kategori: string }) {
  const colors: Record<string, string> = {
    sr: "bg-green-50 text-green-700 border-green-200",
    ss: "bg-blue-50 text-blue-700 border-blue-200",
    sp: "bg-purple-50 text-purple-700 border-purple-200",
    sg: "bg-amber-50 text-amber-700 border-amber-200",
    petunjuk: "bg-gray-50 text-gray-600 border-gray-200",
  };
  const labels: Record<string, string> = {
    sr: "SOP Operation",
    ss: "SOP Supporting Unit",
    sp: "SOP Publishing",
    sg: "SOP General",
    petunjuk: "Petunjuk Pelaksanaan",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
        colors[kategori] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {labels[kategori] ?? kategori}
    </span>
  );
}

// ─── Status Badge: Aktif (hijau) / Draft (kuning) / Obsolete (merah) ──
function StatusBadge({ status }: { status?: string }) {
  if (!status) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const config: Record<string, { color: string; label: string }> = {
    aktif: { color: "bg-green-50 text-green-700 border-green-200", label: "Aktif" },
    draft: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Draft" },
    obsolete: { color: "bg-red-50 text-red-700 border-red-200", label: "Obsolete" },
  };
  const c = config[status] ?? {
    color: "bg-muted text-muted-foreground border-border",
    label: status,
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c.color}`}>
      {c.label}
    </span>
  );
}
