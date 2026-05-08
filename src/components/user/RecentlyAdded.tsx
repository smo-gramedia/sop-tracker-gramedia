// src/components/user/RecentlyAdded.tsx
import Link from "next/link";
import { Sparkles, ArrowRight, FileText } from "lucide-react";

type RecentSop = {
  id: string;
  kode: string;
  judul: string;
  kategori: string;
  deskripsi: string | null;
  tanggalBerlaku: Date | null;
  department: { nama: string } | null;
};

const KATEGORI_BG: Record<string, string> = {
  sr: "bg-cat-sr",
  ss: "bg-cat-ss",
  sp: "bg-cat-sp",
  sg: "bg-cat-sg",
  petunjuk: "bg-cat-petunjuk",
};

const KATEGORI_LABEL: Record<string, string> = {
  sr: "SOP Operation",
  ss: "Supporting Unit",
  sp: "Publishing",
  sg: "General",
  petunjuk: "Petunjuk",
};

export default function RecentlyAdded({ items }: { items: RecentSop[] }) {
  if (items.length === 0) return null;

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display font-bold text-2xl">SOP Terbaru</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Dokumen SOP yang baru di-upload
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.slice(0, 4).map((sop) => {
          const bgClass = KATEGORI_BG[sop.kategori] ?? "bg-muted";
          const label = KATEGORI_LABEL[sop.kategori] ?? sop.kategori;

          return (
            <Link
              key={sop.id}
              href={`/belajar/${sop.id}`}
              className="bg-background rounded-2xl border overflow-hidden hover-lift hover:border-primary/30 group"
            >
              {/* Colored top section */}
              <div className={`${bgClass} p-5 relative h-28 overflow-hidden`}>
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/40 blob-decoration" />
                <div className="relative">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                    {label}
                  </span>
                  <div className="font-mono text-[10px] text-foreground/50 mt-1">
                    {sop.kode}
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <FileText size={16} className="text-foreground/70" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-display font-bold text-sm leading-snug line-clamp-2 mb-2 min-h-[2.5rem]">
                  {sop.judul}
                </h3>
                <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
                  <span className="truncate">
                    {sop.department?.nama ?? "—"}
                  </span>
                  <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:gap-1 transition-all flex-shrink-0">
                    Buka <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
