// prisma/seed.ts  (replace existing)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Directorates ──────────────────────────────────────────────────────
  const cst = await prisma.directorate.upsert({
    where: { kode: "CST" },
    update: {},
    create: { kode:"CST", singkatan:"CST", nama:"Corporate Strategy & Technology Directorate", companyGroup:"Kompas Gramedia" },
  });
  const gorp = await prisma.directorate.upsert({
    where: { kode: "GORP" },
    update: {},
    create: { kode:"GORP", singkatan:"GoRP", nama:"Group of Retail & Publishing (GoRP)", companyGroup:"Kompas Gramedia" },
  });
  const fin = await prisma.directorate.upsert({
    where: { kode: "FA" },
    update: {},
    create: { kode:"FA", singkatan:"FA", nama:"Finance & Accounting Directorate", companyGroup:"Kompas Gramedia" },
  });
  const hc = await prisma.directorate.upsert({
    where: { kode: "HC" },
    update: {},
    create: { kode:"HC", singkatan:"HC", nama:"Human Capital Directorate", companyGroup:"Kompas Gramedia" },
  });
  console.log("✓ Directorates");

  // ── Divisions ─────────────────────────────────────────────────────────
  const divCSSM = await prisma.division.upsert({
    where: { kode: "CSSM" }, update: {},
    create: { kode:"CSSM", nama:"Corporate Sec. & Strategy Management Division", directorateId: cst.id },
  });
  const divIT = await prisma.division.upsert({
    where: { kode: "ITD" }, update: {},
    create: { kode:"ITD", nama:"Information Technology Division", directorateId: cst.id },
  });
  const divRetail = await prisma.division.upsert({
    where: { kode: "RETL" }, update: {},
    create: { kode:"RETL", nama:"Retail Division", directorateId: gorp.id },
  });
  const divPub = await prisma.division.upsert({
    where: { kode: "PED" }, update: {},
    create: { kode:"PED", nama:"Publishing & Education Division", directorateId: gorp.id },
  });
  const divFin = await prisma.division.upsert({
    where: { kode: "FIND" }, update: {},
    create: { kode:"FIND", nama:"Finance Division", directorateId: fin.id },
  });
  const divAcc = await prisma.division.upsert({
    where: { kode: "ACCD" }, update: {},
    create: { kode:"ACCD", nama:"Accounting Division", directorateId: fin.id },
  });
  const divHR = await prisma.division.upsert({
    where: { kode: "HRD" }, update: {},
    create: { kode:"HRD", nama:"Human Resources Division", directorateId: hc.id },
  });
  const divGA = await prisma.division.upsert({
    where: { kode: "GAD" }, update: {},
    create: { kode:"GAD", nama:"General Affairs Division", directorateId: hc.id },
  });
  console.log("✓ Divisions");

  // ── Departments ───────────────────────────────────────────────────────
  const deptSMO = await prisma.department.upsert({
    where: { kode: "SMO" }, update: {},
    create: { kode:"SMO", nama:"SMO Department", divisionId: divCSSM.id },
  });
  await prisma.department.upsert({
    where: { kode: "ITIF" }, update: {},
    create: { kode:"ITIF", nama:"IT Infrastructure Department", divisionId: divIT.id },
  });
  const deptStore = await prisma.department.upsert({
    where: { kode: "STOR" }, update: {},
    create: { kode:"STOR", nama:"Store Operations Department", divisionId: divRetail.id },
  });
  await prisma.department.upsert({
    where: { kode: "GCOM" }, update: {},
    create: { kode:"GCOM", nama:"Gramedia.com Department", divisionId: divRetail.id },
  });
  await prisma.department.upsert({
    where: { kode: "EDIT" }, update: {},
    create: { kode:"EDIT", nama:"Editorial Department", divisionId: divPub.id },
  });
  const deptFin = await prisma.department.upsert({
    where: { kode: "FIN" }, update: {},
    create: { kode:"FIN", nama:"Finance Department", divisionId: divFin.id },
  });
  const deptHR = await prisma.department.upsert({
    where: { kode: "HROP" }, update: {},
    create: { kode:"HROP", nama:"HR Operations Department", divisionId: divHR.id },
  });
  console.log("✓ Departments");

  // ── SOP Subcategories ─────────────────────────────────────────────────
  await prisma.sopSubcategory.upsert({
    where: { kode: "SMGR" }, update: {},
    create: { kode:"SMGR", nama:"SOP Manager", deskripsi:"Panduan manajerial dan kepemimpinan untuk posisi manajer di seluruh unit Gramedia" },
  });
  await prisma.sopSubcategory.upsert({
    where: { kode: "SADF" }, update: {},
    create: { kode:"SADF", nama:"SOP Administration - Financial", deskripsi:"Prosedur administrasi keuangan, pelaporan, dan tata kelola umum lintas divisi" },
  });
  console.log("✓ SOP Subcategories");

  // ── Stores ────────────────────────────────────────────────────────────
  const storeData = [
    { kode:"1-CP-2026",  nama:"Gramedia Summarecon Bekasi",  wilayah:"Jawa Barat", kota:"Bekasi",   departemen:"Store" },
    { kode:"2-CP-2026",  nama:"Gramedia Central Park",       wilayah:"DKI Jakarta",kota:"Jakarta",  departemen:"Store" },
    { kode:"3-CP-2026",  nama:"Gramedia Matraman",           wilayah:"DKI Jakarta",kota:"Jakarta",  departemen:"Store" },
    { kode:"4-CP-2026",  nama:"Gramedia Lippo Cikarang",     wilayah:"Jawa Barat", kota:"Cikarang", departemen:"Store" },
    { kode:"5-CP-2026",  nama:"Gramedia Surabaya",           wilayah:"Jawa Timur", kota:"Surabaya", departemen:"Store" },
  ];
  for (const s of storeData) {
    await prisma.store.upsert({ where: { kode: s.kode }, update: {}, create: { ...s, status:"aktif" } });
  }
  console.log("✓ Stores");

  // ── Users ─────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash("Admin@123!", 12);

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@gramedia.co.id" },
    update: {},
    create: {
      kodeKaryawan: "SA-001", nama:"Super Admin",
      email:"superadmin@gramedia.co.id", passwordHash: hash,
      unit:"SMO", jabatan:"System Administrator", section:"IT Ops",
      role:"superadmin", status:"aktif", joinedAt: new Date("2020-01-01"),
    },
  });

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@gramedia.co.id" },
    update: {},
    create: {
      kodeKaryawan: "ADM-001", nama:"Budi Admin",
      email:"admin@gramedia.co.id", passwordHash: hash,
      unit:"SMO", jabatan:"SOP Administrator", section:"Integration 1",
      role:"admin", status:"aktif", joinedAt: new Date("2021-03-15"),
    },
  });

  // User biasa
  const user1 = await prisma.user.upsert({
    where: { email: "user@gramedia.co.id" },
    update: {},
    create: {
      kodeKaryawan: "USR-001", nama:"Siti Karyawan",
      email:"user@gramedia.co.id", passwordHash: hash,
      unit:"Store", jabatan:"Store Associate", section:"Operations",
      role:"user", status:"aktif", joinedAt: new Date("2022-06-01"),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "user2@gramedia.co.id" },
    update: {},
    create: {
      kodeKaryawan: "USR-002", nama:"Andi Prasetyo",
      email:"user2@gramedia.co.id", passwordHash: hash,
      unit:"Finance", jabatan:"Staff Keuangan", section:"Treasury",
      role:"user", status:"aktif", joinedAt: new Date("2023-01-10"),
    },
  });

  console.log("✓ Users — 4 akun dibuat");
  console.log("   Super Admin : superadmin@gramedia.co.id / Admin@123!");
  console.log("   Admin       : admin@gramedia.co.id       / Admin@123!");
  console.log("   User 1      : user@gramedia.co.id        / Admin@123!");
  console.log("   User 2      : user2@gramedia.co.id       / Admin@123!");

  // ── Sample SOP Documents ──────────────────────────────────────────────
  const sop1 = await prisma.sopDocument.upsert({
    where: { kode: "MP/FIN/01" }, update: {},
    create: {
      kode:"MP/FIN/01", judul:"Pembayaran Tagihan PO",
      deskripsi:"Prosedur pembayaran tagihan purchase order kepada vendor sesuai ketentuan yang berlaku.",
      kategori:"ss", tipe:"MP", departmentId: deptFin.id,
      versi:"Original", status:"aktif", uploadedById: superAdmin.id,
      tanggalBerlaku: new Date("2024-01-01"),
    },
  });
  const sop2 = await prisma.sopDocument.upsert({
    where: { kode: "MP/STOR/01" }, update: {},
    create: {
      kode:"MP/STOR/01", judul:"Pick Up In Store",
      deskripsi:"Prosedur pelayanan pick up pesanan online di toko Gramedia.",
      kategori:"sr", tipe:"MP", departmentId: deptStore.id,
      versi:"Revisi-2", status:"aktif", uploadedById: superAdmin.id,
      tanggalBerlaku: new Date("2024-03-01"),
    },
  });
  const sop3 = await prisma.sopDocument.upsert({
    where: { kode: "PS/SMO/01" }, update: {},
    create: {
      kode:"PS/SMO/01", judul:"Champion Team (Rev-2)",
      deskripsi:"Panduan pelaksanaan program Champion Team di seluruh unit bisnis Gramedia.",
      kategori:"ss", tipe:"PS", departmentId: deptSMO.id,
      versi:"Revisi-2", status:"aktif", uploadedById: superAdmin.id,
      tanggalBerlaku: new Date("2025-05-10"),
    },
  });
  console.log("✓ Sample SOP Documents");

  // ── Sample Learning Progress ──────────────────────────────────────────
  await prisma.learningProgress.upsert({
    where: { userId_sopDocumentId: { userId: user1.id, sopDocumentId: sop2.id } },
    update: {},
    create: {
      userId: user1.id, sopDocumentId: sop2.id,
      stepCurrent: 2, status: "dipelajari",
      startedAt: new Date(), lastAccessedAt: new Date(),
    },
  });
  await prisma.learningProgress.upsert({
    where: { userId_sopDocumentId: { userId: user2.id, sopDocumentId: sop1.id } },
    update: {},
    create: {
      userId: user2.id, sopDocumentId: sop1.id,
      stepCurrent: 4, status: "dipelajari",
      startedAt: new Date(Date.now() - 3*24*60*60*1000),
      lastAccessedAt: new Date(),
    },
  });
  console.log("✓ Sample Learning Progress");

  // ── Sample Post Test ──────────────────────────────────────────────────
  const existingPT = await prisma.postTest.findUnique({ where: { sopDocumentId: sop1.id } });
  if (!existingPT) {
    await prisma.postTest.create({
      data: {
        sopDocumentId: sop1.id,
        passingGrade: 70, durasiMenit: 10, jumlahSoal: 10,
        createdById: superAdmin.id,
        questions: {
          create: [
            { pertanyaan:"Apa yang dimaksud dengan Pembayaran Tagihan PO?", opsiA:"Pembayaran gaji karyawan", opsiB:"Pembayaran kepada vendor berdasarkan purchase order", opsiC:"Pembayaran biaya operasional", opsiD:"Pembayaran pajak perusahaan", jawabanBenar:"b" },
            { pertanyaan:"Dokumen apa yang diperlukan untuk proses pembayaran PO?", opsiA:"Hanya invoice vendor", opsiB:"Invoice dan faktur pajak saja", opsiC:"PO, invoice vendor, faktur pajak, dan BAST", opsiD:"PO dan surat jalan saja", jawabanBenar:"c" },
            { pertanyaan:"Berapa hari maksimal proses verifikasi dokumen pembayaran?", opsiA:"1 hari kerja", opsiB:"3 hari kerja", opsiC:"5 hari kerja", opsiD:"7 hari kerja", jawabanBenar:"b" },
            { pertanyaan:"Siapa yang berwenang menyetujui pembayaran di atas Rp 50 juta?", opsiA:"Staff Finance", opsiB:"Supervisor Finance", opsiC:"Manager Finance", opsiD:"Direktur Finance", jawabanBenar:"d" },
            { pertanyaan:"Apa yang harus dilakukan jika dokumen tidak lengkap?", opsiA:"Tetap diproses", opsiB:"Dikembalikan ke pemohon untuk dilengkapi", opsiC:"Diproses sebagian", opsiD:"Ditolak permanen", jawabanBenar:"b" },
            { pertanyaan:"Sistem yang digunakan untuk input pembayaran PO adalah?", opsiA:"Microsoft Excel", opsiB:"SAP / ERP perusahaan", opsiC:"Google Sheets", opsiD:"Sistem manual", jawabanBenar:"b" },
            { pertanyaan:"Berapa lama dokumen pembayaran harus disimpan?", opsiA:"1 tahun", opsiB:"3 tahun", opsiC:"5 tahun", opsiD:"10 tahun", jawabanBenar:"d" },
            { pertanyaan:"Apa yang dimaksud dengan 3-way matching dalam proses PO?", opsiA:"Pencocokan PO, invoice, dan rekening bank", opsiB:"Pencocokan PO, GR (goods receipt), dan invoice", opsiC:"Pencocokan tiga tanda tangan", opsiD:"Pencocokan tiga mata uang", jawabanBenar:"b" },
            { pertanyaan:"Kapan proses pembayaran dapat dimulai?", opsiA:"Setelah PO dibuat", opsiB:"Setelah barang dipesan", opsiC:"Setelah barang/jasa diterima dan diverifikasi", opsiD:"Setelah invoice diterima", jawabanBenar:"c" },
            { pertanyaan:"Siapa yang bertanggung jawab mengarsipkan dokumen pembayaran?", opsiA:"Vendor", opsiB:"Manager Operasional", opsiC:"Staff Finance yang menangani transaksi", opsiD:"IT Department", jawabanBenar:"c" },
          ],
        },
      },
    });
    console.log("✓ Sample Post Test (10 soal)");
  }

  // ── FAQs ──────────────────────────────────────────────────────────────
  const faqs = [
    { pertanyaan:"Apa itu SOP Tracker?", jawaban:"SOP Tracker adalah sistem manajemen pembelajaran SOP internal Kompas Gramedia yang memungkinkan karyawan mempelajari SOP secara terstruktur.", urutan:1 },
    { pertanyaan:"Bagaimana cara memulai pembelajaran SOP?", jawaban:"Pilih SOP dari menu navigasi, klik tombol 'Pelajari' pada kartu SOP, lalu ikuti 7 langkah alur pembelajaran hingga selesai.", urutan:2 },
    { pertanyaan:"Apa yang harus dilakukan setelah membaca SOP?", jawaban:"Upload foto atau dokumen sebagai bukti sosialisasi. Admin akan memverifikasi dan membuka akses Post Test.", urutan:3 },
    { pertanyaan:"Berapa nilai minimum untuk lulus Post Test?", jawaban:"Nilai minimum kelulusan adalah 70 dari 100. Post Test terdiri dari 10 soal pilihan ganda dengan waktu 10 menit.", urutan:4 },
    { pertanyaan:"Bagaimana cara melihat progress belajar saya?", jawaban:"Kunjungi halaman Profil untuk melihat seluruh riwayat pembelajaran, aktivitas, dan hasil post test.", urutan:5 },
  ];
  for (const faq of faqs) {
    const existing = await prisma.faqEntry.findFirst({ where: { pertanyaan: faq.pertanyaan } });
    if (!existing) {
      await prisma.faqEntry.create({ data: { ...faq, createdById: superAdmin.id } });
    }
  }
  console.log("✓ FAQs");

  // ── Glossary ──────────────────────────────────────────────────────────
  const glossaryData = [
    { kata:"SOP", deskripsi:"Standard Operating Procedure — prosedur operasional standar yang mengatur tata cara pelaksanaan suatu kegiatan." },
    { kata:"PO", deskripsi:"Purchase Order — dokumen resmi yang diterbitkan pembeli kepada vendor sebagai permintaan pembelian barang/jasa." },
    { kata:"BAST", deskripsi:"Berita Acara Serah Terima — dokumen yang menyatakan barang/jasa telah diterima sesuai spesifikasi." },
    { kata:"GR", deskripsi:"Goods Receipt — konfirmasi penerimaan barang di sistem ERP/SAP setelah barang fisik diterima." },
    { kata:"Invoice", deskripsi:"Tagihan resmi dari vendor kepada perusahaan atas barang/jasa yang telah diterima." },
  ];
  for (const g of glossaryData) {
    const existing = await prisma.glossaryEntry.findUnique({ where: { kata: g.kata } });
    if (!existing) await prisma.glossaryEntry.create({ data: { ...g, createdById: superAdmin.id } });
  }
  console.log("✓ Glossary");

  console.log("\n✅ Seeding selesai!");
  console.log("\n📋 Akun yang tersedia:");
  console.log("   Super Admin : superadmin@gramedia.co.id / Admin@123!");
  console.log("   Admin       : admin@gramedia.co.id       / Admin@123!");
  console.log("   User 1      : user@gramedia.co.id        / Admin@123!");
  console.log("   User 2      : user2@gramedia.co.id       / Admin@123!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
