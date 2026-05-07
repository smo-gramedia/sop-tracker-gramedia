"use client";

// src/components/user/SopKategoriClient.tsx
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  Download,
  AlertCircle,
  X,
  Search,
  ChevronDown,
} from "lucide-react";
import PdfPreviewModal from "./PdfPreviewModal";

type ProgressItem = {
  sopDocumentId: string;
  stepCurrent: number;
  status: string;
};

type Doc = {
  id: string;
  kode: string;
  judul: string;
  deskripsi: string | null;
  tipe: string;
  versi: string;
  tanggalBerlaku: Date | null;
  department: {
    id: string;
    nama: string;
    divisionId: string;
    division: { id: string; nama: string };
  } | null;
  subcategory: { id: string; nama: string } | null;
  sopAttachments: { id: string; filename: string }[];
};

type Division = {
  id: string;
  nama: string;
  departments: { id: string; nama: string }[];
};

type Subcategory = { id: string; kode: string; nama: string };

type Props = {
  kategori: string;
  pageTitle: string;
  documents: Doc[];
  totalDocs: number;
  progressList: ProgressItem[];
  progressMap: Record<string, ProgressItem>;
  isAdmin: boolean;
  divisions: Division[];
  subcategories: Subcategory[];
};

export default function SopKategoriClient({
  kategori,
  pageTitle,
  documents,
  totalDocs,
  progressList,
  progressMap,
  isAdmin,
  divisions,
  subcategories,
}: Props) {
  // Modal state
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);
  const [popup, setPopup] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Filter & sidebar state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tipeFilter, setTipeFilter] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedSubcatId, setSelectedSubcatId] = useState<string | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set()
  );

  // Hanya divisions yang punya departemen ber-SOP di kategori ini
  const relevantDivisions = useMemo(() => {
    if (kategori === "sg" || kategori === "petunjuk") return [];
    const deptIdsWithSops = new Set(
      documents.map((d) => d.department?.id).filter(Boolean)
    );
    return divisions
      .map((div) => ({
        ...div,
        departments: div.departments.filter((d) => deptIdsWithSops.has(d.id)),
      }))
      .filter((div) => div.departments.length > 0);
  }, [divisions, documents, kategori]);

  // Filter sidebar by search
  const filteredDivisions = useMemo(() => {
    if (!sidebarSearch) return relevantDivisions;
    const q = sidebarSearch.toLowerCase();
    return relevantDivisions
      .map((div) => ({
        ...div,
        departments: div.departments.filter((d) =>
          d.nama.toLowerCase().includes(q)
        ),
      }))
      .filter(
        (div) =>
          div.nama.toLowerCase().includes(q) || div.departments.length > 0
      );
  }, [relevantDivisions, sidebarSearch]);

  // Subcategories yang punya dokumen (untuk SOP General)
  const relevantSubcats = useMemo(() => {
    if (kategori !== "sg") return [];
    const subcatIdsWithSops = new Set(
      documents.map((d) => d.subcategory?.id).filter(Boolean)
    );
    return subcategories.filter((s) => subcatIdsWithSops.has(s.id));
  }, [subcategories, documents, kategori]);

  // Filter dokumen
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Filter by department (kategori non-sg, non-petunjuk)
      if (selectedDeptId && doc.department?.id !== selectedDeptId) {
        return false;
      }
      // Filter by subcategory (kategori sg)
      if (selectedSubcatId && doc.subcategory?.id !== selectedSubcatId) {
        return false;
      }
      // Search by kode/judul/deskripsi
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          doc.kode.toLowerCase().includes(q) ||
          doc.judul.toLowerCase().includes(q) ||
          (doc.deskripsi?.toLowerCase().includes(q) ?? false);
        if (!matches) return false;
      }
      // Filter by status
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
      // Filter by tipe
      if (tipeFilter && doc.tipe !== tipeFilter) {
        return false;
      }
      return true;
    });
  }, [
    documents,
    selectedDeptId,
    selectedSubcatId,
    searchQuery,
    statusFilter,
    tipeFilter,
    progressMap,
  ]);

  // Toggle accordion division
  function toggleDivision(divId: string) {
    setExpandedDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(divId)) next.delete(divId);
      else next.add(divId);
      return next;
    });
  }

  /** Cek action availability based on progress + role */
  function getActionLock(doc: Doc): { title: string; message: string } | null {
    if (isAdmin) return null;

    const progress = progressMap[doc.id];

    if (!progress || progress.status === "belum") {
      return {
        title: "SOP Belum Dipelajari",
        message:
          "Silakan pelajari SOP terlebih dahulu sebelum dapat melihat atau mengunduh dokumen.",
      };
    }

    const isCompleted =
      progress.status === "selesai" && progress.stepCurrent === 6;
    if (!isCompleted) {
      return {
        title: "Pembelajaran Belum Selesai",
        message:
          "Pembelajaran SOP harus diselesaikan terlebih dahulu (100%) sebelum Anda dapat melihat atau mengunduh dokumen.",
      };
    }

    return null;
  }

  function handleView(doc: Doc) {
    const lock = getActionLock(doc);
    if (lock) {
      setPopup(lock);
      return;
    }
    if (doc.sopAttachments.length === 0) {
      setPopup({
        title: "Dokumen Belum Tersedia",
        message:
          "PDF utama untuk SOP ini belum di-upload oleh admin. Hubungi admin untuk informasi lebih lanjut.",
      });
      return;
    }
    setPreviewDoc(doc);
  }

  function handleDownload(doc: Doc) {
    const lock = getActionLock(doc);
    if (lock) {
      setPopup(lock);
      return;
    }
    if (doc.sopAttachments.length === 0) {
      setPopup({
        title: "Dokumen Belum Tersedia",
        message:
          "PDF utama untuk SOP ini belum di-upload oleh admin. Hubungi admin untuk informasi lebih lanjut.",
      });
      return;
    }
    window.location.href = `/api/sop/${doc.id}/download`;
  }

  // Untuk header sub-display
  const selectedDivision = useMemo(() => {
    if (!selectedDeptId) return null;
    for (const div of relevantDivisions) {
      const dept = div.departments.find((d) => d.id === selectedDeptId);
      if (dept) return { div, dept };
    }
    return null;
  }, [selectedDeptId, relevantDivisions]);

  const selectedSubcat = useMemo(() => {
    if (!selectedSubcatId) return null;
    return relevantSubcats.find((s) => s.id === selectedSubcatId) ?? null;
  }, [selectedSubcatId, relevantSubcats]);

  // Header for content area
  const contentHeader = (() => {
    if (kategori === "sg") {
      return {
        title: selectedSubcat ? selectedSubcat.nama : "Semua SOP General",
        sub: selectedSubcat
          ? selectedSubcat.kode
          : "Pilih sub-kategori untuk filter",
      };
    }
    if (kategori === "petunjuk") {
      return {
        title: "Semua Petunjuk Pelaksanaan",
        sub: `${filteredDocs.length} dokumen tersedia`,
      };
    }
    return {
      title: selectedDivision
        ? selectedDivision.dept.nama
        : "Semua Division",
      sub: selectedDivision
        ? selectedDivision.div.nama
        : "Pilih division/department untuk filter",
    };
  })();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
          {pageTitle}
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">
          Temukan {pageTitle} dengan lebih cepat dan terstruktur.
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          {kategori === "sg" || kategori === "petunjuk"
            ? "Cek status pembelajaran Anda, lalu buka dokumen yang perlu dipelajari."
            : "Pilih division untuk melihat daftar SOP yang relevan, cek status pembelajaran Anda, lalu buka dokumen yang perlu dipelajari."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-foreground text-background rounded-xl p-4">
          <div className="text-xs text-background/60 mb-1">Total Dokumen</div>
          <div className="font-display font-bold text-2xl">{totalDocs}</div>
        </div>
        <div className="bg-background border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">
            Sedang Dipelajari
          </div>
          <div className="font-display font-bold text-2xl">
            {progressList.filter((p) => p.status === "dipelajari").length}
          </div>
        </div>
        <div className="bg-background border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Selesai</div>
          <div className="font-display font-bold text-2xl text-green-600">
            {progressList.filter((p) => p.status === "selesai").length}
          </div>
        </div>
      </div>

      {/* Layout: 2-column for sr/ss/sp, 1-column for sg/petunjuk */}
      {kategori !== "sg" && kategori !== "petunjuk" ? (
        // ─── 2-column layout ─────────────────────────────────────
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start">
          {/* SIDEBAR — Division/Department list */}
          <aside className="bg-background border rounded-xl overflow-hidden">
            {/* Sidebar search */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b">
              <Search size={13} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari divisi / departemen..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="flex-1 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2 border-b bg-muted/40">
              Daftar Division
            </div>

            {/* Division accordion */}
            <div className="max-h-[600px] overflow-y-auto">
              {/* "Semua" option */}
              <button
                onClick={() => setSelectedDeptId(null)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs hover:bg-muted/40 transition-colors border-b ${
                  !selectedDeptId ? "bg-foreground/5 font-medium" : ""
                }`}
              >
                <span>Semua Division</span>
                <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                  {totalDocs}
                </span>
              </button>

              {filteredDivisions.length === 0 && sidebarSearch && (
                <div className="text-xs text-muted-foreground p-4 text-center">
                  Tidak ada hasil
                </div>
              )}

              {filteredDivisions.map((div) => {
                const isExpanded = expandedDivisions.has(div.id);
                const docCount = documents.filter(
                  (d) =>
                    d.department?.id &&
                    div.departments.some((dp) => dp.id === d.department!.id)
                ).length;
                return (
                  <div key={div.id} className="border-b last:border-0">
                    <button
                      onClick={() => toggleDivision(div.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/40 transition-colors text-left"
                    >
                      <span className="text-xs font-semibold flex-1 truncate pr-2">
                        {div.nama}
                      </span>
                      <span className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                          {docCount}
                        </span>
                        <ChevronDown
                          size={11}
                          className={`text-muted-foreground transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="bg-muted/20">
                        <div className="px-3 pt-1.5 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                          Departemen
                        </div>
                        {div.departments.map((dept) => {
                          const deptDocCount = documents.filter(
                            (d) => d.department?.id === dept.id
                          ).length;
                          return (
                            <button
                              key={dept.id}
                              onClick={() => setSelectedDeptId(dept.id)}
                              className={`w-full flex items-center justify-between text-left text-xs px-5 py-1.5 hover:bg-muted/50 transition-colors ${
                                selectedDeptId === dept.id
                                  ? "bg-foreground/5 font-medium border-l-2 border-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <span className="truncate pr-2">{dept.nama}</span>
                              <span className="text-[10px] flex-shrink-0">
                                {deptDocCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <div>
            {/* Selected header */}
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                {selectedDeptId ? "DEPARTMENT TERPILIH" : "SEMUA DIVISION"}
              </div>
              <h2 className="font-display font-bold text-xl">
                {contentHeader.title}
              </h2>
              <p className="text-xs text-muted-foreground">
                {contentHeader.sub}
              </p>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="flex-1 flex items-center gap-2 bg-background border rounded-lg px-3 py-2">
                <Search size={14} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari SOP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-sm bg-transparent border-none outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Semua Status</option>
                <option value="belum">Belum Dipelajari</option>
                <option value="dipelajari">Sedang Dipelajari</option>
                <option value="selesai">Selesai</option>
              </select>
              <select
                value={tipeFilter}
                onChange={(e) => setTipeFilter(e.target.value)}
                className="bg-background border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Semua Jenis</option>
                <option value="MP">Manual Prosedur</option>
                <option value="PS">Panduan / Standar</option>
                <option value="IK">Instruksi Kerja</option>
              </select>
            </div>

            {/* Cards list */}
            <div className="space-y-2.5">
              {filteredDocs.map((doc) => (
                <SopCard
                  key={doc.id}
                  doc={doc}
                  progress={progressMap[doc.id]}
                  onView={() => handleView(doc)}
                  onDownload={() => handleDownload(doc)}
                />
              ))}
              {filteredDocs.length === 0 && (
                <div className="bg-background border rounded-xl p-12 text-center text-sm text-muted-foreground">
                  Tidak ada SOP yang sesuai dengan filter.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // ─── Single column layout (sg & petunjuk) ────────────────
        <div>
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex-1 flex items-center gap-2 bg-background border rounded-lg px-3 py-2">
              <Search size={14} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari SOP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent border-none outline-none"
              />
            </div>
            {kategori === "sg" && relevantSubcats.length > 0 && (
              <select
                value={selectedSubcatId ?? ""}
                onChange={(e) => setSelectedSubcatId(e.target.value || null)}
                className="bg-background border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Semua Sub-Kategori</option>
                {relevantSubcats.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))}
              </select>
            )}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Semua Status</option>
              <option value="belum">Belum Dipelajari</option>
              <option value="dipelajari">Sedang Dipelajari</option>
              <option value="selesai">Selesai</option>
            </select>
            {kategori !== "petunjuk" && (
              <select
                value={tipeFilter}
                onChange={(e) => setTipeFilter(e.target.value)}
                className="bg-background border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Semua Jenis</option>
                <option value="MP">Manual Prosedur</option>
                <option value="PS">Panduan / Standar</option>
                <option value="IK">Instruksi Kerja</option>
              </select>
            )}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDocs.map((doc) => (
              <SopCard
                key={doc.id}
                doc={doc}
                progress={progressMap[doc.id]}
                onView={() => handleView(doc)}
                onDownload={() => handleDownload(doc)}
              />
            ))}
          </div>
          {filteredDocs.length === 0 && (
            <div className="bg-background border rounded-xl p-12 text-center text-sm text-muted-foreground">
              Tidak ada dokumen yang sesuai dengan filter.
            </div>
          )}
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
    </div>
  );
}

// ─── SOP Card ─────────────────────────────────────────────────────────
function SopCard({
  doc,
  progress,
  onView,
  onDownload,
}: {
  doc: Doc;
  progress?: ProgressItem;
  onView: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="bg-background border rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <span className="font-mono text-[11px] text-muted-foreground">
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
      <h3 className="font-display font-bold text-base leading-snug mb-1.5">
        {doc.judul}
      </h3>
      {doc.deskripsi && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {doc.deskripsi}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          title="Lihat dokumen"
          className="text-xs font-medium border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors flex items-center gap-1.5"
        >
          <Eye size={12} /> View
        </button>
        <button
          onClick={onDownload}
          title="Download dokumen"
          className="text-xs font-medium border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors flex items-center gap-1.5"
        >
          <Download size={12} /> Download
        </button>
        <Link
          href={`/belajar/${doc.id}`}
          className="ml-auto text-xs font-medium bg-foreground text-background rounded-lg px-3 py-1.5 hover:bg-foreground/90 transition-colors flex items-center gap-1.5"
        >
          <BookOpen size={12} /> Pelajari
        </Link>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  if (!status || status === "belum") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium bg-gray-50 text-gray-600 border-gray-200">
        Belum Dibaca
      </span>
    );
  }
  const map: Record<string, { color: string; label: string }> = {
    dipelajari: {
      color: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Sedang dipelajari",
    },
    selesai: {
      color: "bg-green-50 text-green-700 border-green-200",
      label: "✓ Selesai",
    },
  };
  const cfg = map[status];
  if (!cfg) return null;
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}
    >
      {cfg.label}
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-background rounded-2xl border w-full max-w-md overflow-hidden shadow-xl">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
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
              className="text-sm font-medium px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
