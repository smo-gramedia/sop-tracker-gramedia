// src/app/(admin)/user-progress/page.tsx
import { prisma } from "@/lib/prisma";
import UserProgressClient from "@/components/admin/UserProgressClient";

export default async function UserProgressPage() {
  const [progress, stats] = await Promise.all([
    prisma.learningProgress.findMany({
      orderBy: { lastAccessedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            kodeUser: true,
            tipeUser: true,
            unit: true,
          },
        },
        sopDocument: {
          select: { id: true, kode: true, judul: true, kategori: true },
        },
      },
    }),
    prisma.learningProgress.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  // Process stats
  const statsMap = Object.fromEntries(
    stats.map((s) => [s.status, s._count])
  );
  const totalCount = stats.reduce((sum, s) => sum + s._count, 0);
  const selesaiCount = statsMap.selesai ?? 0;
  const dipelajariCount = statsMap.dipelajari ?? 0;
  const belumCount = statsMap.belum ?? 0;

  return (
    <UserProgressClient
      progressList={progress as any}
      totalCount={totalCount}
      selesaiCount={selesaiCount}
      dipelajariCount={dipelajariCount}
      belumCount={belumCount}
    />
  );
}
