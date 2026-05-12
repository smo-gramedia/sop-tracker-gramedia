import type {
  Role,
  SopKategori,
  SopTipe,
  SopStatus,
  LearningStatus,
  AttachmentStatus,
  TipeUser,
} from "@prisma/client";

// ── Auth ──────────────────────────────────────
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

// ── SOP ──────────────────────────────────────
export type SopWithRelations = {
  id: string;
  kode: string;
  judul: string;
  deskripsi: string | null;
  kategori: SopKategori;
  tipe: SopTipe;
  versi: string;
  status: SopStatus;
  tanggalBerlaku: Date | null;
  department: { id: string; nama: string; kode: string } | null;
  subcategory: { id: string; nama: string; kode: string } | null;
  uploadedBy: { id: string; nama: string };
};

// ── Learning ──────────────────────────────────
export type LearningProgressWithSop = {
  id: string;
  stepCurrent: number;
  status: LearningStatus;
  lastAccessedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  sopDocument: SopWithRelations;
};

// ── Attachment ────────────────────────────────
export type AttachmentWithRelations = {
  id: string;
  filename: string;
  mimeType: string;
  ukuranKb: number;
  uploadKe: number;
  status: AttachmentStatus;
  alasanTolak: string | null;
  uploadedAt: Date;
  reviewedAt: Date | null;
  user: {
    id: string;
    nama: string;
    kodeUser: string;
    tipeUser: TipeUser | null;
    unit: string | null;
  };
  sopDocument: { id: string; kode: string; judul: string };
  reviewedBy: { id: string; nama: string } | null;
};

// ── Dashboard ─────────────────────────────────
export type DashboardStats = {
  totalDokumen: number;
  totalUser: number;
  totalSelesai: number;
  menungguVerifikasi: number;
};

// ── Pagination ────────────────────────────────
export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
