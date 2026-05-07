// src/app/(user)/home/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Trophy } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  // Progress user
  const myProgress = await prisma.learningProgress.findMany({
    where: { userId: session!.user.id },
    include: {
      sopDocument: {
        select: { id: true, kode: true, judul: true, kategori: true },
      },
    },
    orderBy: { lastAccessedAt: "desc" },
    take: 3,
  });

  // Top 5 store rankings
  const topStores = await prisma.storeRanking.findMany({
    take: 5,
    orderBy: { persenKepatuhan: "desc" },
    include: { store: { select: { nama: true, kota: true } } },
  });

  const sopMenus = [
    {
      href: "/sop/sr",
      label: "SOP Operation",
      icon: "/icon/sop-operation.png",
      desc: "Prosedur operasional ritel",
    },
    {
      href: "/sop/ss",
      label: "SOP Supporting Unit",
      icon: "/icon/sop-supporting-unit.png",
      desc: "Prosedur unit pendukung",
    },
    {
      href: "/sop/sp",
      label: "SOP Publishing & Education",
      icon: "/icon/sop-publishing-education.png",
      desc: "Prosedur penerbitan & edukasi",
    },
    {
      href: "/sop/sg",
      label: "SOP General",
      icon: "/icon/sop-general.png",
      desc: "Prosedur umum lintas divisi",
    },
    {
      href: "/sop/petunjuk",
      label: "Petunjuk Pelaksanaan",
      icon: "/icon/petunjuk-pelaksanaan.png",
      desc: "Panduan pelaksanaan tugas",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      {/* Hero — biru Gramedia */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-brand rounded-2xl p-8 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 80% 20%, hsl(217 91% 60% / 0.5) 0%, transparent 50%)",
            }}
          />
          <div className="relative">
            <h1 className="font-display font-bold text-3xl leading-tight mb-3 text-white">
              Temukan SOP Gramedia
              <br />
              dengan lebih cepat
              <br />
              dan terstruktur.
            </h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Pilih kategori SOP, pelajari dokumen, upload bukti, dan
              selesaikan post-test untuk menandai bahwa Anda telah memahami
              SOP.
            </p>
          </div>
        </div>

        {/* Ranking Store */}
        <div className="bg-background rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-500" />
            <span className="font-display font-semibold text-sm">
              Ranking Store
            </span>
          </div>
          <div className="space-y-2.5">
            {topStores.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {s.store.nama}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {s.store.kota}
                  </div>
                </div>
                <span className="text-xs font-semibold text-green-600">
                  {Number(s.persenKepatuhan).toFixed(0)}%
                </span>
              </div>
            ))}
            {topStores.length === 0 && (
              <p className="text-xs text-muted-foreground">Belum ada data</p>
            )}
          </div>
        </div>
      </div>

      {/* SOP Menu */}
      <div>
        <h2 className="font-display font-semibold text-xl mb-4">
          Kategori SOP
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {sopMenus.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="bg-background rounded-xl border p-4 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40 transition-all group"
            >
              <div className="w-10 h-10 mb-3 relative">
                <Image
                  src={m.icon}
                  alt={m.label}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                {m.label}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* My Progress */}
      {myProgress.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-xl">
              Progress Belajar Saya
            </h2>
            <Link
              href="/profil"
              className="text-sm text-primary hover:underline font-medium"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {myProgress.map((p) => (
              <Link
                key={p.id}
                href={`/belajar/${p.sopDocument.id}`}
                className="bg-background rounded-xl border p-5 hover:shadow-md hover:border-primary/40 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-mono">
                    {p.sopDocument.kode}
                  </span>
                </div>
                <div className="font-semibold text-sm leading-snug mb-3">
                  {p.sopDocument.judul}
                </div>
                {/* Step progress bar */}
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i <= p.stepCurrent ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Step {p.stepCurrent}/6 ·{" "}
                  {p.status === "selesai"
                    ? "✓ Selesai"
                    : p.status === "dipelajari"
                    ? "Sedang dipelajari"
                    : "Belum dimulai"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
