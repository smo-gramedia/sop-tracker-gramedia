"use client";

// src/components/user/JuklakClient.tsx
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  Download,
  BookOpen,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  Circle,
  FileText,
} from "lucide-react";
import PdfPreviewModal from "./PdfPreviewModal";
import DownloadConfirmDialog from "./DownloadConfirmDialog";

type ProgressData = {
  stepCurrent: number;
  status: string;
};

type Document = {
  id: string;
  kode: string;
  judul: string;
  deskripsi: string | null;
  versi: string;
  tanggalBerlaku: string | null;
  permittedAccess: string | null;
  departmentNama: string | null;
  sopAttachments: { id: string; filename: string }[];
};

type Props = {
  documents: Document[];
  progressMap: Record<string, ProgressData>;
  accessValues: string[];
  departmentValues: string[];
  isAdmin: boolean;
};

// Theme untuk Petunjuk Pelaksanaan (slate-gray)
const THEME = {
  gradient: "from-slate-600 via-slate-700 to-zinc-800",
  badge: "bg-slate-100 text-slate-700",
  icon: "📋",
};

export default function JuklakClient({
  documents,
  progressMap,
  accessValues,
  departmentValues,
  isAdmin,
}: Props) {
  // Filter state
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterAccess, setFilterAccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal state
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [popup, setPopup] = useState<{ title: string; message: string } | null>(
    null
  );

  // Filter logic
  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !doc.judul.toLowerCase().includes(q) &&
          !doc.kode.toLowerCase().includes(q) &&
          !(doc.deskripsi?.toLowerCase().includes(q) ?? false)
        ) {
          return false;
        }
      }
      if (filterDept && doc.departmentNama !== filterDept) return false;
      if (filterAccess && doc.permittedAccess !== filterAccess) return false;
      if (statusFilter) {
        const progress = progressMap[doc.id];
        if (statusFilter === "selesai") {
          if (progress?.status !== "selesai") return false;
        } else if (statusFilter === "dipelajari") {
          if (progress?.status !== "dipelajari") return false;
        } else if (statusFilter === "belum") {
          if (progress && progress.status !== "belum") return false;
        }
      }
      return true;
    });
  }, [documents, search, filterDept, filterAccess, statusFilter, progressMap]);

  // Stats
  const selesaiCount = Object.values(progressMap).filter(
    (p) => p.status === "selesai"
  ).length;
  const dipelajariCount = Object.values(progressMap).filter(
    (p) => p.status === "dipelajari"
  ).length;

  // Gating logic (sama dengan SOP kategori lain)
  function getActionLock(
    doc: Document
  ): { title: string; message: string } | null {
    if (isAdmin) return null;
    const progress = progressMap[doc.id];
    if (!progress || progress.status === "belum") {
      return {
        title: "Petunjuk Belum Dipelajari",
        message:
          "Silakan pelajari Petunjuk Pelaksanaan terlebih dahulu sebelum dapat melihat atau mengunduh dokumen.",
      };
    }
    const isCompleted =
      progress.status === "selesai" && progress.stepCurrent === 6;
    if (!isCompleted) {
      return {
        title: "Pembelajaran Belum Selesai",
        message:
          "Pembelajaran Petunjuk Pelaksanaan harus diselesaikan terlebih dahulu (100%) sebelum Anda dapat melihat atau mengunduh dokumen.",
      };
    }
    return null;
  }

  function handleView(doc: Document) {
    const lock = getActionLock(doc);
    if (lock) {
      setPopup(lock);
      return;
    }
    if (!doc.sopAttachments || doc.sopAttachments.length === 0) {
      setPopup({
        title: "Dokumen Belum Tersedia",
        message:
          "PDF utama untuk Petunjuk Pelaksanaan ini belum di-upload oleh admin. Hubungi admin untuk informasi lebih lanjut.",
      });
      return;
    }
    setPreviewDoc(doc);
  }

  const [dlConfirmUrl, setDlConfirmUrl] = useState<string | null>(null);

  function handleDownload(doc: Document) {
    const lock = getActionLock(doc);
    if (lock) {
      setPopup(lock);
      return;
    }
    if (!doc.sopAttachments || doc.sopAttachments.length === 0) {
      setPopup({
        title: "Dokumen Belum Tersedia",
        message:
          "PDF utama untuk Petunjuk Pelaksanaan ini belum di-upload oleh admin. Hubungi admin untuk informasi lebih lanjut.",
      });
      return;
    }
    setDlConfirmUrl(`/api/sop/${doc.id}/download`);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Hero — gradient slate */}
      <div
        className={`relative bg-gradient-to-br ${THEME.gradient} rounded-3xl overflow-hidden animate-fade-in`}
      >
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 blob-decoration" />
        <div className="absolute -bottom-20 -left-12 w-72 h-72 bg-white/5 blob-decoration" />

        <div className="relative px-8 py-10 md:px-12">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <h1 className="font-display font-bold text-3xl md:text-4xl text-white leading-tight mb-3">
                Temukan Petunjuk Pelaksanaan
                <br />
                <span className="text-white/90">
                  dengan lebih cepat dan terstruktur.
                </span>
              </h1>
              <p className="text-white/80 text-sm leading-relaxed max-w-xl">
                Halaman ini menampilkan seluruh juklak yang dapat diakses
                berdasarkan unit atau departemen. Cek status pembelajaran Anda,
                lalu buka dokumen yang perlu dipelajari.
              </p>
            </div>
          </div>

          {/* Stats inline */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-white text-2xl font-display font-bold">
                {documents.length}
              </div>
              <div className="text-white/70 text-xs">Total Dokumen</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-white text-2xl font-display font-bold">
                {dipelajariCount}
              </div>
              <div className="text-white/70 text-xs">Sedang Dipelajari</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-white text-2xl font-display font-bold">
                {selesaiCount}
              </div>
              <div className="text-white/70 text-xs">Selesai</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 animate-slide-up">
        <div className="flex-1 flex items-center gap-2 bg-background border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari juklak berdasarkan judul, kode, atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent border-none outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background border rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Semua Status</option>
          <option value="belum">Belum Dipelajari</option>
          <option value="dipelajari">Sedang Dipelajari</option>
          <option value="selesai">Selesai</option>
        </select>

        {departmentValues.length > 0 && (
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-background border rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Semua Departemen</option>
            {departmentValues.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {accessValues.length > 0 && (
          <select
            value={filterAccess}
            onChange={(e) => setFilterAccess(e.target.value)}
            className="bg-background border rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Semua Akses</option>
            {accessValues.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-slide-up">
          {filtered.map((doc) => (
            <JuklakCard
              key={doc.id}
              doc={doc}
              progress={progressMap[doc.id]}
              onView={() => handleView(doc)}
              onDownload={() => handleDownload(doc)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-background border rounded-2xl p-12 text-center animate-slide-up">
          <div className="w-12 h-12 rounded-full bg-muted/60 mx-auto mb-3 flex items-center justify-center">
            <FileText size={20} className="text-muted-foreground/60" />
          </div>
          <p className="text-sm text-muted-foreground">
            {documents.length === 0
              ? "Belum ada juklak yang tersedia."
              : "Tidak ada juklak yang cocok dengan filter Anda."}
          </p>
          {documents.length > 0 && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              Coba ubah filter atau search keyword.
            </p>
          )}
        </div>
      )}

      {/* Footer count */}
      {filtered.length > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          Menampilkan {filtered.length} dari {documents.length} juklak
        </div>
      )}

      {/* Popup info modal */}
      {popup && (
        <InfoPopup
          title={popup.title}
          message={popup.message}
          onClose={() => setPopup(null)}
        />
      )}

      {/* PDF preview modal */}
      {previewDoc && previewDoc.sopAttachments[0] && (
        <PdfPreviewModal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.judul}
          fileUrl={`/api/files/sop-attachments/${previewDoc.sopAttachments[0].filename}`}
        />
      )}
      <DownloadConfirmDialog
        open={!!dlConfirmUrl}
        onClose={() => setDlConfirmUrl(null)}
        onConfirm={() => dlConfirmUrl && (window.location.href = dlConfirmUrl)}
      />
    </div>
  );
}

// ─── Juklak Card ──────────────────────────────────────────────────────
function JuklakCard({
  doc,
  progress,
  onView,
  onDownload,
}: {
  doc: Document;
  progress?: ProgressData;
  onView: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="bg-background border rounded-2xl overflow-hidden hover-lift hover:border-primary/30 group">
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${THEME.badge}`}
          >
            {doc.kode}
          </span>
          <StatusBadge status={progress?.status} />
          <span className="text-[11px] text-muted-foreground ml-auto">
            {doc.versi} ·{" "}
            {doc.tanggalBerlaku
              ? new Date(doc.tanggalBerlaku).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
        </div>

        <h3 className="font-display font-bold text-base leading-snug mb-2 group-hover:text-primary transition-colors">
          {doc.judul}
        </h3>

        {doc.deskripsi && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
            {doc.deskripsi}
          </p>
        )}

        {/* Department & Permitted Access */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {doc.departmentNama && (
            <span className="text-[11px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              {doc.departmentNama}
            </span>
          )}
          <AccessBadge access={doc.permittedAccess} />
        </div>

        {/* Progress indicator */}
        {progress && progress.status !== "belum" && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-bold">
                {Math.round((progress.stepCurrent / 6) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${THEME.gradient} rounded-full transition-all`}
                style={{
                  width: `${Math.round((progress.stepCurrent / 6) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onView();
            }}
            title="Lihat dokumen"
            className="text-xs font-medium border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors flex items-center gap-1.5 relative z-10"
          >
            <Eye size={12} /> View
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDownload();
            }}
            title="Download dokumen"
            className="text-xs font-medium border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors flex items-center gap-1.5 relative z-10"
          >
            <Download size={12} /> Download
          </button>
          <Link
            href={`/belajar/${doc.id}`}
            className={`ml-auto text-xs font-bold text-white rounded-lg px-4 py-1.5 hover:opacity-90 transition-opacity flex items-center gap-1.5 bg-gradient-to-r ${THEME.gradient} shadow-sm relative z-10`}
          >
            <BookOpen size={12} /> Pelajari
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  if (!status || status === "belum") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium bg-gray-50 text-gray-600 border-gray-200 flex items-center gap-1">
        <Circle size={8} /> Belum Dibaca
      </span>
    );
  }
  const map: Record<
    string,
    { color: string; label: string; icon: React.ElementType }
  > = {
    dipelajari: {
      color: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Sedang dipelajari",
      icon: Clock,
    },
    selesai: {
      color: "bg-green-50 text-green-700 border-green-200",
      label: "Selesai",
      icon: CheckCircle2,
    },
  };
  const cfg = map[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${cfg.color}`}
    >
      <Icon size={8} /> {cfg.label}
    </span>
  );
}

// ─── Access Badge ─────────────────────────────────────────────────────
function AccessBadge({ access }: { access: string | null }) {
  if (!access) return null;
  const colorMap: Record<string, string> = {
    all: "bg-blue-50 text-blue-700 border-blue-200",
    "store-only": "bg-amber-50 text-amber-700 border-amber-200",
    Store: "bg-amber-50 text-amber-700 border-amber-200",
    Finance: "bg-purple-50 text-purple-700 border-purple-200",
  };
  const color =
    colorMap[access] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex text-[11px] px-2 py-0.5 rounded-full border font-medium ${color}`}
    >
      {access}
    </span>
  );
}

// ─── Info Popup ───────────────────────────────────────────────────────
function InfoPopup({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-background rounded-2xl border w-full max-w-md overflow-hidden shadow-xl animate-scale-in">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="font-display font-bold text-lg">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            {message}
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="text-sm font-medium px-4 py-2 bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
