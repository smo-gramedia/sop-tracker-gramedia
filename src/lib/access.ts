// src/lib/access.ts
// ═══════════════════════════════════════════════════════════════════
// SUMBER TUNGGAL aturan akses kategori SOP per tipe akun.
// ───────────────────────────────────────────────────────────────────
// Dipakai bersama oleh: menu navbar, halaman kategori, halaman belajar,
// pencarian, dan API view/download. Kalau aturannya berubah, cukup ubah
// di berkas ini — tidak perlu menyisir berkas lain.
//
// Aturan:
//   Store       → SOP Operation            + General + Petunjuk Pelaksanaan
//   Supporting  → SOP Supporting Unit      + General + Petunjuk Pelaksanaan
//   Publishing  → SOP Publishing & Edu.    + General + Petunjuk Pelaksanaan
//   Audit       → SELURUH kategori, dan bebas view/download tanpa harus
//                 menyelesaikan pembelajaran terlebih dahulu
//   Admin/Superadmin → seluruh kategori (lewat pengecekan role)
// ═══════════════════════════════════════════════════════════════════

export type KategoriKey = "sr" | "ss" | "sp" | "sg" | "petunjuk";

/** Kategori yang boleh diakses semua tipe akun. */
export const KATEGORI_UMUM: KategoriKey[] = ["sg", "petunjuk"];

export const SEMUA_KATEGORI: KategoriKey[] = [
  "sr",
  "ss",
  "sp",
  "sg",
  "petunjuk",
];

/** Peta tipe akun → kategori yang boleh diakses. */
export const KATEGORI_BY_TIPE: Record<string, KategoriKey[]> = {
  store: ["sr", ...KATEGORI_UMUM],
  supporting: ["ss", ...KATEGORI_UMUM],
  publishing: ["sp", ...KATEGORI_UMUM],
  audit: SEMUA_KATEGORI,
  // "department" = tipe lama yang belum dipetakan → belum punya akses.
  // Sengaja kosong agar admin sadar dan segera menentukan tipenya.
  department: [],
};

export const TIPE_USER_LABEL: Record<string, string> = {
  store: "Store",
  supporting: "Supporting",
  publishing: "Publishing",
  audit: "Audit",
  department: "Department (perlu ditentukan)",
  admin: "Admin",
};

/** Tipe akun yang ikut dihitung dalam leaderboard (Audit dikecualikan). */
export const TIPE_LEADERBOARD = ["store", "supporting", "publishing"] as const;
export type TipeLeaderboard = (typeof TIPE_LEADERBOARD)[number];

type Aktor = { role?: string | null; tipeUser?: string | null };

const isAdminRole = (role?: string | null) =>
  role === "admin" || role === "superadmin";

/** Akun Audit — bebas akses tanpa harus menyelesaikan pembelajaran. */
export function isAudit(user: Aktor): boolean {
  return user.tipeUser === "audit";
}

/**
 * Akun yang tipenya belum ditentukan (null atau masih "department").
 * Ditampilkan pesan khusus, bukan halaman kosong tanpa penjelasan.
 */
export function isTipeBelumDitentukan(user: Aktor): boolean {
  if (isAdminRole(user.role)) return false;
  return !user.tipeUser || user.tipeUser === "department";
}

/** Daftar kategori yang boleh diakses aktor ini. */
export function allowedKategori(user: Aktor): KategoriKey[] {
  if (isAdminRole(user.role)) return SEMUA_KATEGORI;
  return KATEGORI_BY_TIPE[user.tipeUser ?? ""] ?? [];
}

/** Apakah aktor boleh membuka kategori tertentu? */
export function canAccessKategori(
  user: Aktor,
  kategori: string | null | undefined
): boolean {
  if (!kategori) return false;
  return allowedKategori(user).includes(kategori as KategoriKey);
}

/**
 * Apakah aktor boleh view/download TANPA menyelesaikan pembelajaran?
 * Berlaku untuk admin/superadmin dan akun Audit.
 */
export function canBypassLearningGate(user: Aktor): boolean {
  return isAdminRole(user.role) || isAudit(user);
}

/** Pesan baku saat akun belum bertipe. */
export const PESAN_TIPE_BELUM_DITENTUKAN =
  "Tipe akun Anda belum ditentukan sehingga daftar SOP belum dapat ditampilkan. Silakan hubungi admin untuk pengaturan akun.";

/** Pesan baku saat kategori tidak diizinkan untuk tipe akun ini. */
export const PESAN_TIDAK_BERHAK =
  "Halaman ini tidak tersedia untuk tipe akun Anda. Silakan buka kategori SOP yang menjadi tanggung jawab unit Anda.";
