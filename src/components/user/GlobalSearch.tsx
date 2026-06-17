// src/components/user/GlobalSearch.tsx
"use client";

/**
 * Global Search Component
 *
 * Desktop: Inline search bar di navbar
 * Mobile: Icon button → full-screen modal
 *
 * Behavior:
 * - User ngetik 2+ karakter → debounced 300ms → fetch suggestions
 * - 5 suggestion ditampilkan dalam dropdown
 * - Klik suggestion → navigate ke /belajar/{id}
 * - Tekan Enter → navigate ke /cari?q={keyword} (full results)
 * - Esc / klik luar → tutup dropdown
 * - Keyboard navigation: ↑↓ untuk pindah, Enter pilih
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Loader2,
  ArrowRight,
  FileText,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  kode: string;
  judul: string;
  kategori: string;
  deskripsi: string | null;
  versi: string;
  department: { nama: string } | null;
};

// Kategori label untuk display
const KATEGORI_LABEL: Record<string, string> = {
  sr: "SOP Operation",
  ss: "SOP Supporting",
  sp: "SOP Publishing",
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

/**
 * Hook untuk debounced value
 */
function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Inner: search input + suggestion dropdown
 * Dipakai di desktop (inline) dan mobile (modal)
 */
function SearchInner({
  autoFocus = false,
  onSelect,
  onSubmit,
  onClose,
}: {
  autoFocus?: boolean;
  onSelect: (id: string) => void;
  onSubmit: (query: string) => void;
  onClose?: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debouncedQ = useDebouncedValue(q, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus saat mount kalau diperlukan
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Fetch search hasil saat debouncedQ berubah
  useEffect(() => {
    const query = debouncedQ.trim();
    if (query.length < 2) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setResults(data.results ?? []);
        setTotal(data.total ?? 0);
        setActiveIdx(-1);
      })
      .catch(() => {
        if (cancelled) return;
        setResults([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  // Handler keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIdx >= 0 && activeIdx < results.length) {
          // Pilih item yang sedang aktif
          onSelect(results[activeIdx].id);
        } else if (q.trim().length >= 2) {
          // Kalau tidak ada item aktif, navigate ke full results page
          onSubmit(q.trim());
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (onClose) onClose();
        else setQ("");
      }
    },
    [activeIdx, results, q, onSelect, onSubmit, onClose]
  );

  const hasResults = results.length > 0;
  const showDropdown = debouncedQ.trim().length >= 2 && (loading || hasResults || !loading);
  const showEmpty =
    !loading && debouncedQ.trim().length >= 2 && results.length === 0;

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-shadow">
        <Search size={15} className="text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Cari SOP berdasarkan kode atau judul"
          className="flex-1 bg-transparent border-none outline-none text-sm min-w-0"
        />
        {loading && (
          <Loader2 size={14} className="text-muted-foreground animate-spin flex-shrink-0" />
        )}
        {q && !loading && (
          <button
            onClick={() => setQ("")}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown suggestion */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {/* Loading state */}
          {loading && results.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Mencari...
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p>Tidak ditemukan dokumen dengan kata kunci</p>
              <p className="font-semibold mt-1 text-foreground">
                &ldquo;{debouncedQ}&rdquo;
              </p>
              <p className="text-xs mt-2">
                Coba kata kunci lain atau periksa ejaan
              </p>
            </div>
          )}

          {/* Results */}
          {hasResults && (
            <>
              <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground border-b">
                Menampilkan {results.length} dari {total} hasil
              </div>
              <ul role="listbox">
                {results.map((r, i) => (
                  <li
                    key={r.id}
                    role="option"
                    aria-selected={activeIdx === i}
                    className={cn(
                      "px-4 py-3 cursor-pointer transition-colors border-b last:border-0",
                      activeIdx === i
                        ? "bg-muted/60"
                        : "hover:bg-muted/40"
                    )}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => onSelect(r.id)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Hash
                          size={11}
                          className="text-muted-foreground flex-shrink-0"
                        />
                        <span className="text-xs font-mono text-muted-foreground truncate">
                          {r.kode}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          v.{r.versi}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0",
                          KATEGORI_COLOR[r.kategori] ??
                            "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {KATEGORI_LABEL[r.kategori] ?? r.kategori}
                      </span>
                    </div>
                    <div className="text-sm font-medium leading-snug mb-0.5">
                      {r.judul}
                    </div>
                    {r.department?.nama && (
                      <div className="text-xs text-muted-foreground">
                        {r.department.nama}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {/* Footer: link ke full results */}
              {total > results.length && (
                <button
                  onClick={() => onSubmit(q.trim())}
                  className="w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-primary flex items-center justify-center gap-1.5 border-t"
                >
                  Lihat semua {total} hasil
                  <ArrowRight size={13} />
                </button>
              )}
              {/* Hint untuk keyboard user */}
              <div className="px-4 py-2 bg-muted/20 text-[11px] text-muted-foreground border-t flex items-center justify-between">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px] font-mono">
                    ↑
                  </kbd>{" "}
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px] font-mono">
                    ↓
                  </kbd>{" "}
                  Pilih
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px] font-mono">
                    Enter
                  </kbd>{" "}
                  Buka
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px] font-mono">
                    Esc
                  </kbd>{" "}
                  Tutup
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Main component: Desktop inline + Mobile icon-modal
 */
export default function GlobalSearch() {
  const router = useRouter();
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [desktopFocused, setDesktopFocused] = useState(false);

  const handleSelect = (id: string) => {
    setMobileModalOpen(false);
    setDesktopFocused(false);
    router.push(`/belajar/${id}`);
  };

  const handleSubmit = (query: string) => {
    setMobileModalOpen(false);
    setDesktopFocused(false);
    router.push(`/cari?q=${encodeURIComponent(query)}`);
  };

  // Body scroll lock saat modal mobile terbuka
  useEffect(() => {
    if (mobileModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileModalOpen]);

  // Close desktop dropdown saat klik luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setDesktopFocused(false);
      }
    }
    if (desktopFocused) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [desktopFocused]);

  return (
    <>
      {/* ─── Desktop: inline search (hidden di mobile) ──────────── */}
      <div
        ref={wrapperRef}
        className="hidden lg:block w-72 xl:w-80"
        onFocus={() => setDesktopFocused(true)}
      >
        <SearchInner
          onSelect={handleSelect}
          onSubmit={handleSubmit}
          onClose={() => setDesktopFocused(false)}
        />
      </div>

      {/* ─── Mobile: icon button (hidden di desktop) ───────────── */}
      <button
        onClick={() => setMobileModalOpen(true)}
        className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
        aria-label="Cari SOP"
      >
        <Search size={20} className="text-muted-foreground" />
      </button>

      {/* ─── Mobile modal: full-screen search ──────────────────── */}
      {mobileModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-background lg:hidden flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          {/* Header dengan tombol close */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b flex-shrink-0">
            <button
              onClick={() => setMobileModalOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
              aria-label="Tutup pencarian"
            >
              <X size={18} />
            </button>
            <div className="flex-1">
              <SearchInner
                autoFocus
                onSelect={handleSelect}
                onSubmit={handleSubmit}
                onClose={() => setMobileModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
