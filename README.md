# Gramedia SOP Tracker

Sistem manajemen pembelajaran SOP (Standard Operating Procedure) internal untuk PT Gramedia Asri Media, bagian dari Kompas Gramedia Group. Platform ini memungkinkan unit kerja (toko dan departemen) untuk mempelajari, memahami, dan diuji atas SOP yang berlaku secara terstruktur dan terdokumentasi.

> **Dikembangkan oleh:** Strategic Management Office (SMO) — PT Gramedia Asri Media
> **Status:** Production-ready (MVP)

---

## Daftar Isi

- [Tentang Project](#-tentang-project)
- [Fitur Utama](#-fitur-utama)
- [Konsep Arsitektur](#-konsep-arsitektur)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Struktur Project](#-struktur-project)
- [Akun Default](#-akun-default)
- [Database & Migration](#-database--migration)
- [Alur Pembelajaran](#-alur-pembelajaran-7-step)
- [Format Kode User](#-format-kode-user)
- [Excel Export](#-excel-export)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)

---

## Tentang Project

**Gramedia SOP Tracker** adalah platform internal yang menggantikan pembelajaran SOP manual (via WhatsApp, Email, atau dokumen offline) dengan sistem terdigitalisasi yang:

- **Terstruktur**: Setiap SOP dipelajari dalam 7 step terurut dengan gating logic.
- **Terukur**: Setiap unit kerja menyelesaikan post-test untuk verifikasi pemahaman.
- **Termonitor**: SMO bisa pantau progress, hasil pengerjaan, dan compliance lewat dashboard admin.
- **Termotivasi**: Sistem ranking "Top Learners" antar unit kerja untuk mendorong kompetisi sehat.

---

## Fitur Utama

### Untuk Unit Kerja (Store / Department)
- **Home dashboard** — stats progress + ranking + continue learning
- **Halaman Pelajari (7 step)** — alur terstruktur dari pengenalan hingga post test
- **5 Kategori SOP**:
  - SOP Operation (SR) — operasional ritel
  - Supporting Unit (SS) — unit pendukung HO
  - Publishing & Education (SP) — penerbitan
  - SOP General (SG) — prosedur umum
  - Petunjuk Pelaksanaan (Juklak)
- **Upload Bukti Sosialisasi** — bukti foto/dokumen, di-review admin
- **Post Test** — kuis pilihan ganda dengan passing grade
- **Ranking** — leaderboard unit kerja berdasarkan SOP yang diselesaikan
- **Notifikasi** — alert saat bukti disetujui/ditolak, post test result
- **Profile Settings** — kelola informasi unit kerja & ubah password

### Untuk Admin SMO
- **Dashboard** — overview seluruh sistem
- **User Manajemen** — kelola unit kerja (auto-generate kode)
- **Upload Dokumen** — CRUD SOP dengan lampiran
- **Raw Dokumen** — file Word source SOP
- **User Progress** — monitor pembelajaran lintas unit kerja
- **Attachment Review** — approve/reject bukti sosialisasi + **Export Excel**
- **Post Test Management** — kelola soal & monitor hasil pengerjaan + **Export Excel multi-sheet**
- **FAQ & Glosarium** — konten edukasi
- **Struktur Organisasi** — manage Directorate/Division/Department

---

##  Konsep Arsitektur

### User = Unit Kerja (Bukan Individu)

Konsep fundamental: **1 akun = 1 unit kerja**, bukan 1 karyawan. Beberapa karyawan dalam satu toko/departemen menggunakan **akun yang sama**.

**Alasan desain:**
- Compliance tracking di level unit (audit SMO fokus per unit, bukan per individu)
- Skalabilitas (5 store + 7 dept = 12 akun, bukan ratusan akun karyawan)
- Sederhana untuk maintenance

**Tipe User:**
| Tipe | Format Kode | Contoh | Tipe Login |
|---|---|---|---|
| Store | `STR-XXXXX-NNN` | `STR-00123-001` | 1 akun dipakai bareng |
| Department | `DEPT-AAAA-NNN` | `DEPT-SMO-001` | 1 akun dipakai bareng |
| Admin | `ADMIN-NNN` / `SUPERADMIN-NNN` | `ADMIN-001` | Individual |

### Gating Logic 7 Step

Pembelajaran sequential — step berikutnya terkunci sampai step sebelumnya selesai:

```
Step 0: Petunjuk Pembelajaran  →  Step 1: Akses Dokumen SOP
Step 1: Akses Dokumen SOP      →  Step 2: Baca Dokumen SOP
Step 2: Baca Dokumen SOP       →  Step 3: Lampiran SOP
Step 3: Lampiran SOP           →  Step 4: Upload Bukti Sosialisasi
Step 4: Upload Bukti           →  (TUNGGU APPROVE ADMIN) → Step 5: Post Test
Step 5: Post Test              →  Step 6: Penutup
```

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Bahasa** | TypeScript |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma 6 |
| **Authentication** | NextAuth.js v5 |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Icons** | Lucide React |
| **File Storage** | Supabase Storage |
| **Excel Generation** | ExcelJS |
| **Validation** | Zod |
| **Password Hashing** | bcryptjs |
| **Package Manager** | npm |
| **Deployment Target** | Vercel |

---

## Quick Start

### Prerequisites

- Node.js v20+
- npm v10+
- Supabase account (database PostgreSQL + storage)
- File `.env` dengan konfigurasi yang benar

### Installation

```bash
# 1. Clone atau pindah ke directory project
cd /Users/fahmijamaludin/Documents/Kompas\ Gramedia/Program/Code/gramedia-sop-tracker

# 2. Install dependencies
npm install

# 3. Generate Prisma Client dari schema
npx prisma generate

# 4. Push schema ke database (kalau belum ada)
npx prisma db push

# 5. Seed database dengan data dummy
npx prisma db seed

# 6. Run development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Environment Variables

Buat file `.env` di root project (BUKAN `.env.local`):

```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# NextAuth
NEXTAUTH_SECRET="generate-random-string-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## Struktur Project

```
gramedia-sop-tracker/
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   ├── seed.ts                    # Database seeder
│   └── seed-dummy-sops.ts         # Additional SOP seeder
│
├── src/
│   ├── app/
│   │   ├── (admin)/               # Admin pages (protected)
│   │   │   ├── dashboard/
│   │   │   ├── user-manajemen/
│   │   │   ├── upload-dokumen/
│   │   │   ├── raw-dokumen/
│   │   │   ├── user-progress/
│   │   │   ├── attachment/
│   │   │   ├── post-test/
│   │   │   │   └── [id]/          # Detail per post test
│   │   │   ├── faq/
│   │   │   ├── glosarium/
│   │   │   ├── kategori/
│   │   │   └── struktur-organisasi/
│   │   │
│   │   ├── (user)/                # User pages (protected)
│   │   │   ├── home/
│   │   │   ├── sop/[kategori]/    # SOP listing per kategori
│   │   │   ├── juklak/            # Petunjuk Pelaksanaan
│   │   │   ├── belajar/[id]/      # Halaman Pelajari 7-step
│   │   │   ├── profil/
│   │   │   │   └── settings/
│   │   │   ├── notifikasi/
│   │   │   └── bantuan/
│   │   │
│   │   ├── api/                   # API routes
│   │   │   ├── users/route.ts     # User CRUD + auto-generate kode
│   │   │   ├── attachment/export/ # Excel export attachment
│   │   │   ├── post-test/[id]/export/ # Excel export post test
│   │   │   ├── files/             # File serving (PDF, raw docs)
│   │   │   └── sop/[id]/download  # SOP ZIP download
│   │   │
│   │   ├── login/                 # Login page
│   │   ├── layout.tsx             # Root layout
│   │   └── globals.css            # Global styles + color tokens
│   │
│   ├── components/
│   │   ├── admin/                 # Admin-only components
│   │   ├── user/                  # User-side components
│   │   └── ui/                    # shadcn/ui components
│   │
│   ├── lib/
│   │   ├── auth.ts                # NextAuth config
│   │   ├── prisma.ts              # Prisma client
│   │   ├── ranking.ts             # Ranking logic
│   │   ├── learning-gates.ts      # Step gating logic
│   │   ├── constants.ts           # SOP kategori labels, etc
│   │   └── utils.ts               # Utility functions
│   │
│   ├── actions/                   # Server actions
│   │   ├── sop-document.ts
│   │   ├── attachment.ts
│   │   ├── profile-actions.ts
│   │   └── ...
│   │
│   └── types/
│       ├── index.ts               # Shared types
│       └── next-auth.d.ts         # NextAuth type extension
│
├── public/                        # Static assets
│   └── icon/                      # SOP category icons
│
├── .env                           # Environment variables (DO NOT COMMIT)
├── package.json
└── README.md                      # This file
```

---

## Akun Default

Setelah `npx prisma db seed`, akan ter-generate **14 akun** dengan password sama: `Admin@123!`

### Admin (2)
| Email | Kode User | Role |
|---|---|---|
| `superadmin@gramedia.co.id` | `SUPERADMIN-001` | Super Admin |
| `admin@gramedia.co.id` | `ADMIN-001` | Admin |

### Store (5)
| Email | Kode User | Nama |
|---|---|---|
| `str.matraman@gramedia.co.id` | `STR-00001-001` | Gramedia Matraman |
| `str.kelapagading@gramedia.co.id` | `STR-00012-001` | Gramedia Kelapa Gading |
| `str.cibubur@gramedia.co.id` | `STR-00023-001` | Gramedia Cibubur Junction |
| `str.plazasenayan@gramedia.co.id` | `STR-00045-001` | Gramedia Plaza Senayan |
| `str.bandungtransstudio@gramedia.co.id` | `STR-00078-001` | Gramedia Bandung Trans Studio |

### Department (7)
| Email | Kode User | Nama |
|---|---|---|
| `dept.smo@gramedia.co.id` | `DEPT-SMO-001` | Strategic Management Office |
| `dept.finance@gramedia.co.id` | `DEPT-FIN-001` | Finance Department |
| `dept.hr@gramedia.co.id` | `DEPT-HR-001` | Human Resources Department |
| `dept.it@gramedia.co.id` | `DEPT-IT-001` | Information Technology |
| `dept.accounting@gramedia.co.id` | `DEPT-ACC-001` | Accounting Department |
| `dept.editorial@gramedia.co.id` | `DEPT-EDIT-001` | Editorial Department |
| `dept.audit@gramedia.co.id` | `DEPT-AUDIT-001` | Internal Audit Department |

> ⚠️ **PENTING**: Ganti password default sebelum deploy ke production!

---

## 🗄 Database & Migration

### Schema Models Utama

```
User (Unit Kerja)
├─ kodeUser (unique, auto-generated)
├─ tipeUser (store | department | null untuk admin)
├─ nama (nama toko/dept/admin)
├─ email, passwordHash
├─ unit (deskripsi: "Store Operations", "Finance", dll)
├─ role (user | admin | superadmin)
└─ status (aktif | nonaktif)

SopDocument
├─ kode (e.g. "MP/STOR/01")
├─ kategori (sr | ss | sp | sg | petunjuk)
├─ judul, deskripsi, versi
├─ department (relation)
└─ relations: SopAttachment, LearningProgress, PostTest, dll

LearningProgress
├─ userId, sopDocumentId
├─ stepCurrent (0-6)
├─ status (belum | dipelajari | selesai)
└─ timestamps

PostTest + PostTestQuestion + PostTestResult
├─ passingGrade, durasiMenit, jumlahSoal
└─ multi-attempt per user

SosialisasiAttachment
├─ filename, uploadKe, status
└─ reviewedBy, alasanTolak

Notification
└─ tipe, judul, pesan, isRead

Directorate → Division → Department (struktur organisasi)
SopSubcategory (untuk SOP General)
ActivityLog
FaqEntry, GlossaryEntry
```

### Useful Commands

```bash
# Generate Prisma Client setelah edit schema
npx prisma generate

# Push schema changes ke database (development)
npx prisma db push

# Run seed
npx prisma db seed

# Open Prisma Studio (GUI database)
npx prisma studio

# Reset database (HATI-HATI: hapus semua data)
npx prisma migrate reset

# Cek koneksi database
npx prisma db pull
```

---

## Alur Pembelajaran 7 Step

Setiap SOP memiliki alur pembelajaran terstruktur dengan **gating logic**:

| Step | Nama | Aksi |
|---|---|---|
| **0** | Petunjuk Pembelajaran | Baca pengantar |
| **1** | Akses Dokumen SOP | Konfirmasi akses |
| **2** | Baca Dokumen SOP | View PDF utama |
| **3** | Lampiran SOP | View lampiran (kalau ada) |
| **4** | Upload Bukti Sosialisasi | Upload foto/dokumen → review admin |
| **5** | Post Test | Kerjakan kuis pilihan ganda |
| **6** | Penutup | Selesai, dapat reward UI |

### Aturan Gating

- Step **0-3**: Bisa diklik kapan saja oleh user
- Step **4**: Bisa diakses setelah step 3 dibaca
- Step **5**: **TERKUNCI** sampai admin approve bukti sosialisasi
- Step **6**: Hanya bisa diakses setelah post test lulus (atau retry sampai lulus)

User TIDAK bisa lompat step. Sistem track `stepCurrent` di tabel `LearningProgress`.

---

## Format Kode User

Sistem **auto-generate** kode user saat admin tambah user baru.

### Format Store

```
STR-XXXXX-NNN
│   │     │
│   │     └── 3 digit counter (001, 002, ...)
│   └─────── 5 digit kode toko (00001, 12345, ...)
└─────────── Prefix Store
```

**Contoh:**
- `STR-00001-001` → User pertama di Store 00001
- `STR-00001-002` → User kedua di Store 00001 (kalau dibutuhkan)
- `STR-12345-001` → User pertama di Store 12345

### Format Department

```
DEPT-AAAA-NNN
│    │    │
│    │    └── 3 digit counter
│    └─────── 2-5 huruf singkatan dept (SMO, FIN, AUDIT, ...)
└──────────── Prefix Department
```

**Contoh:**
- `DEPT-SMO-001` → Strategic Management Office
- `DEPT-FIN-001` → Finance
- `DEPT-AUDIT-001` → Internal Audit

### Validasi

- Store code: regex `^\d{5}$` (wajib 5 digit angka)
- Dept code: regex `^[A-Z]{2,5}$` (wajib 2-5 huruf uppercase)
- Counter: auto-increment per (prefix + subCode) combination
- Sistem cegah duplicate kode user

---

## Excel Export

### Attachment Export

Endpoint: `POST /api/attachment/export`

Trigger: Tombol "Export Excel" di halaman `/attachment`

**Output:**
- File: `attachment-sosialisasi-YYYY-MM-DD.xlsx`
- Single sheet dengan kolom: No, Kode User, Tipe, Nama Unit Kerja, Email, Unit, Kode SOP, Judul SOP, Kategori, Departemen, Status, Upload ke-, Tanggal Upload, Direview oleh, Tanggal Review, Alasan Tolak
- Color-coded status (amber/green/red)
- Auto-filter + frozen header
- **Respect filter aktif** — export hanya data yang ditampilkan

### Post Test Export

Endpoint: `POST /api/post-test/[id]/export`

Trigger: Tombol "Export Excel" di halaman detail Post Test (`/post-test/[id]`)

**Output:** Multi-sheet workbook
- **Sheet "Info SOP"** — header info & statistics
- **Sheet "Summary"** — per user dengan latest attempt + total attempts + skor terbaik
- **Sheet "Attempt 1", "Attempt 2", "Attempt N"...** — list user yang mengerjakan di attempt tersebut (dinamis sesuai max attempt)

Berguna untuk audit SMO: "Berapa rata-rata attempt sampai user lulus?"

---

## Troubleshooting

### Error: "Unknown field `kodeUser` for select statement"

**Penyebab:** Prisma Client belum di-regenerate setelah schema diubah.

**Fix:**
```bash
npx prisma generate

# Kalau masih error:
rm -rf node_modules/.prisma
rm -rf .next
npx prisma generate
npm run dev
```

### Error: "Table 'users' doesn't exist"

**Penyebab:** Database belum ter-migrate.

**Fix:**
```bash
npx prisma db push
npx prisma db seed
```

### Error: "Cannot find module '@prisma/client'"

**Fix:**
```bash
npm install
npx prisma generate
```

### Login berhasil tapi langsung logout

**Penyebab:** `NEXTAUTH_SECRET` belum di-set atau berbeda.

**Fix:** Pastikan `NEXTAUTH_SECRET` ada di `.env` dan **konsisten** (jangan diganti tanpa logout dulu).

### Excel export gagal generate

**Penyebab:** Library `exceljs` belum di-install.

**Fix:**
```bash
npm install exceljs
```

### Build error: "Module not found"

**Fix:**
```bash
rm -rf .next node_modules
npm install
npx prisma generate
npm run build
```

---

## Roadmap

### Selesai (v1.0 - MVP)

- [x] Auth (login/logout, role-based access)
- [x] CRUD SOP Documents + attachments
- [x] 7-step learning flow dengan gating
- [x] Upload bukti sosialisasi + review admin
- [x] Post test management + multi-attempt
- [x] Ranking "Top Learners" antar unit kerja
- [x] Konsep User = Unit Kerja (Store/Department)
- [x] Auto-generate kode user (STR/DEPT/ADMIN)
- [x] Excel export (Attachment + Post Test)
- [x] Coursera-style UI redesign (user-side)
- [x] Search + filter di semua admin pages
- [x] FAQ + Glosarium
- [x] Struktur Organisasi management

### Roadmap (v1.1+)

- [ ] **Email Notifikasi** (Resend) — auto-email saat approve/reject bukti & hasil post test
- [ ] **Deployment Vercel** — production deployment
- [ ] **Admin redesign** — polish admin pages dengan Coursera-style (kalau butuh)
- [ ] **Analytics dashboard** — chart pembelajaran per quarter, completion rate trends
- [ ] **Bulk import user** — upload CSV untuk tambah banyak unit kerja sekaligus
- [ ] **SOP versioning** — track revisi SOP & notify user untuk re-learning
- [ ] **Mobile app** — versi PWA atau native app untuk akses dari HP

---

## Kontak & Support

**Project Owner:**
- Fahmi Jamaludin
- Integration Officer 2 — Strategic Management Office (SMO)
- PT Gramedia Asri Media

**Tech Stack Support:**
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

---

## License

Proprietary — Internal use only for PT Gramedia Asri Media (Kompas Gramedia Group).

Tidak untuk didistribusikan ke pihak eksternal tanpa izin tertulis.

---

> **Built with care for Gramedia teams.**
> Dokumentasi terakhir di-update: Mei 2026
