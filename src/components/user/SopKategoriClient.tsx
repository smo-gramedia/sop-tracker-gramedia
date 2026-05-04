// src/components/user/SopKategoriClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, Eye, Download, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────
type SopDocument = {
  id: string;
  kode: string;
  judul: string;
  deskripsi: string | null;
  tipe: string;
  versi: string;
  tanggalBerlaku: string | null;
  departmentId: string | null;
  departmentNama: string | null;
  divisionId: string | null;
  divisionNama: string | null;
  subcategoryId: string | null;
  subcategoryNama: string | null;
  progressStatus: string | null;
  stepCurrent: number | null;
};

type Division = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  directorateNama: string;
  count: number;
  departments: { id: string; kode: string; nama: string; count: number }[];
};

type Subcategory = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  count: number;
};

type Props =
  | {
      mode: "division";
      kategori: string;
      pageTitle: string;
      documents: SopDocument[];
      divisions: Division[];
    }
  | {
      mode: "subcategory";
      kategori: string;
      pageTitle: string;
      documents: SopDocument[];
      subcategories: Subcategory[];
    };

// ─── Selection state ─────────────────────────────────────────────────
type Selection =
  | { type: "all" }
  | { type: "division"; id: string }
  | { type: "department"; id: string; divisionId: string }
  | { type: "subcategory"; id: string };

