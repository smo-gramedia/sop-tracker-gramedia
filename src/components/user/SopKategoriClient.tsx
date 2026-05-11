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
  CheckCircle2,
  Clock,
  Circle,
  FileText,
  Sparkles,
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

// Konfigurasi visual per kategori
const KATEGORI_THEME: Record<
  string,
  {
    gradient: string;
    bgSoft: string;
    accent: string;
    badge: string;
    icon: string;
  }
> = {
  sr: {
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    bgSoft: "from-green-50 to-emerald-50",
    accent: "text-green-700",
    badge: "bg-green-100 text-green-700",
    icon: "🏬",
  },
  ss: {
    gradient: "from-blue-500 via-cyan-500 to-indigo-500",
    bgSoft: "from-blue-50 to-cyan-50",
    accent: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    icon: "👥",
  },
  sp: {
    gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
    bgSoft: "from-purple-50 to-pink-50",
    accent: "text-purple-700",
    badge: "bg-purple-100 text-purple-700",
    icon: "🎓",
  },
  sg: {
    gradient: "from-amber-500 via-orange-500 to-red-500",
    bgSoft: "from-amber-50 to-orange-50",
    accent: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    icon: "📄",
  },
  petunjuk: {
    gradient: "from-slate-500 via-gray-500 to-zinc-500",
    bgSoft: "from-slate-50 to-gray-50",
    accent: "text-slate-700",
    badge: "bg-slate-100 text-slate-700",
    icon: "📋",
  },
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
  const theme = KATEGORI_THEME[kategori] ?? KATEGORI_THEME.petunjuk;

  // Modal state
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);
  const [popup, setPopup] = useState<{ title: string; message: string } | null>(
    null
  );

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

  const relevantSubcats = useMemo(() => {
    if (kategori !== "sg") return [];
    const subcatIdsWithSops = new Set(
      documents.map((d) => d.subcategory?.id).filter(Boolean)
    );
    return subcategories.filter((s) => subcatIdsWithSops.has(s.id));
  }, [subcategories, documents, kategori]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedDeptId && doc.department?.id !== selectedDeptId) return false;
      if (selectedSubcatId && doc.subcategory?.id !== selectedSubcatId)
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          doc.kode.toLowerCase().includes(q) ||
          doc.judul.toLowerCase().includes(q) ||
          (doc.deskripsi?.toLowerCase().includes(q) ?? false);
        if (!matches) return false;
      }
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
      if (tipeFilter && doc.tipe !== tipeFilter) return false;
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

  function toggleDivision(divId: string) {
    setExpandedDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(divId)) next.delete(divId);
      else next.add(divId);
      return next;
    });
  }

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
    // DEBUG LOGGING — bisa dihapus setelah bug ketemu
    console.log("[SOP View Click]", {
      kategori,
      docId: doc.id,
      docKode: doc.kode,
      isAdmin,
      progress: progressMap[doc.id],
      attachments: doc.sopAttachments?.length ?? 0,
    });

    const lock = getActionLock(doc);
    if (lock) {
      console.log("[SOP View] Lock detected, showing popup:", lock.title);
      setPopup(lock);
      return;
    }
    if (!doc.sopAttachments || doc.sopAttachments.length === 0) {
      console.log("[SOP View] No PDF, showing fallback popup");
      setPopup({
        title: "Dokumen Belum Tersedia",
        message:
          "PDF utama untuk SOP ini belum di-upload oleh admin. Hubungi admin untuk informasi lebih lanjut.",
      });
      return;
    }
    console.log("[SOP View] Opening preview modal");
    setPreviewDoc(doc);
  }

  function handleDownload(doc: Doc) {
    // DEBUG LOGGING — bisa dihapus setelah bug ketemu
    console.log("[SOP Download Click]", {
      kategori,
      docId: doc.id,
      docKode: doc.kode,
      isAdmin,
      progress: progressMap[doc.id],
      attachments: doc.sopAttachments?.length ?? 0,
    });

    const lock = getActionLock(doc);
    if (lock) {
      console.log("[SOP Download] Lock detected, showing popup:", lock.title);
      setPopup(lock);
      return;
    }
    if (!doc.sopAttachments || doc.sopAttachments.length === 0) {
      console.log("[SOP Download] No PDF, showing fallback popup");
      setPopup({
        title: "Dokumen Belum Tersedia",
        message:
          "PDF utama untuk SOP ini belum di-upload oleh admin. Hubungi admin untuk informasi lebih lanjut.",
      });
      return;
    }
    console.log("[SOP Download] Triggering download for SOP:", doc.id);
    window.location.href = `/api/sop/${doc.id}/download`;
  }

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

  // Stats
  const selesaiCount = progressList.filter((p) => p.status === "selesai").length;
  const dipelajariCount = progressList.filter(
    (p) => p.status === "dipelajari"
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Hero per kategori — gradient berwarna */}
      <div
        className={`relative bg-gradient-to-br ${theme.gradient} rounded-3xl overflow-hidden animate-fade-in`}
      >
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 blob-decoration" />
        <div className="absolute -bottom-20 -left-12 w-72 h-72 bg-white/5 blob-decoration" />

        <div className="relative px-8 py-10 md:px-12">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <h1 className="font-display font-bold text-3xl md:text-4xl text-white leading-tight mb-3">
                Temukan {pageTitle}
                <br />
                <span className="text-white/90">
                  dengan lebih cepat dan terstruktur.
                </span>
              </h1>
              <p className="text-white/80 text-sm leading-relaxed max-w-xl">
                {kategori === "sg" || kategori === "petunjuk"
                  ? "Cek status pembelajaran Anda, lalu buka dokumen yang perlu dipelajari."
                  : "Pilih division untuk melihat daftar SOP yang relevan, cek status pembelajaran, lalu buka dokumen."}
              </p>
            </div>
          </div>

          {/* Stats inline */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-white text-2xl font-display font-bold">
                {totalDocs}
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

      {/* Layout: 2-column for sr/ss/sp, 1-column for sg/petunjuk */}
      {kategori !== "sg" && kategori !== "petunjuk" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start animate-slide-up">
          {/* SIDEBAR */}
          <aside className="bg-background border rounded-2xl overflow-hidden sticky top-20">
            <div className="flex items-center gap-2 px-3 py-3 border-b">
              <Search size={13} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari divisi / departemen..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="flex-1 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2.5 border-b bg-muted/40">
              Daftar Division
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              <button
                onClick={() => setSelectedDeptId(null)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs hover:bg-muted/40 transition-colors border-b ${
                  !selectedDeptId
                    ? `bg-gradient-to-r ${theme.bgSoft} font-semibold`
                    : ""
                }`}
              >
                <span>Semua Division</span>
                <span
                  className={`text-[10px] rounded-full px-2 py-0.5 ${
                    !selectedDeptId
                      ? `${theme.badge} font-bold`
                      : "bg-muted text-muted-foreground"
                  }`}
                >
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
                          const isActive = selectedDeptId === dept.id;
                          return (
                            <button
                              key={dept.id}
                              onClick={() => setSelectedDeptId(dept.id)}
                              className={`w-full flex items-center justify-between text-left text-xs px-5 py-1.5 transition-colors ${
                                isActive
                                  ? `bg-gradient-to-r ${theme.bgSoft} font-semibold border-l-2 ${theme.accent} border-current`
                                  : "text-muted-foreground hover:bg-muted/50"
                              }`}
                            >
                              <span className="truncate pr-2">{dept.nama}</span>
                              <span className="text-[10px] flex-shrink-0 font-mono">
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
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 font-semibold">
                {selectedDeptId ? "DEPARTMENT TERPILIH" : "SEMUA DIVISION"}
              </div>
              <h2 className="font-display font-bold text-2xl">
                {selectedDivision
                  ? selectedDivision.dept.nama
                  : "Semua Division"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedDivision
                  ? selectedDivision.div.nama
                  : "Pilih division/department untuk filter"}
              </p>
            </div>

            <FilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              tipeFilter={tipeFilter}
              setTipeFilter={setTipeFilter}
              showTipeFilter
            />

            <div className="space-y-2.5 mt-4">
              {filteredDocs.map((doc) => (
                <SopCard
                  key={doc.id}
                  doc={doc}
                  progress={progressMap[doc.id]}
                  theme={theme}
                  onView={() => handleView(doc)}
                  onDownload={() => handleDownload(doc)}
                />
              ))}
              {filteredDocs.length === 0 && <EmptyState />}
            </div>
          </div>
        </div>
      ) : (
        // Single column layout (sg & petunjuk)
        <div className="animate-slide-up">
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            tipeFilter={tipeFilter}
            setTipeFilter={setTipeFilter}
            showTipeFilter={kategori !== "petunjuk"}
            extraFilter={
              kategori === "sg" && relevantSubcats.length > 0 ? (
                <select
                  value={selectedSubcatId ?? ""}
                  onChange={(e) => setSelectedSubcatId(e.target.value || null)}
                  className="bg-background border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">Semua Sub-Kategori</option>
                  {relevantSubcats.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              ) : null
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {filteredDocs.map((doc) => (
              <SopCard
                key={doc.id}
                doc={doc}
                progress={progressMap[doc.id]}
                theme={theme}
                onView={() => handleView(doc)}
                onDownload={() => handleDownload(doc)}
              />
            ))}
          </div>
          {filteredDocs.length === 0 && <EmptyState />}
        </div>
      )}

      {popup && (
        <InfoPopup
          title={popup.title}
          message={popup.message}
          onClose={() => setPopup(null)}
        />
      )}

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

// ─── Filter Bar ──────────────────────────────────────────────────────
function FilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  tipeFilter,
  setTipeFilter,
  showTipeFilter,
  extraFilter,
}: {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  tipeFilter: string;
  setTipeFilter: (s: string) => void;
  showTipeFilter: boolean;
  extraFilter?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1 flex items-center gap-2 bg-background border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
        <Search size={14} className="text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari SOP berdasarkan judul, kode, atau deskripsi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 text-sm bg-transparent border-none outline-none"
        />
      </div>
      {extraFilter}
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
      {showTipeFilter && (
        <select
          value={tipeFilter}
          onChange={(e) => setTipeFilter(e.target.value)}
          className="bg-background border rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Semua Jenis</option>
          <option value="MP">Manual Prosedur</option>
          <option value="PS">Panduan / Standar</option>
          <option value="IK">Instruksi Kerja</option>
        </select>
      )}
    </div>
  );
}

// ─── SOP Card ──────────────────────────────────────────────────────
function SopCard({
  doc,
  progress,
  theme,
  onView,
  onDownload,
}: {
  doc: Doc;
  progress?: ProgressItem;
  theme: (typeof KATEGORI_THEME)[string];
  onView: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="bg-background border rounded-2xl overflow-hidden hover-lift hover:border-primary/30 group">
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}
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
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
            {doc.deskripsi}
          </p>
        )}

        {/* Progress indicator (kalau ada progress) */}
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
                className={`h-full bg-gradient-to-r ${theme.gradient} rounded-full transition-all`}
                style={{
                  width: `${Math.round((progress.stepCurrent / 6) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

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
            className={`ml-auto text-xs font-bold text-white rounded-lg px-4 py-1.5 hover:opacity-90 transition-opacity flex items-center gap-1.5 bg-gradient-to-r ${theme.gradient} shadow-sm relative z-10`}
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

// ─── Empty State ──────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="bg-background border rounded-2xl p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-muted/60 mx-auto mb-3 flex items-center justify-center">
        <FileText size={20} className="text-muted-foreground/60" />
      </div>
      <p className="text-sm text-muted-foreground">
        Tidak ada SOP yang sesuai dengan filter.
      </p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Coba ubah filter atau search keyword.
      </p>
    </div>
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
