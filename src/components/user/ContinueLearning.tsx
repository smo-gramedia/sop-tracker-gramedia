// src/components/user/ContinueLearning.tsx
import Link from "next/link";
import { BookOpen, Clock, ArrowRight } from "lucide-react";

type Item = {
  id: string;
  sopDocument: {
    id: string;
    kode: string;
    judul: string;
    kategori: string;
  };
  stepCurrent: number;
  status: string;
};

const STEP_LABEL: Record<number, string> = {
  0: "Petunjuk Pembelajaran",
  1: "Akses Dokumen",
  2: "Baca Dokumen",
  3: "Lampiran",
  4: "Upload Bukti",
  5: "Post Test",
  6: "Penutup",
};

const KATEGORI_COLOR: Record<string, string> = {
  sr: "bg-green-100 text-green-700",
  ss: "bg-blue-100 text-blue-700",
  sp: "bg-purple-100 text-purple-700",
  sg: "bg-amber-100 text-amber-700",
  petunjuk: "bg-gray-100 text-gray-700",
};

const KATEGORI_LABEL: Record<string, string> = {
  sr: "Operation",
  ss: "Supporting",
  sp: "Publishing",
  sg: "General",
  petunjuk: "Petunjuk",
};

export default function ContinueLearning({ items }: { items: Item[] }) {
  if (items.length === 0) return null;

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1">
            Lanjutkan Belajar
          </h2>
          <p className="text-sm text-muted-foreground">
            SOP yang sedang Anda pelajari
          </p>
        </div>
        <Link
          href="/profil"
          className="text-sm text-primary hover:underline font-semibold flex items-center gap-1"
        >
          Lihat semua
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.slice(0, 3).map((item) => {
          const persen = Math.round((item.stepCurrent / 6) * 100);
          return (
            <Link
              key={item.id}
              href={`/belajar/${item.sopDocument.id}`}
              className="bg-background rounded-2xl border p-5 hover-lift hover:border-primary/30 group"
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    KATEGORI_COLOR[item.sopDocument.kategori] ?? ""
                  }`}
                >
                  {KATEGORI_LABEL[item.sopDocument.kategori] ?? item.sopDocument.kategori}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {item.sopDocument.kode}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-base leading-snug mb-3 line-clamp-2 min-h-[3rem]">
                {item.sopDocument.judul}
              </h3>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock size={11} />
                    {STEP_LABEL[item.stepCurrent] ?? `Step ${item.stepCurrent}`}
                  </span>
                  <span className="font-bold text-primary">{persen}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all"
                    style={{ width: `${persen}%` }}
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between text-xs mt-4 pt-3 border-t">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <BookOpen size={11} />
                  Step {item.stepCurrent + 1} dari 7
                </span>
                <span className="text-primary font-bold flex items-center gap-1 group-hover:gap-1.5 transition-all">
                  Lanjutkan
                  <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
