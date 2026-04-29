# Gramedia SOP Tracker

Sistem Manajemen Pembelajaran SOP Internal Kompas Gramedia.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Bahasa | TypeScript |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma 6 |
| Auth | NextAuth.js v5 |
| UI | Tailwind CSS v3 + shadcn/ui |
| Email | Resend |
| Deploy | Vercel |

## Struktur Folder

```
src/
├── app/
│   ├── (auth)/sign-in          # Halaman login
│   ├── (user)/                 # Halaman untuk user
│   │   ├── home/               # Beranda
│   │   ├── sop/[kategori]/     # Halaman SOP per kategori
│   │   ├── belajar/[id]/       # Alur pembelajaran 7 step
│   │   └── profil/             # Profil & riwayat aktivitas
│   ├── (admin)/                # Admin panel
│   │   ├── dashboard/
│   │   ├── upload-dokumen/
│   │   ├── raw-dokumen/
│   │   ├── glosarium/
│   │   ├── kategori/
│   │   ├── user-manajemen/
│   │   ├── attachment/
│   │   ├── user-progress/
│   │   ├── post-test/
│   │   ├── faq/
│   │   └── struktur-organisasi/
│   └── api/                    # API Routes
├── actions/                    # Server Actions
├── components/
│   ├── ui/                     # Komponen dasar (shadcn)
│   ├── admin/                  # Komponen admin
│   ├── user/                   # Komponen user
│   └── shared/                 # Komponen shared
├── lib/                        # Utilities & config
├── types/                      # TypeScript types
└── hooks/                      # Custom hooks
```

## Setup

```bash
# 1. Clone & install
npm install

# 2. Copy env
cp .env.example .env.local
# Isi DATABASE_URL, DIRECT_URL dari Supabase
# Isi AUTH_SECRET dengan: openssl rand -base64 32
# Isi Supabase keys & Resend API key

# 3. Generate Prisma client
npm run db:generate

# 4. Push schema ke database
npm run db:push

# 5. Seed data awal
npm run db:seed

# 6. Jalankan dev server
npm run dev
```

## Default Credentials (setelah seed)

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@gramedia.co.id | Admin@123! |

## Database

22 tabel — lihat `prisma/schema.prisma` untuk schema lengkap.

## Role & Akses

| Fitur | User | Admin | Super Admin |
|---|---|---|---|
| Halaman SOP & Pembelajaran | ✓ | — | — |
| Attachment Sosialisasi | ✓ | ✓ | ✓ |
| Raw Dokumen, Glosarium | — | ✓ | ✓ |
| User Progress, Post Test | — | ✓ | ✓ |
| Upload Dokumen, Kategori | — | — | ✓ |
| User Manajemen | — | — | ✓ |
| Struktur Organisasi | — | — | ✓ |
