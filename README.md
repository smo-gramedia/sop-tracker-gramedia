# Gramedia SOP Tracker

> **Internal Learning Management System (LMS) untuk pembelajaran SOP**
> di lingkungan PT Gramedia Asri Media — Kompas Gramedia Group

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.6-darkblue)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Storage-Supabase-green)](https://supabase.com/)

---

## 📋 Daftar Isi

1. [Tentang Aplikasi](#tentang-aplikasi)
2. [Tech Stack](#tech-stack)
3. [Quick Start](#quick-start)
4. [Struktur Folder](#struktur-folder)
5. [Environment Variables](#environment-variables)
6. [Build & Deploy](#build--deploy)
7. [Database Setup](#database-setup)
8. [Dokumentasi Terkait](#dokumentasi-terkait)
9. [Kontak Support](#kontak-support)

---

## Tentang Aplikasi

**Gramedia SOP Tracker** adalah platform pembelajaran Standard Operating Procedure (SOP) internal di lingkungan Kompas Gramedia Group. Aplikasi memfasilitasi:

- Manajemen SOP dengan versioning system
- Pembelajaran 6 tahap terstruktur per SOP
- Post Test berbasis NIK karyawan
- Approval workflow untuk bukti sosialisasi
- Compliance reporting per unit kerja
- Global search untuk SOP

### Versi Aplikasi
**Post Batch 6 (Global Search)** — Juni 2026

### Fitur Utama
- Manajemen SOP (CRUD) dengan composite unique `[kode, versi]`
- Upload dokumen (PDF + raw .doc/.docx + lampiran)
- User management dengan role-based access (admin/user)
- Learning flow 6 tahap dengan progress tracking
- Post Test NIK-based (1 NIK = 1 attempt per SOP)
- Quiz state persistence (auto-resume saat refresh/buka tab baru)
- Global Active Quiz Banner di semua halaman
- Bukti sosialisasi approval workflow
- Export Excel laporan (Detail Per Karyawan + Summary Per Unit)
- Global Search (desktop inline + mobile icon-modal)
- Responsive design (Desktop + Tablet + Mobile)

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16.2.9 (App Router + Server Components)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 3.x + shadcn/ui components
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation

### Backend
- **API:** Next.js API Routes (Route Handlers)
- **ORM:** Prisma 6.6
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** NextAuth v5 (Credentials provider)
- **File Storage:** Supabase Storage (Singapore region)

### Development
- **Language:** TypeScript 5
- **Linter:** ESLint
- **Formatter:** Prettier
- **Build Tool:** Next.js Turbopack

---

## Quick Start

### Prerequisites
- Node.js ≥ 18.x
- npm ≥ 9.x atau pnpm ≥ 8.x
- PostgreSQL access (via Supabase atau lokal)
- Git

### Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd gramedia-sop-tracker

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Setup environment variables
cp .env.example .env
# Edit .env dengan kredensial yang sesuai

# 4. Generate Prisma client
npx prisma generate

# 5. Push schema ke database
npx prisma db push

# 6. Seed data dasar (superadmin, departments, dll)
npx tsx prisma/seed.ts

# 7. (Optional) Seed SOP dummy untuk testing
npx tsx prisma/seed-dummy-sops.ts

# 8. Jalankan development server
npm run dev
```

Buka browser di **http://localhost:3000**

### Test Login
- **Email:** `superadmin@gramedia.com`
- **Password:** *(lihat seed file)*


---

## Struktur Folder

```
gramedia-sop-tracker/
├── prisma/
│   ├── schema.prisma           # Database schema (Prisma)
│   ├── seed.ts                  # Seed data dasar
│   └── seed-dummy-sops.ts       # Seed 60 SOP dummy untuk testing
├── public/                      # Static assets (logo, favicon)
├── src/
│   ├── app/
│   │   ├── (admin)/             # Layout & routes admin
│   │   │   ├── dashboard/
│   │   │   ├── user-manajemen/
│   │   │   ├── upload-dokumen/
│   │   │   ├── raw-dokumen/
│   │   │   ├── post-test/
│   │   │   ├── attachment/
│   │   │   └── ...
│   │   ├── (user)/              # Layout & routes user
│   │   │   ├── home/
│   │   │   ├── sop/[kategori]/
│   │   │   ├── belajar/[id]/
│   │   │   ├── cari/            # Global search results
│   │   │   ├── post-test/
│   │   │   ├── profil/
│   │   │   └── ...
│   │   ├── api/                 # API Routes
│   │   │   ├── auth/
│   │   │   ├── post-test/
│   │   │   ├── upload/
│   │   │   ├── search/          # Global search API
│   │   │   └── ...
│   │   └── sign-in/
│   ├── components/
│   │   ├── admin/               # Komponen khusus admin
│   │   ├── user/                # Komponen khusus user
│   │   │   ├── PostTestFlow.tsx
│   │   │   ├── ActiveQuizBanner.tsx
│   │   │   ├── GlobalSearch.tsx
│   │   │   └── ...
│   │   ├── ui/                  # shadcn/ui base components
│   │   └── Logo.tsx
│   ├── actions/                 # Server Actions (deprecated, sebagian)
│   ├── lib/
│   │   ├── auth.ts              # NextAuth config
│   │   ├── prisma.ts            # Prisma client singleton
│   │   ├── utils.ts             # cn() helper, formatters
│   │   └── learning-gates.ts    # Logic untuk gating step learning
│   └── types/                   # Custom TypeScript types
├── .env                          # Environment variables (JANGAN COMMIT!)
├── .env.example                  # Template env variables
├── .gitignore
├── next.config.mjs               # Next.js config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies & scripts
└── README.md                     # File ini
```

---

## Environment Variables

Detail lengkap di **ENV-VARIABLES.md**, ringkasnya:

```env
# Database
DATABASE_URL="postgresql://..."     # Supabase pooler URL (port 6543)
DIRECT_URL="postgresql://..."        # Supabase direct (port 5432, untuk migration)

# Authentication (NextAuth v5)
AUTH_SECRET="..."                    # Generate: openssl rand -base64 32
AUTH_TRUST_HOST=true                 # WAJIB di production

# Supabase Storage
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."      # SENSITIVE!
SUPABASE_BUCKET="sop-documents"

# Optional
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Build & Deploy

### Development
```bash
npm run dev          # Start dev server (Turbopack)
```

### Production Build
```bash
npm run build        # Build aplikasi
npm start            # Run production server
```

Detail deployment di **DEPLOYMENT-GUIDE.md** (untuk server perusahaan).

### Common Scripts
```bash
npm run lint         # ESLint check
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema (TANPA migration history)
npx prisma studio    # Prisma Studio (GUI database)
```

---

## Database Setup

### Schema Overview
Database memiliki ~15 model utama. Detail lihat **DATABASE-SCHEMA.md** dan **ERD diagram**.

**Models utama:**
- `User` (auth, role)
- `Department`, `Division`, `Directorate` (struktur organisasi)
- `SopDocument` (SOP utama, dengan versioning)
- `SopAttachment`, `RawDocument` (file SOP)
- `PostTest`, `PostTestQuestion`, `PostTestResult` (post test system)
- `LearningProgress` (progress user per SOP)
- `Attachment` (bukti sosialisasi)
- `Notification`, `FaqEntry`, `GlossaryEntry`

### Critical Constraints
1. **SopDocument:** `@@unique([kode, versi], name: "kode_versi")` — kombinasi kode+versi harus unique
2. **PostTestResult:** `@@unique([postTestId, nikKaryawan], name: "post_test_nik")` — 1 NIK = 1 attempt per post test
3. **NIK format:** 6 digit angka (validated via Zod)

### Migrations
Project ini **tidak pakai migration files**, gunakan `db push`:
```bash
# Update schema
npx prisma db push

# Reset (HATI-HATI di production!)
npx prisma db push --force-reset
```

---

## Dokumentasi Terkait

Lihat folder dokumentasi untuk panduan detail:

| Dokumen | Untuk Siapa | Lokasi |
|---|---|---|
| **README.md** | Developer | File ini |
| **User Manual Admin** | Admin SMO | `docs/User-Manual-Admin.docx` |
| **User Manual User** | Karyawan | `docs/User-Manual-User.docx` |
| **User Guideline** | All users | `docs/User-Guideline.md` |
| **ERD Diagram** | Database admin | `docs/ERD-*.svg/.png/.pdf` |
| **List Package** | IT/Security | `docs/LIST-PACKAGE.md` |
| **Technical Architecture** | Senior Dev | `docs/TECHNICAL-ARCHITECTURE.md` |
| **Deployment Guide** | DevOps/IT | `docs/DEPLOYMENT-GUIDE.md` |
| **Environment Variables** | DevOps | `docs/ENV-VARIABLES.md` |
| **Database Schema** | Developer | `docs/DATABASE-SCHEMA.md` |
| **API Documentation** | Developer/Integrator | `docs/API-DOCUMENTATION.md` |
| **Changelog** | All | `docs/CHANGELOG.md` |
| **Troubleshooting** | Support | `docs/TROUBLESHOOTING.md` |
| **Security** | IT Security | `docs/SECURITY.md` |
| **Testing Checklist** | QA | `docs/Testing-Checklist.xlsx` |


## License

**Proprietary** — Internal use only at PT Gramedia Asri Media & Kompas Gramedia Group.

---

**Project Owner:** Strategic Management Office (SMO)
**Original Developer:** Fahmi Jamaludin (Integration Officer SMO)
**Hand-over to:** SIT Department — Juli 2026
