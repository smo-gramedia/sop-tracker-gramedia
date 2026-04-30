// src/app/(user)/bantuan/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft, Search, HelpCircle } from "lucide-react";
import BantuanClient from "@/components/user/BantuanClient";

export default async function BantuanPage() {
  const faqs = await prisma.faqEntry.findMany({
    orderBy: { urutan: "asc" },
    select: {
      id: true,
      pertanyaan: true,
      jawaban: true,
    },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Navbar — mengikuti pola halaman user lain */}
      <nav className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            href="/home"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} /> Kembali
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="font-semibold text-sm">Bantuan & FAQ</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-foreground text-background items-center justify-center">
            <HelpCircle size={28} />
          </div>
          <h1 className="font-display font-bold text-3xl">
            Pusat Bantuan
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Temukan jawaban atas pertanyaan yang sering diajukan tentang
            penggunaan SOP Tracker Gramedia.
          </p>
        </div>

        {/* Search + Accordion (client) */}
        <BantuanClient faqs={faqs} />

        {/* Footer info */}
        <div className="bg-background rounded-2xl border p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Pertanyaan Anda tidak ada di sini?
          </p>
          <p className="text-sm">
            Hubungi tim{" "}
            <strong className="text-foreground">SMO Kompas Gramedia</strong>{" "}
            atau admin sistem terdekat untuk bantuan lebih lanjut.
          </p>
        </div>
      </div>
    </div>
  );
}
