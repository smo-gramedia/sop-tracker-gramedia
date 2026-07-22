// src/lib/ranking.ts
// ═══════════════════════════════════════════════════════════════════
// Unit Kerja Ranking (Top Learners)
// ───────────────────────────────────────────────────────────────────
// Ranking berdasarkan jumlah SOP yang selesai oleh unit kerja
// (status="selesai" + step=6).
// Tie-breaker: unit yang complete-nya paling awal (first_completed ASC)
// Hanya user dengan role="user" dan status="aktif" yang masuk ranking.
// User dengan role admin/superadmin TIDAK masuk ranking.
// ═══════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { TIPE_LEADERBOARD, type TipeLeaderboard } from "@/lib/access";
import type { TipeUser } from "@prisma/client";

export type RankingEntry = {
  rank: number;
  userId: string;
  nama: string;
  kodeUser: string;
  tipeUser: TipeUser | null;
  unit: string | null;
  selesaiCount: number;
};

/**
 * Get ranked list of all aktif unit kerja by SOP completion count.
 * Returns full ranking (not paginated).
 */
export async function getFullRanking(
  tipe?: TipeLeaderboard
): Promise<RankingEntry[]> {
  // Aggregate: jumlah SOP selesai per user.
  // Leaderboard dipisah per tipe akun karena jumlah SOP wajib tiap tipe
  // berbeda — membandingkan lintas tipe tidak adil.
  // Akun Audit selalu dikecualikan (bukan peserta pembelajaran reguler).
  const grouped = await prisma.learningProgress.groupBy({
    by: ["userId"],
    where: {
      status: "selesai",
      stepCurrent: 6,
      user: {
        role: "user",
        status: "aktif",
        tipeUser: tipe ? tipe : { in: [...TIPE_LEADERBOARD] },
      },
    },
    _count: { _all: true },
    _min: { completedAt: true },
  });

  if (grouped.length === 0) return [];

  // Get user metadata
  const userIds = grouped.map((g) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      nama: true,
      kodeUser: true,
      tipeUser: true,
      unit: true,
    },
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
        kodeUser: u.kodeUser,
        tipeUser: u.tipeUser,
        unit: u.unit,
        selesaiCount: g._count._all,
      };
    })
    .filter((x): x is RankingEntry => x !== null);
}

/**
 * Get top N + current user's position (kalau bukan top N).
 */
export async function getRankingForHome(
  currentUserId: string,
  topN = 10,
  tipe?: TipeLeaderboard
) {
  const fullRanking = await getFullRanking(tipe);
  const top = fullRanking.slice(0, topN);
  const me = fullRanking.find((r) => r.userId === currentUserId) ?? null;
  const isInTop = me ? top.some((t) => t.userId === currentUserId) : false;

  return { top, me, isInTop, totalRanked: fullRanking.length };
}

/**
 * Ambil leaderboard untuk SELURUH tipe akun dalam SEKALI pengambilan data,
 * lalu dipisah per tipe di memori.
 *
 * Kenapa begini? Memanggil getRankingForHome() tiga kali berarti 6 query
 * sekaligus. Dengan `connection_limit=1` (setelan untuk serverless), query
 * tersebut antre dan bisa melampaui batas waktu koneksi. Satu pengambilan
 * data jauh lebih hemat dan aman.
 */
export async function getRankingsByTipe(currentUserId: string, topN = 10) {
  const semua = await getFullRanking(); // sudah mengecualikan akun Audit

  const hasil: Record<
    string,
    {
      top: RankingEntry[];
      me: RankingEntry | null;
      isInTop: boolean;
      totalRanked: number;
    }
  > = {};

  for (const tipe of TIPE_LEADERBOARD) {
    // Peringkat dihitung ulang di dalam tipe-nya masing-masing
    const daftar = semua
      .filter((r) => r.tipeUser === tipe)
      .map((r, idx) => ({ ...r, rank: idx + 1 }));

    const top = daftar.slice(0, topN);
    const me = daftar.find((r) => r.userId === currentUserId) ?? null;
    hasil[tipe] = {
      top,
      me,
      isInTop: me ? top.some((t) => t.userId === currentUserId) : false,
      totalRanked: daftar.length,
    };
  }

  return hasil;
}
