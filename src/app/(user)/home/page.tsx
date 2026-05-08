// src/app/(user)/home/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRankingForHome } from "@/lib/ranking";
import HomeHero from "@/components/user/HomeHero";
import KategoriCard from "@/components/user/KategoriCard";
import ContinueLearning from "@/components/user/ContinueLearning";
import RankingPanel from "@/components/user/RankingPanel";
import RecentlyAdded from "@/components/user/RecentlyAdded";

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user.id;

  // Parallel fetch all data
  const [
    myProgress,
    ranking,
    totalSelesai,
    totalDipelajari,
    totalSop,
    recentSops,
    countsByKategori,
  ] = await Promise.all([
    prisma.learningProgress.findMany({
      where: { userId, status: "dipelajari" },
      include: {
        sopDocument: {
          select: {
            id: true,
            kode: true,
            judul: true,
            kategori: true,
          },
        },
      },
      orderBy: { lastAccessedAt: "desc" },
      take: 6,
    }),
    getRankingForHome(userId, 10),
    prisma.learningProgress.count({
      where: { userId, status: "selesai" },
    }),
    prisma.learningProgress.count({
      where: { userId, status: "dipelajari" },
    }),
    prisma.sopDocument.count({ where: { status: "aktif" } }),
    prisma.sopDocument.findMany({
      where: { status: "aktif" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { department: { select: { nama: true } } },
    }),
    prisma.sopDocument.groupBy({
      by: ["kategori"],
      where: { status: "aktif" },
      _count: true,
    }),
  ]);

  // Map count per kategori
  const countMap = Object.fromEntries(
    countsByKategori.map((c) => [c.kategori, c._count])
  );

  // Continue learning hint (most recent dipelajari)
  const continueLearning =
    myProgress.length > 0
      ? {
          sopId: myProgress[0].sopDocument.id,
          sopJudul: myProgress[0].sopDocument.judul,
          stepCurrent: myProgress[0].stepCurrent,
        }
      : null;

  const sopMenus = [
    {
      href: "/sop/sr",
      label: "SOP Operation",
      icon: "/icon/sop-operation.png",
      desc: "Prosedur operasional ritel & toko",
      bgClass: "bg-cat-sr",
      iconAccent: "text-green-700",
      kategori: "sr",
    },
    {
      href: "/sop/ss",
      label: "Supporting Unit",
      icon: "/icon/sop-supporting-unit.png",
      desc: "Prosedur unit pendukung HO",
      bgClass: "bg-cat-ss",
      iconAccent: "text-blue-700",
      kategori: "ss",
    },
    {
      href: "/sop/sp",
      label: "Publishing & Education",
      icon: "/icon/sop-publishing-education.png",
      desc: "Prosedur penerbitan & edukasi",
      bgClass: "bg-cat-sp",
      iconAccent: "text-purple-700",
      kategori: "sp",
    },
    {
      href: "/sop/sg",
      label: "SOP General",
      icon: "/icon/sop-general.png",
      desc: "Prosedur umum lintas divisi",
      bgClass: "bg-cat-sg",
      iconAccent: "text-amber-700",
      kategori: "sg",
    },
    {
      href: "/sop/petunjuk",
      label: "Petunjuk Pelaksanaan",
      icon: "/icon/petunjuk-pelaksanaan.png",
      desc: "Panduan pelaksanaan tugas",
      bgClass: "bg-cat-petunjuk",
      iconAccent: "text-gray-700",
      kategori: "petunjuk",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      {/* Hero with stats */}
      <div className="animate-fade-in">
        <HomeHero
          userName={session!.user.name ?? "User"}
          totalSelesai={totalSelesai}
          totalDipelajari={totalDipelajari}
          totalSop={totalSop}
          continueLearning={continueLearning}
        />
      </div>

      {/* Continue Learning + Ranking grid */}
      {myProgress.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div>
            <ContinueLearning items={myProgress} />
          </div>
          <div className="animate-slide-up">
            <RankingPanel
              top={ranking.top}
              me={ranking.me}
              isInTop={ranking.isInTop}
              currentUserId={userId}
              totalRanked={ranking.totalRanked}
            />
          </div>
        </div>
      ) : (
        // Kalau belum ada progress, ranking standalone
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          <div className="lg:col-span-2 bg-gradient-to-br from-primary/5 via-purple-100/50 to-pink-100/50 rounded-2xl border p-8 flex items-center">
            <div>
              <h2 className="font-display font-bold text-2xl mb-2">
                Belum Mulai Belajar?
              </h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Pilih kategori SOP di bawah untuk mulai pembelajaran. Setelah
                Anda complete satu SOP, status progress akan tampil di sini.
              </p>
            </div>
          </div>
          <RankingPanel
            top={ranking.top}
            me={ranking.me}
            isInTop={ranking.isInTop}
            currentUserId={userId}
            totalRanked={ranking.totalRanked}
          />
        </div>
      )}

      {/* Kategori SOP — colorful cards */}
      <section className="animate-slide-up">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-2xl mb-1">
              Kategori SOP
            </h2>
            <p className="text-sm text-muted-foreground">
              Pilih kategori untuk mulai belajar
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {sopMenus.map((m) => (
            <KategoriCard
              key={m.href}
              href={m.href}
              label={m.label}
              description={m.desc}
              icon={m.icon}
              count={countMap[m.kategori] ?? 0}
              bgClass={m.bgClass}
              iconAccent={m.iconAccent}
            />
          ))}
        </div>
      </section>

      {/* Recently Added */}
      <RecentlyAdded items={recentSops} />
    </div>
  );
}
