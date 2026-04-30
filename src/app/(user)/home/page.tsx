// src/app/(user)/home/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SOP_KATEGORI_LABEL } from "@/lib/constants";
import { BookOpen, ChevronRight, Trophy, Bell } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  // Progress user
  const myProgress = await prisma.learningProgress.findMany({
    where: { userId: session!.user.id },
    include: { sopDocument: { select: { id: true, kode: true, judul: true, kategori: true } } },
    orderBy: { lastAccessedAt: "desc" },
    take: 3,
  });

  // Top 5 store rankings
  const topStores = await prisma.storeRanking.findMany({
    take: 5,
    orderBy: { persenKepatuhan: "desc" },
    include: { store: { select: { nama: true, kota: true } } },
  });

  // Unread notifications count
  const unreadCount = await prisma.notification.count({
    where: { userId: session!.user.id, isRead: false },
  });

  const sopMenus = [
    { href: "/sop/sr", label: "SOP Operation",              icon: "📦", desc: "Prosedur operasional ritel" },
    { href: "/sop/ss", label: "SOP Supporting Unit",        icon: "🏢", desc: "Prosedur unit pendukung" },
    { href: "/sop/sp", label: "SOP Publishing & Education", icon: "📚", desc: "Prosedur penerbitan & edukasi" },
    { href: "/sop/sg", label: "SOP General",                icon: "🗂",  desc: "Prosedur umum lintas divisi" },
    { href: "/sop/petunjuk", label: "Petunjuk Pelaksanaan", icon: "📋", desc: "Panduan pelaksanaan tugas" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Navbar */}
      <nav className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/home" className="flex items-center gap-2 font-display font-bold text-lg">
              <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">G</div>
              Gramedia
            </Link>
            <Link href="/home" className="text-sm font-medium">Home</Link>
            <Link href="/sop/petunjuk" className="text-sm text-muted-foreground hover:text-foreground">Petunjuk Pelaksanaan</Link>
            <Link href="/bantuan" className="text-sm text-muted-foreground hover:text-foreground">Bantuan</Link>
            <div className="relative group">
              <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                SOP <ChevronRight size={14} className="rotate-90" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profil" className="relative">
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[10px] rounded-full flex items-center justify-center">{unreadCount}</span>
              )}
              <Bell size={20} className="text-muted-foreground" />
            </Link>
            <Link href="/profil" className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
              {session?.user.name?.charAt(0).toUpperCase()}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Hero */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-foreground text-background rounded-2xl p-8">
            <p className="text-background/60 text-sm mb-2">Selamat datang 👋</p>
            <h1 className="font-display font-bold text-3xl leading-tight mb-3">
              Temukan SOP Gramedia<br/>dengan lebih cepat<br/>dan terstruktur.
            </h1>
            <p className="text-background/60 text-sm leading-relaxed">
              Pilih kategori SOP, pelajari dokumen, upload bukti, dan selesaikan post-test untuk menandai bahwa Anda telah memahami SOP.
            </p>
          </div>

          {/* Ranking Store */}
          <div className="bg-background rounded-2xl border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-amber-500" />
              <span className="font-display font-semibold text-sm">Ranking Store</span>
            </div>
            <div className="space-y-2.5">
              {topStores.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{s.store.nama}</div>
                    <div className="text-[11px] text-muted-foreground">{s.store.kota}</div>
                  </div>
                  <span className="text-xs font-semibold text-green-600">{Number(s.persenKepatuhan).toFixed(0)}%</span>
                </div>
              ))}
              {topStores.length === 0 && <p className="text-xs text-muted-foreground">Belum ada data</p>}
            </div>
          </div>
        </div>

        {/* SOP Menu */}
        <div>
          <h2 className="font-display font-semibold text-xl mb-4">Kategori SOP</h2>
          <div className="grid grid-cols-5 gap-3">
            {sopMenus.map(m => (
              <Link key={m.href} href={m.href}
                className="bg-background rounded-xl border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <div className="text-2xl mb-2">{m.icon}</div>
                <div className="font-semibold text-sm group-hover:text-primary transition-colors">{m.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* My Progress */}
        {myProgress.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-xl">Progress Belajar Saya</h2>
              <Link href="/profil" className="text-sm text-muted-foreground hover:text-foreground">Lihat semua →</Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {myProgress.map(p => (
                <Link key={p.id} href={`/belajar/${p.sopDocument.id}`}
                  className="bg-background rounded-xl border p-5 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={16} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-mono">{p.sopDocument.kode}</span>
                  </div>
                  <div className="font-semibold text-sm leading-snug mb-3">{p.sopDocument.judul}</div>
                  {/* Step progress bar */}
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= p.stepCurrent ? "bg-foreground" : "bg-muted"}`} />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Step {p.stepCurrent}/6 · {p.status === "selesai" ? "✓ Selesai" : p.status === "dipelajari" ? "Sedang dipelajari" : "Belum dimulai"}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
