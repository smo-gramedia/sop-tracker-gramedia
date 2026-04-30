// src/components/user/BantuanClient.tsx
"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown } from "lucide-react";

type Faq = {
  id: string;
  pertanyaan: string;
  jawaban: string;
};

type Props = {
  faqs: Faq[];
};

export default function BantuanClient({ faqs }: Props) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // Simple case-insensitive contains pada pertanyaan + jawaban
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(
      (f) =>
        f.pertanyaan.toLowerCase().includes(q) ||
        f.jawaban.toLowerCase().includes(q)
    );
  }, [faqs, query]);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative max-w-xl mx-auto">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          placeholder="Cari pertanyaan…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* FAQ list */}
      <div className="bg-background rounded-2xl border divide-y overflow-hidden">
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            {faqs.length === 0
              ? "Belum ada FAQ tersedia."
              : `Tidak ada hasil untuk "${query}".`}
          </div>
        )}

        {filtered.map((f) => {
          const isOpen = openId === f.id;
          return (
            <div key={f.id}>
              <button
                onClick={() => setOpenId(isOpen ? null : f.id)}
                className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="flex-1 font-medium text-sm pt-0.5">
                  {f.pertanyaan}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-muted-foreground flex-shrink-0 mt-0.5 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {f.jawaban}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length > 0 && query && (
        <p className="text-xs text-muted-foreground text-center">
          Menampilkan {filtered.length} dari {faqs.length} pertanyaan
        </p>
      )}
    </div>
  );
}
