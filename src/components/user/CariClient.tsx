// src/components/user/CariClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Hash,
  ArrowRight,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  kode: string;
  judul: string;
  kategori: string;
  deskripsi: string | null;
  versi: string;
  createdAt: Date;
  department: { nama: string } | null;
};

type Props = {
  query: string;
  results: SearchResult[];
  total: number;
  kategoriFilter: string;
  /** Kategori yang boleh dilihat akun ini (dari src/lib/access.ts). */
  allowedKategori?: readonly string[];
};

const KATEGORI_LABEL: Record<string, string> = {
  sr: "SOP Operation",
  ss: "SOP Supporting Unit",
  sp: "SOP Publishing & Education",
  sg: "SOP General",
  petunjuk: "Petunjuk Pelaksanaan",
};

const KATEGORI_COLOR: Record<string, string> = {
  sr: "bg-green-50 text-green-700 border-green-200",
  ss: "bg-blue-50 text-blue-700 border-blue-200",
  sp: "bg-purple-50 text-purple-700 border-purple-200",
  sg: "bg-amber-50 text-amber-700 border-amber-200",
  petunjuk: "bg-gray-50 text-gray-600 border-gray-200",
};

const KATEGORI_LIST = ["sr", "ss", "sp", "sg", "petunjuk"];

/**
 * Highlight kata kunci di dalam teks
 */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-100 text-amber-900 font-medium px-0.5 rounded-sm"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function CariClient({
  query,
  results,
  total,
  kategoriFilter,
  allowedKategori,
}: Props) {
  // Sembunyikan chip filter untuk kategori yang tidak dapat diakses.
  const kategoriTampil = allowedKategori
    ? KATEGORI_LIST.filter((k) => allowedKategori.includes(k))
    : KATEGORI_LIST;
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(query);

  // Group hasil per kategori untuk display lebih rapi
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((r) => {
      if (!groups[r.kategori]) groups[r.kategori] = [];
      groups[r.kategori].push(r);
    });
    return groups;
  }, [results]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInput.trim();
    if (q.length < 2) return;
    const params = new URLSearchParams();
    params.set("q", q);
    if (kategoriFilter) params.set("kategori", kategoriFilter);
    router.push(`/cari?${params.toString()}`);
  }

  function setKategoriFilter(k: string) {
    const params = new URLSearchParams();
    params.set("q", query);
    if (k) params.set("kategori", k);
    router.push(`/cari?${params.toString()}`);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Hasil Pencarian</p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl mt-1">
          {query ? (
            <>
              Cari: <span className="text-primary">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Pencarian Dokumen"
          )}
        </h1>
        {query && (
          <p className="text-sm text-muted-foreground mt-1">
            {total > 0
              ? `Menampilkan ${results.length} dari ${total} dokumen`
              : "Tidak ditemukan dokumen yang sesuai"}
          </p>
        )}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex items-center gap-2 bg-background border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-shadow shadow-sm">
          <Search size={18} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Masukkan kata kunci..."
            className="flex-1 bg-transparent border-none outline-none text-sm min-w-0"
            autoFocus
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Clear"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="submit"
            disabled={searchInput.trim().length < 2}
            className="text-xs font-semibold bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            Cari
          </button>
        </div>
      </form>

      {/* Filter kategori — chips */}
      {query && total > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter size={12} /> Filter:
          </span>
          <FilterChip
            active={!kategoriFilter}
            onClick={() => setKategoriFilter("")}
          >
            Semua ({total})
          </FilterChip>
          {kategoriTampil.map((k) => {
            const count = results.filter((r) => r.kategori === k).length;
            // Hide chip kalau tidak ada hasil di kategori ini DAN tidak sedang aktif
            if (count === 0 && kategoriFilter !== k) return null;
            return (
              <FilterChip
                key={k}
                active={kategoriFilter === k}
                onClick={() => setKategoriFilter(k)}
              >
                {KATEGORI_LABEL[k]} {kategoriFilter !== k && `(${count})`}
              </FilterChip>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {query.length < 2 ? (
        <div className="bg-background border rounded-xl p-12 text-center">
          <Search size={40} className="mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-display font-semibold text-lg mb-1">
            Mulai mencari
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Ketik kata kunci di kolom pencarian — bisa kode SOP, judul, atau
            kata dari deskripsi.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-3">
            Minimal 2 karakter
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-background border rounded-xl p-12 text-center">
          <FileText
            size={40}
            className="mx-auto mb-3 text-muted-foreground/30"
          />
          <h3 className="font-display font-semibold text-lg mb-1">
            Tidak ditemukan
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Tidak ada dokumen yang cocok dengan{" "}
            <strong className="text-foreground">&ldquo;{query}&rdquo;</strong>
            {kategoriFilter && (
              <>
                {" "}
                di kategori{" "}
                <strong className="text-foreground">
                  {KATEGORI_LABEL[kategoriFilter]}
                </strong>
              </>
            )}
            .
          </p>
          <p className="text-xs text-muted-foreground/70 mt-3">
            Coba kata kunci lain atau hilangkan filter
          </p>
        </div>
      ) : (
        /* Results grouped by kategori */
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([kategori, items]) => (
            <section key={kategori}>
              <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full border font-medium",
                    KATEGORI_COLOR[kategori] ??
                      "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {KATEGORI_LABEL[kategori] ?? kategori}
                </span>
                <span className="text-muted-foreground font-normal">
                  ({items.length})
                </span>
              </h2>
              <div className="bg-background border rounded-xl divide-y overflow-hidden">
                {items.map((r) => (
                  <Link
                    key={r.id}
                    href={`/belajar/${r.id}`}
                    className="block px-4 py-3.5 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Hash
                            size={11}
                            className="text-muted-foreground flex-shrink-0"
                          />
                          <span className="text-xs font-mono text-muted-foreground">
                            <HighlightedText text={r.kode} query={query} />
                          </span>
                          <span className="text-xs text-muted-foreground">
                            v.{r.versi}
                          </span>
                          {r.department?.nama && (
                            <>
                              <span className="text-xs text-muted-foreground">
                                ·
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {r.department.nama}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-medium leading-snug mb-1">
                          <HighlightedText text={r.judul} query={query} />
                        </div>
                        {r.deskripsi && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            <HighlightedText
                              text={r.deskripsi}
                              query={query}
                            />
                          </p>
                        )}
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-muted-foreground flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {total > results.length && (
            <p className="text-xs text-center text-muted-foreground py-3">
              Menampilkan {results.length} hasil teratas dari {total}. Coba
              persempit pencarian dengan kata kunci lebih spesifik.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
