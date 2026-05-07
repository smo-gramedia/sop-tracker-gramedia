// src/lib/learning-gates.ts

/**
 * Centralized gating rules untuk halaman pelajari.
 *
 * Rules:
 * - Step 0-3: Selalu accessible (free flow)
 * - Step 4: Selalu accessible (untuk upload bukti)
 * - Step 5 (Post Test): Hanya accessible kalau attachment "disetujui"
 * - Step 6 (Penutup): Hanya accessible kalau punya minimal 1 result post test "lulus"
 */

export type LearningGateContext = {
  attachmentStatus: "menunggu" | "disetujui" | "ditolak" | "pending" | null;
  hasPassedPostTest: boolean;
};

export type StepLockInfo = {
  locked: boolean;
  reason: string | null;
};

/**
 * Apakah step tertentu accessible untuk user?
 */
export function getStepLockInfo(
  step: number,
  ctx: LearningGateContext
): StepLockInfo {
  // Step 0-4: selalu unlocked
  if (step <= 4) return { locked: false, reason: null };

  // Step 5 (Post Test): butuh attachment disetujui
  if (step === 5) {
    if (ctx.attachmentStatus === "disetujui") {
      return { locked: false, reason: null };
    }
    if (!ctx.attachmentStatus) {
      return {
        locked: true,
        reason: "Upload bukti sosialisasi terlebih dahulu di Step 4.",
      };
    }
    if (ctx.attachmentStatus === "menunggu") {
      return {
        locked: true,
        reason: "Bukti sosialisasi sedang menunggu verifikasi admin.",
      };
    }
    if (ctx.attachmentStatus === "ditolak") {
      return {
        locked: true,
        reason: "Bukti sosialisasi ditolak. Silakan upload ulang di Step 4.",
      };
    }
    return {
      locked: true,
      reason: "Bukti sosialisasi belum disetujui admin.",
    };
  }

  // Step 6 (Penutup): butuh attachment disetujui DAN post test lulus
  if (step === 6) {
    if (ctx.attachmentStatus !== "disetujui") {
      return {
        locked: true,
        reason: "Selesaikan upload bukti sosialisasi terlebih dahulu.",
      };
    }
    if (!ctx.hasPassedPostTest) {
      return {
        locked: true,
        reason: "Anda harus lulus Post Test untuk membuka halaman Penutup.",
      };
    }
    return { locked: false, reason: null };
  }

  return { locked: false, reason: null };
}

/**
 * Hitung persentase progress.
 * Hanya hitung step yang sudah accessible & dilewati (legitimate progress).
 *
 * Step terkunci → kontribusi 0%
 */
export function calculateProgress(
  highestStep: number,
  ctx: LearningGateContext
): number {
  const TOTAL_STEPS = 7; // step 0..6
  let completedCount = 0;

  for (let i = 0; i < TOTAL_STEPS; i++) {
    if (i > highestStep) break; // belum dicapai
    const lock = getStepLockInfo(i, ctx);
    if (!lock.locked) {
      completedCount++;
    }
  }

  // Persentase berdasarkan step tertinggi yang accessible & dilewati
  // 0/6 = 0%, 6/6 = 100% (step 6 selesai)
  return Math.round((completedCount / TOTAL_STEPS) * 100);
}
