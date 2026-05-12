// prisma/seed.ts
// ════════════════════════════════════════════════════════════════════
// Seed Fase 1: Konsep baru user = unit kerja (store/department)
// - 2 Admin accounts (ADMIN-001, SUPERADMIN-001)
// - 5 Store users (STR-XXXXX-001)
// - 7 Department users (DEPT-XXX-001)
// ════════════════════════════════════════════════════════════════════
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
  console.log("✓ Divisions");

  // ── Departments ───────────────────────────────────────────────────────
  const deptSMO = await prisma.department.upsert({
    where: { kode: "SMO" }, update: {},
    create: { kode:"SMO", nama:"Strategic Management Office", divisionId: divCSSM.id },
  });
  const deptIT = await prisma.department.upsert({
    where: { kode: "IT" }, update: {},
    create: { kode:"IT", nama:"Information Technology", divisionId: divIT.id },
  });
  const deptStore = await prisma.department.upsert({
    where: { kode: "STORE" }, update: {},
    create: { kode:"STORE", nama:"Store Operations", divisionId: divRetail.id },
  });
  const deptEdit = await prisma.department.upsert({
    where: { kode: "EDIT" }, update: {},
    create: { kode:"EDIT", nama:"Editorial", divisionId: divPub.id },
  });
  const deptFin = await prisma.department.upsert({
    where: { kode: "FIN" }, update: {},
    create: { kode:"FIN", nama:"Finance Department", divisionId: divFin.id },
  });
  const deptAcc = await prisma.department.upsert({
    where: { kode: "ACC" }, update: {},
    create: { kode:"ACC", nama:"Accounting Department", divisionId: divAcc.id },
  });
  const deptHR = await prisma.department.upsert({
    where: { kode: "HR" }, update: {},
    create: { kode:"HR", nama:"Human Resources", divisionId: divHR.id },
  });
  console.log("✓ Departments");

  // ── Users (Konsep Baru: Unit Kerja) ──────────────────────────────────
  // Password semua user: Admin@123!
  const hash = await bcrypt.hash("Admin@123!", 12);

  // ────────────────────────────────────────────────────────────────────
  // ADMIN ACCOUNTS (kodeUser format ADMIN-NNN / SUPERADMIN-NNN)
  // tipeUser = null (admin bukan unit kerja)
  // ────────────────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@gramedia.co.id" },
    update: {},
    create: {
      kodeUser: "SUPERADMIN-001",
      tipeUser: null,
      nama: "Super Admin",
      email: "superadmin@gramedia.co.id",
      passwordHash: hash,
      unit: "SMO",
      role: "superadmin",
      status: "aktif",
      joinedAt: new Date("2020-01-01"),
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@gramedia.co.id" },
    update: {},
    create: {
      kodeUser: "ADMIN-001",
      tipeUser: null,
      nama: "Admin SMO",
      email: "admin@gramedia.co.id",
      passwordHash: hash,
      unit: "SMO",
      role: "admin",
      status: "aktif",
      joinedAt: new Date("2021-03-15"),
    },
  });

  // ────────────────────────────────────────────────────────────────────
  // STORE USERS (kodeUser format STR-XXXXX-001)
  // tipeUser = "store"
  // ────────────────────────────────────────────────────────────────────
  const stores = [
    {
      kode: "STR-00001-001",
      nama: "Gramedia Matraman",
      email: "str.matraman@gramedia.co.id",
      unit: "Store Operations",
      joinedAt: new Date("2022-01-15"),
    },
    {
      kode: "STR-00012-001",
      nama: "Gramedia Kelapa Gading",
      email: "str.kelapagading@gramedia.co.id",
      unit: "Store Operations",
      joinedAt: new Date("2022-03-10"),
    },
    {
      kode: "STR-00023-001",
      nama: "Gramedia Cibubur Junction",
      email: "str.cibubur@gramedia.co.id",
      unit: "Store Operations",
      joinedAt: new Date("2022-06-22"),
    },
    {
      kode: "STR-00045-001",
      nama: "Gramedia Plaza Senayan",
      email: "str.plazasenayan@gramedia.co.id",
      unit: "Store Operations",
      joinedAt: new Date("2023-01-05"),
    },
    {
      kode: "STR-00078-001",
      nama: "Gramedia Bandung Trans Studio",
      email: "str.bandungtransstudio@gramedia.co.id",
      unit: "Store Operations",
      joinedAt: new Date("2023-04-18"),
    },
  ];

  const storeUsers = [];
  for (const s of stores) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        kodeUser: s.kode,
        tipeUser: "store",
        nama: s.nama,
        email: s.email,
        passwordHash: hash,
        unit: s.unit,
        role: "user",
        status: "aktif",
        joinedAt: s.joinedAt,
      },
    });
    storeUsers.push(u);
  }

  // ────────────────────────────────────────────────────────────────────
  // DEPARTMENT USERS (kodeUser format DEPT-AAA-001)
  // tipeUser = "department"
  // ────────────────────────────────────────────────────────────────────
  const departments = [
    {
      kode: "DEPT-SMO-001",
      nama: "Strategic Management Office",
      email: "dept.smo@gramedia.co.id",
      unit: "SMO",
      joinedAt: new Date("2020-06-01"),
    },
    {
      kode: "DEPT-FIN-001",
      nama: "Finance Department",
      email: "dept.finance@gramedia.co.id",
      unit: "Finance",
      joinedAt: new Date("2020-07-15"),
    },
    {
      kode: "DEPT-HR-001",
      nama: "Human Resources Department",
      email: "dept.hr@gramedia.co.id",
      unit: "Human Resources",
      joinedAt: new Date("2020-08-20"),
    },
    {
      kode: "DEPT-IT-001",
      nama: "Information Technology Department",
      email: "dept.it@gramedia.co.id",
      unit: "IT",
      joinedAt: new Date("2020-09-10"),
    },
    {
      kode: "DEPT-ACC-001",
      nama: "Accounting Department",
      email: "dept.accounting@gramedia.co.id",
      unit: "Accounting",
      joinedAt: new Date("2021-01-12"),
    },
    {
      kode: "DEPT-EDIT-001",
      nama: "Editorial Department",
      email: "dept.editorial@gramedia.co.id",
      unit: "Editorial",
      joinedAt: new Date("2021-03-08"),
    },
    {
      kode: "DEPT-AUDIT-001",
      nama: "Internal Audit Department",
      email: "dept.audit@gramedia.co.id",
      unit: "Internal Audit",
      joinedAt: new Date("2021-05-22"),
    },
  ];

  const deptUsers = [];
  for (const d of departments) {
    const u = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        kodeUser: d.kode,
        tipeUser: "department",
        nama: d.nama,
        email: d.email,
        passwordHash: hash,
        unit: d.unit,
        role: "user",
        status: "aktif",
        joinedAt: d.joinedAt,
      },
    });
    deptUsers.push(u);
  }

  console.log("✓ Users — 14 akun dibuat");
  console.log("   Admin (2): SUPERADMIN-001, ADMIN-001");
  console.log("   Store (5): STR-00001-001, STR-00012-001, STR-00023-001, STR-00045-001, STR-00078-001");
  console.log("   Department (7): DEPT-SMO/FIN/HR/IT/ACC/EDIT/AUDIT-001");

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
  console.log("✓ Sample SOP Documents (3 utama)");

  // ── Sample Learning Progress ──────────────────────────────────────────
  // Store Matraman sedang belajar Pick Up In Store
  await prisma.learningProgress.upsert({
    where: { userId_sopDocumentId: { userId: storeUsers[0].id, sopDocumentId: sop2.id } },
    update: {},
    create: {
      userId: storeUsers[0].id, sopDocumentId: sop2.id,
      stepCurrent: 2, status: "dipelajari",
      startedAt: new Date(), lastAccessedAt: new Date(),
    },
  });
  // Finance Department sedang belajar Pembayaran PO
  await prisma.learningProgress.upsert({
    where: { userId_sopDocumentId: { userId: deptUsers[1].id, sopDocumentId: sop1.id } },
    update: {},
    create: {
      userId: deptUsers[1].id, sopDocumentId: sop1.id,
      stepCurrent: 4, status: "dipelajari",
      startedAt: new Date(Date.now() - 3*24*60*60*1000),
      lastAccessedAt: new Date(),
    },
  });
  // SMO Department sudah selesai Champion Team
  await prisma.learningProgress.upsert({
    where: { userId_sopDocumentId: { userId: deptUsers[0].id, sopDocumentId: sop3.id } },
    update: {},
    create: {
      userId: deptUsers[0].id, sopDocumentId: sop3.id,
      stepCurrent: 6, status: "selesai",
      startedAt: new Date(Date.now() - 7*24*60*60*1000),
      lastAccessedAt: new Date(Date.now() - 1*24*60*60*1000),
      completedAt: new Date(Date.now() - 1*24*60*60*1000),
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
    { pertanyaan:"Apa itu SOP Tracker?", jawaban:"SOP Tracker adalah sistem manajemen pembelajaran SOP internal Kompas Gramedia. Sistem ini digunakan oleh unit kerja (toko dan departemen) untuk mempelajari SOP secara terstruktur.", urutan:1 },
    { pertanyaan:"Bagaimana cara memulai pembelajaran SOP?", jawaban:"Pilih SOP dari menu navigasi, klik tombol 'Pelajari' pada kartu SOP, lalu ikuti 7 langkah alur pembelajaran hingga selesai.", urutan:2 },
    { pertanyaan:"Apa yang harus dilakukan setelah membaca SOP?", jawaban:"Upload foto atau dokumen sebagai bukti sosialisasi. Admin akan memverifikasi dan membuka akses Post Test.", urutan:3 },
    { pertanyaan:"Berapa nilai minimum untuk lulus Post Test?", jawaban:"Nilai minimum kelulusan adalah 70 dari 100. Post Test terdiri dari 10 soal pilihan ganda dengan waktu 10 menit.", urutan:4 },
    { pertanyaan:"Bagaimana cara melihat progress belajar unit kerja saya?", jawaban:"Kunjungi halaman Profil untuk melihat seluruh riwayat pembelajaran, aktivitas, dan hasil post test unit kerja Anda.", urutan:5 },
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

  console.log("\n✅ Seeding selesai!\n");
  console.log("📋 Akun yang tersedia (password: Admin@123!):\n");
  console.log("   ADMIN:");
  console.log("   • SUPERADMIN-001  → superadmin@gramedia.co.id");
  console.log("   • ADMIN-001       → admin@gramedia.co.id\n");
  console.log("   STORE (5):");
  console.log("   • STR-00001-001   → str.matraman@gramedia.co.id");
  console.log("   • STR-00012-001   → str.kelapagading@gramedia.co.id");
  console.log("   • STR-00023-001   → str.cibubur@gramedia.co.id");
  console.log("   • STR-00045-001   → str.plazasenayan@gramedia.co.id");
  console.log("   • STR-00078-001   → str.bandungtransstudio@gramedia.co.id\n");
  console.log("   DEPARTMENT (7):");
  console.log("   • DEPT-SMO-001    → dept.smo@gramedia.co.id");
  console.log("   • DEPT-FIN-001    → dept.finance@gramedia.co.id");
  console.log("   • DEPT-HR-001     → dept.hr@gramedia.co.id");
  console.log("   • DEPT-IT-001     → dept.it@gramedia.co.id");
  console.log("   • DEPT-ACC-001    → dept.accounting@gramedia.co.id");
  console.log("   • DEPT-EDIT-001   → dept.editorial@gramedia.co.id");
  console.log("   • DEPT-AUDIT-001  → dept.audit@gramedia.co.id\n");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