export default function SopKategoriClient(props: Props) {
  const { mode, kategori, pageTitle, documents } = props;

  // Default: tampilkan semua SOP (sesuai pilihan user)
  const [selection, setSelection] = useState<Selection>({ type: "all" });
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set()
  );

  // Filter content area
  const [contentSearch, setContentSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTipe, setFilterTipe] = useState("");

  // ─── Filter documents berdasarkan selection ────────────────────────
  const filteredDocs = useMemo(() => {
    let docs = documents;

    // Step 1: filter berdasarkan selection sidebar
    if (selection.type === "division") {
      docs = docs.filter((d) => d.divisionId === selection.id);
    } else if (selection.type === "department") {
      docs = docs.filter((d) => d.departmentId === selection.id);
    } else if (selection.type === "subcategory") {
      docs = docs.filter((d) => d.subcategoryId === selection.id);
    }
    // selection.type === "all" → tidak filter

    // Step 2: filter content area (search, status, tipe)
    if (contentSearch.trim()) {
      const q = contentSearch.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.judul.toLowerCase().includes(q) ||
          d.kode.toLowerCase().includes(q) ||
          (d.deskripsi?.toLowerCase().includes(q) ?? false)
      );
    }
    if (filterStatus) {
      docs = docs.filter((d) => {
        if (filterStatus === "Sedang dipelajari")
          return d.progressStatus === "dipelajari";
        if (filterStatus === "Belum Dibaca")
          return !d.progressStatus || d.progressStatus === "belum";
        if (filterStatus === "Selesai") return d.progressStatus === "selesai";
        return true;
      });
    }
    if (filterTipe) {
      docs = docs.filter((d) => d.tipe === filterTipe);
    }

    return docs;
  }, [documents, selection, contentSearch, filterStatus, filterTipe]);

  // ─── Sidebar items filter berdasarkan search sidebar ──────────────
  const filteredSidebarItems = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    if (!q) return mode === "division" ? props.divisions : props.subcategories;

    if (mode === "division") {
      return props.divisions.filter(
        (div) =>
          div.nama.toLowerCase().includes(q) ||
          div.departments.some((dept) => dept.nama.toLowerCase().includes(q))
      );
    } else {
      return props.subcategories.filter((sub) =>
        sub.nama.toLowerCase().includes(q)
      );
    }
  }, [mode, sidebarSearch, props]);

  // ─── Stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = documents.length;
    const dipelajari = documents.filter(
      (d) => d.progressStatus === "dipelajari"
    ).length;
    const selesai = documents.filter(
      (d) => d.progressStatus === "selesai"
    ).length;
    return { total, dipelajari, selesai };
  }, [documents]);

  // ─── Selected entity name (untuk header content area) ─────────────
  const selectedName = useMemo(() => {
    if (selection.type === "all") return "Semua SOP";
    if (mode === "division") {
      if (selection.type === "division") {
        return props.divisions.find((d) => d.id === selection.id)?.nama ?? "";
      }
      if (selection.type === "department") {
        const div = props.divisions.find((d) => d.id === selection.divisionId);
        const dept = div?.departments.find((d) => d.id === selection.id);
        return dept?.nama ?? "";
      }
    } else {
      if (selection.type === "subcategory") {
        return (
          props.subcategories.find((s) => s.id === selection.id)?.nama ?? ""
        );
      }
    }
    return "";
  }, [selection, mode, props]);

  const selectedSubtitle = useMemo(() => {
    if (selection.type === "all") return "Menampilkan seluruh dokumen";
    if (selection.type === "division") return "Semua departemen";
    if (selection.type === "department") return "Filter per departemen";
    if (selection.type === "subcategory") {
      return (
        props.subcategories.find((s) => s.id === selection.id)?.deskripsi ?? ""
      );
    }
    return "";
  }, [selection, props]);

  function toggleDivisionExpand(divisionId: string) {
    setExpandedDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(divisionId)) next.delete(divisionId);
      else next.add(divisionId);
      return next;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wider text-primary mb-1 font-semibold">
          {pageTitle}
        </div>
        <h1 className="font-display font-bold text-3xl mb-2">
          Temukan {pageTitle} dengan lebih cepat dan terstruktur.
        </h1>
        <p className="text-muted-foreground text-sm">
          {mode === "division"
            ? "Pilih division untuk melihat daftar SOP yang relevan, cek status pembelajaran Anda, lalu buka dokumen yang perlu dipelajari."
            : "Pilih sub-kategori untuk melihat SOP yang relevan, cek status pembelajaran, dan buka dokumen yang perlu dipelajari."}
        </p>
      </div>

      {/* ─── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-brand rounded-xl p-5">
          <div className="text-sm text-white/70 mb-1">Total Dokumen</div>
          <div className="font-display font-bold text-3xl text-white">
            {stats.total}
          </div>
        </div>
        <div className="bg-background border rounded-xl p-5">
          <div className="text-sm text-muted-foreground mb-1">
            Sedang Dipelajari
          </div>
          <div className="font-display font-bold text-3xl">
            {stats.dipelajari}
          </div>
        </div>
        <div className="bg-background border rounded-xl p-5">
          <div className="text-sm text-muted-foreground mb-1">Selesai</div>
          <div className="font-display font-bold text-3xl text-green-600">
            {stats.selesai}
          </div>
        </div>
      </div>

      {/* ─── 2-column layout: Sidebar + Content ──────────────────── */}
      <div className="grid grid-cols-[280px_1fr] gap-6">
        {/* SIDEBAR */}
        <aside className="bg-background border rounded-xl overflow-hidden h-fit sticky top-20">
          {/* Sidebar search */}
          <div className="flex items-center gap-2 p-3 border-b">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder={
                mode === "division"
                  ? "Cari divisi / departemen..."
                  : "Cari sub-kategori..."
              }
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* "Semua" option */}
          <button
            onClick={() => setSelection({ type: "all" })}
            className={cn(
              "w-full text-left px-4 py-3 text-sm border-b transition-colors hover:bg-muted/50",
              selection.type === "all" &&
                "bg-primary/10 text-primary font-medium"
            )}
          >
            <div className="flex items-center justify-between">
              <span>Semua {mode === "division" ? "SOP" : "Sub-Kategori"}</span>
              <span className="text-xs text-muted-foreground">
                {documents.length}
              </span>
            </div>
          </button>

          {/* Header */}
          <div className="px-4 py-2 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            {mode === "division" ? "Daftar Division" : "Daftar Sub-Kategori"}
          </div>

          {/* List items */}
          <div className="max-h-[600px] overflow-y-auto">
            {mode === "division" &&
              (filteredSidebarItems as Division[]).map((div) => {
                const isDivSelected =
                  selection.type === "division" && selection.id === div.id;
                const isDivExpanded = expandedDivisions.has(div.id);
                const hasDeptSelected =
                  selection.type === "department" &&
                  selection.divisionId === div.id;

                return (
                  <div key={div.id} className="border-b last:border-0">
                    {/* Division row */}
                    <div className="flex">
                      <button
                        onClick={() =>
                          setSelection({ type: "division", id: div.id })
                        }
                        className={cn(
                          "flex-1 text-left px-4 py-3 transition-colors hover:bg-muted/40",
                          (isDivSelected || hasDeptSelected) &&
                            "bg-primary/10"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              (isDivSelected || hasDeptSelected) &&
                                "text-primary"
                            )}
                          >
                            {div.nama}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {div.count}
                          </span>
                        </div>
                        {div.deskripsi && (
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            {div.deskripsi}
                          </div>
                        )}
                      </button>
                      {div.departments.length > 0 && (
                        <button
                          onClick={() => toggleDivisionExpand(div.id)}
                          className="px-3 hover:bg-muted/40 transition-colors text-muted-foreground"
                          aria-label="Toggle departments"
                        >
                          <ChevronDown
                            size={14}
                            className={cn(
                              "transition-transform",
                              isDivExpanded && "rotate-180"
                            )}
                          />
                        </button>
                      )}
                    </div>

                    {/* Departments (expanded) */}
                    {isDivExpanded && div.departments.length > 0 && (
                      <div className="bg-muted/20">
                        <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pl-8">
                          Departemen
                        </div>
                        {div.departments.map((dept) => {
                          const isDeptSelected =
                            selection.type === "department" &&
                            selection.id === dept.id;
                          return (
                            <button
                              key={dept.id}
                              onClick={() =>
                                setSelection({
                                  type: "department",
                                  id: dept.id,
                                  divisionId: div.id,
                                })
                              }
                              className={cn(
                                "w-full text-left pl-8 pr-4 py-2 text-xs hover:bg-muted/50 transition-colors flex items-center justify-between gap-2 border-t border-border/50",
                                isDeptSelected &&
                                  "bg-primary/10 text-primary font-medium"
                              )}
                            >
                              <span>{dept.nama}</span>
                              <span className="text-muted-foreground">
                                {dept.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

            {mode === "subcategory" &&
              (filteredSidebarItems as Subcategory[]).map((sub) => {
                const isSelected =
                  selection.type === "subcategory" &&
                  selection.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() =>
                      setSelection({ type: "subcategory", id: sub.id })
                    }
                    className={cn(
                      "w-full text-left px-4 py-3 border-b last:border-0 transition-colors hover:bg-muted/40",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isSelected && "text-primary"
                        )}
                      >
                        {sub.nama}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {sub.count}
                      </span>
                    </div>
                    {sub.deskripsi && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {sub.deskripsi}
                      </div>
                    )}
                  </button>
                );
              })}

            {filteredSidebarItems.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                Tidak ada hasil
              </div>
            )}
          </div>
        </aside>

        {/* CONTENT */}
        <div className="bg-background border rounded-xl p-6">
          {/* Header content area */}
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              {selection.type === "all"
                ? "TAMPILAN"
                : selection.type === "subcategory"
                ? "SUB-KATEGORI TERPILIH"
                : selection.type === "department"
                ? "DEPARTEMEN TERPILIH"
                : "DIVISION TERPILIH"}
            </div>
            <div className="font-display font-bold text-xl">{selectedName}</div>
            <div className="text-sm text-muted-foreground">
              {selectedSubtitle}
            </div>
          </div>

          {/* Filter row */}
          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Cari SOP..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]"
            >
              <option value="">Status</option>
              <option value="Sedang dipelajari">Sedang dipelajari</option>
              <option value="Belum Dibaca">Belum Dibaca</option>
              <option value="Selesai">Selesai</option>
            </select>
            <select
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
            >
              <option value="">Jenis Dokumen</option>
              <option value="MP">Manual Prosedur</option>
              <option value="PS">Panduan / Standar</option>
              <option value="IK">Instruksi Kerja</option>
            </select>
          </div>

          {/* SOP cards */}
          <div className="space-y-3">
            {filteredDocs.map((doc) => (
              <SopCard key={doc.id} doc={doc} />
            ))}

            {filteredDocs.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {documents.length === 0
                  ? "Belum ada SOP untuk kategori ini."
                  : "Tidak ada SOP yang cocok dengan filter Anda."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SOP Card component ───────────────────────────────────────────────
function SopCard({ doc }: { doc: SopDocument }) {
  const tanggalStr = doc.tanggalBerlaku
    ? new Date(doc.tanggalBerlaku).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="border rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition-all">
      {/* Top meta */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="font-mono text-xs text-muted-foreground">
          {doc.kode}
        </span>
        <StatusBadge status={doc.progressStatus} />
        <span className="text-xs text-muted-foreground ml-auto">
          {doc.versi} · {tanggalStr}
        </span>
      </div>

      {/* Title */}
      <div className="font-display font-bold text-base mb-1.5">
        {doc.judul}
      </div>

      {/* Description */}
      {doc.deskripsi && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {doc.deskripsi}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs gap-1.5"
        >
          <Eye size={12} /> View
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs gap-1.5"
        >
          <Download size={12} /> Download
        </Button>
        <Link href={`/belajar/${doc.id}`} className="ml-auto">
          <Button size="sm" className="h-8 px-3 text-xs gap-1.5">
            <BookOpen size={12} /> Pelajari
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status || status === "belum") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border font-medium">
        Belum Dibaca
      </span>
    );
  }
  const map: Record<string, { className: string; label: string }> = {
    dipelajari: {
      className: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Sedang dipelajari",
    },
    selesai: {
      className: "bg-green-50 text-green-700 border-green-200",
      label: "✓ Selesai",
    },
  };
  const conf = map[status];
  if (!conf) return null;
  return (
    <span
      className={cn(
        "text-[10px] px-2 py-0.5 rounded-full border font-medium",
        conf.className
      )}
    >
      {conf.label}
    </span>
  );
}
