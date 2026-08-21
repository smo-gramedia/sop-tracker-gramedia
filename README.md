<div align="center">

# Gramedia SOP Tracker

**Internal Learning Management System (LMS) untuk Pembelajaran SOP**

*PT Gramedia Asri Media — Kompas Gramedia Group*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-MySQL-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#-license)

[Tentang](#-tentang-aplikasi) •
[Fitur](#-fitur-utama) •
[Tech Stack](#%EF%B8%8F-tech-stack) •
[Quick Start](#-quick-start) •
[Dokumentasi](#-dokumentasi) •
[Kontribusi](#-kontribusi)

</div>

---

## Tentang Aplikasi

**Gramedia SOP Tracker** adalah platform pembelajaran Standard Operating Procedure (SOP) internal di lingkungan Kompas Gramedia Group. Aplikasi memfasilitasi pembelajaran SOP karyawan dengan workflow terstruktur 6 tahap, post test berbasis NIK, dan compliance reporting per unit kerja.

### Tujuan

- Memastikan semua karyawan memahami SOP yang berlaku di perusahaan
- Memudahkan distribusi & sosialisasi SOP secara digital
- Memberikan evidence terstruktur untuk compliance audit
- Reporting compliance rate per unit kerja secara real-time

---

## Fitur Utama

### Authentication & Authorization
- Login dengan email + password (NextAuth v5)
- Role-based access: **Admin** & **User**
- Session JWT dengan auto-refresh
- Secure password hashing (bcrypt)

### Manajemen SOP
- Upload SOP dengan **versioning system** (Original, Revisi-1, Revisi-2, dst)
- Composite unique constraint `[kode, versi]`
- Wajib upload **raw document** (.doc/.docx) untuk audit trail
- Categorization: SOP Operation, Supporting, Publishing, General, Petunjuk
- Filter & search yang cepat

### Learning Flow (6 Tahap)
1. **Baca PDF Utama** — Render PDF SOP di browser
2. **Lihat Lampiran** — Akses dokumen pendukung
3. **Upload Bukti Sosialisasi** — Submit bukti rapat/grup chat
4. **Approval Admin** — Wait for admin validation
5. **Post Test** — Quiz dengan NIK 6-digit
6. **Penutup** — Sertifikat completion

### Post Test System
- **NIK-based authentication** (6 digit angka, 1 NIK = 1 attempt per SOP)
- **Quiz state persistence** — auto-resume saat refresh/buka tab baru
- **Global Active Quiz Banner** di semua halaman
- **Multi-tab sync** via storage event
- Timer akurat berdasarkan `startedAt` (bukan elapsed time browser)

### Reporting & Export
- Dashboard compliance rate per unit kerja
- Color-coded compliance: 🟢 ≥80% | 🟡 50-79% | 🔴 <50%
- Export Excel dengan 3 sheet:
  - Info SOP
  - Summary Per Unit Kerja
  - Detail Per Karyawan (dengan NIK)

### Global Search
- Live suggestion (debounced 300ms, max 5 hasil)
- Keyboard navigation (↑↓ Enter Esc)
- Full results page `/cari?q=keyword`
- Highlight keyword di hasil pencarian
- Desktop inline + Mobile modal full-screen

### Responsive Design
- **Desktop** (≥1024px): Full navbar dengan dropdown
- **Tablet** (640-1023px): Logo + hamburger menu
- **Mobile** (<640px): Compact icon-based navbar
- PDF viewer responsive
- Form layout adaptif

---

## Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS 4.x](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Forms:** React Hook Form + Zod
- **Date:** date-fns (locale ID)
- **PDF Viewer:** react-pdf

</td>
<td valign="top" width="50%">

### Backend
- **Runtime:** Node.js 24+
- **API:** Next.js Route Handlers
- **ORM:** [Prisma 7](https://www.prisma.io/)
- **Database:** MySQL
- **Auth:** [NextAuth v5](https://authjs.dev/) (Credentials)
- **Storage:** [Supabase Storage](https://supabase.com/)
- **Excel:** ExcelJS
- **Validation:** Zod

</td>
</tr>
</table>

### Development Tools
- **Language:** TypeScript 7
- **Linter:** ESLint
- **Formatter:** Prettier
- **Build:** Next.js Turbopack
- **Process Manager:** PM2 (production)

---

## Quick Start

### Prerequisites

```
Node.js  ≥ 24.x
npm      ≥ 11.x
Git
MySQL access
```

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd gramedia-sop-tracker

# 2. Install dependencies (gunakan --legacy-peer-deps karena React 19)
npm install --legacy-peer-deps

# 3. Setup environment variables
cp .env.example .env
# Edit .env sesuai kredensial Anda (lihat ENV-VARIABLES.md)

# 4. Generate Prisma client
npx prisma generate

# 5. Push schema ke database
npx prisma db push

# 6. Seed data dasar (superadmin, departments, dll)
npx tsx prisma/seed.ts

# 7. Optional — Seed SOP dummy untuk testing
npx tsx prisma/seed-dummy-sops.ts

# 8. Jalankan development server
npm run dev
```

Buka **http://localhost:3000** di browser.

### Test Login

```
Email:    superadmin@gramedia.com
Password: (lihat prisma/seed.ts)
```
---

## Struktur Project

```
gramedia-sop-tracker/
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.ts                    # Seed data dasar
│   └── seed-dummy-sops.ts         # Seed SOP dummy
├── public/                        # Static assets
├── src/
│   ├── app/
│   │   ├── (admin)/               # Admin routes group
│   │   ├── (user)/                # User routes group
│   │   ├── api/                   # API Route Handlers
│   │   └── sign-in/               # Public route
│   ├── components/
│   │   ├── admin/                 # Admin-specific components
│   │   ├── user/                  # User-specific components
│   │   └── ui/                    # shadcn/ui base
│   ├── lib/
│   │   ├── auth.ts                # NextAuth config
│   │   ├── prisma.ts              # Prisma client
│   │   └── utils.ts               # Helper utilities
│   └── types/                     # TypeScript types
├── docs/                          # Documentation
├── .env.example                   # Env template
├── next.config.mjs                # Next.js config
├── tailwind.config.ts             # Tailwind config
└── package.json                   # Dependencies
```

---

## Database Schema

Aplikasi memiliki **~15 model utama** dalam 4 domain:

<table>
<tr>
<td valign="top"><strong>User & Auth</strong></td>
<td><code>User</code> · <code>Department</code> · <code>Division</code> · <code>Directorate</code></td>
</tr>
<tr>
<td valign="top"><strong>SOP & Documents</strong></td>
<td><code>SopDocument</code> · <code>SopAttachment</code> · <code>RawDocument</code> · <code>SopSubcategory</code></td>
</tr>
<tr>
<td valign="top"><strong>Learning & Test</strong></td>
<td><code>LearningProgress</code> · <code>PostTest</code> · <code>PostTestQuestion</code> · <code>PostTestResult</code></td>
</tr>
<tr>
<td valign="top"><strong>Support</strong></td>
<td><code>Attachment</code> · <code>Notification</code> · <code>FaqEntry</code> · <code>GlossaryEntry</code></td>
</tr>
</table>

### Critical Constraints

```prisma
// 1. SOP Versioning — satu kode bisa multiple versi
model SopDocument {
  @@unique([kode, versi], name: "kode_versi")
}

// 2. NIK Dedup — 1 NIK = 1 attempt per post test
model PostTestResult {
  @@unique([postTestId, nikKaryawan], name: "post_test_nik")
}

// 3. NIK Format — 6 digit angka (Zod validation)
const NIKSchema = z.string().regex(/^[0-9]{6}$/);
```

---

## Kontribusi

Project ini bersifat **internal**. Untuk kontribusi:

1. **Fork** repository (atau clone untuk internal repo)
2. **Buat branch** dari `main` (`feature/xxx` atau `fix/xxx`)
3. **Commit** dengan [conventional commits](https://www.conventionalcommits.org/):
   ```
   feat(post-test): add NIK validation
   fix(navbar): hide logo text on mobile
   docs(readme): update setup steps
   ```
4. **Push** ke branch
5. **Open Pull Request** dengan deskripsi jelas

---

## License

**Proprietary** — Internal use only.

Software ini adalah karya internal PT Gramedia Asri Media dan Kompas Gramedia Group. Tidak boleh didistribusikan, diperbanyak, atau digunakan di luar lingkungan perusahaan tanpa izin tertulis.

```
Copyright (c) 2026 PT Gramedia Asri Media — Kompas Gramedia Group
All rights reserved.
```

---

## Tim

**Project Owner**
- Strategic Management Office (SMO) — PT Gramedia Asri Media

**Original Developer**
- **Fahmi Jamaludin** — Integration Officer SMO

**Hand-over to**
- SIT Department — Juli 2026

---

## Acknowledgments

Aplikasi ini dibangun di atas dasar open source :

- [Next.js](https://nextjs.org/) by Vercel
- [React](https://react.dev/) by Meta
- [Prisma](https://www.prisma.io/) by Prisma
- [Tailwind CSS](https://tailwindcss.com/) by Tailwind Labs
- [shadcn/ui](https://ui.shadcn.com/) by shadcn
- [Lucide Icons](https://lucide.dev/) by Lucide contributors

---


---

<div align="center">

*PT Gramedia Asri Media — Kompas Gramedia Group*

</div>
