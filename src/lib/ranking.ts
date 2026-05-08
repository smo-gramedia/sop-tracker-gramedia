// src/lib/ranking.ts
// ═══════════════════════════════════════════════════════════════════
// Individual User Ranking
// ───────────────────────────────────────────────────────────────────
// Ranking berdasarkan jumlah SOP yang selesai (status="selesai" + step=6)
// Tie-breaker: user yang complete-nya paling awal (first_completed ASC)
// Hanya user dengan role="user" dan status="aktif" yang masuk ranking.
// ═══════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";

export type RankingEntry = {
  rank: number;
  userId: string;
  nama: string;
  unit: string | null;
  jabatan: string | null;
  selesaiCount: number;
};

/**
 * Get ranked list of all aktif users by SOP completion count.
 * Returns full ranking (not paginated). Use this output to slice top N
 * and find current user's position.
 */
export async function getFullRanking(): Promise<RankingEntry[]> {
  // Aggregate: jumlah SOP selesai per user
  // (status="selesai" AND step_current=6 → benar-benar selesai 100%)
  const grouped = await prisma.learningProgress.groupBy({
    by: ["userId"],
    where: {
      status: "selesai",
      stepCurrent: 6,
      user: {
        role: "user",
        status: "aktif",
      },
    },
    _count: { _all: true },
    _min: { completedAt: true },
  });

  // Tidak ada hasil
  if (grouped.length === 0) return [];

  // Get user metadata
  const userIds = grouped.map((g) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, nama: true, unit: true, jabatan: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  // Sort: completion count DESC, then earliest completion date ASC
  const sorted = [...grouped].sort((a, b) => {
    if (b._count._all !== a._count._all) {
      return b._count._all - a._count._all;
    }
    // Tie-breaker
    const aDate = a._min.completedAt?.getTime() ?? Infinity;
    const bDate = b._min.completedAt?.getTime() ?? Infinity;
    return aDate - bDate;
  });

  // Build ranking entries
  return sorted
    .map((g, idx) => {
      const u = userMap[g.userId];
      if (!u) return null;
      return {
        rank: idx + 1,
        userId: g.userId,
        nama: u.nama,
        unit: u.unit,
        jabatan: u.jabatan,
        selesaiCount: g._count._all,
      };
    })
    .filter((x): x is RankingEntry => x !== null);
}

/**
 * Get top N + current user's position (kalau bukan top N).
 */
export async function getRankingForHome(currentUserId: string, topN = 10) {
  const fullRanking = await getFullRanking();
  const top = fullRanking.slice(0, topN);
  const me = fullRanking.find((r) => r.userId === currentUserId) ?? null;
  const isInTop = me ? top.some((t) => t.userId === currentUserId) : false;

  return { top, me, isInTop, totalRanked: fullRanking.length };
}
