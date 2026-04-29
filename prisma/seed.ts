import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Directorates ──────────────────────────────────────────────────────
  const cst = await prisma.directorate.upsert({
    where: { kode: "CST" },
    update: {},
    create: { kode: "CST", singkatan: "CST", nama: "Corporate Strategy & Technology Directorate", companyGroup: "Kompas Gramedia" },
  });
  const gorp = await prisma.directorate.upsert({
    where: { kode: "GORP" },
    update: {},
    create: { kode: "GORP", singkatan: "GoRP", nama: "Group of Retail & Publishing (GoRP)", companyGroup: "Kompas Gramedia" },
  });
  const fin = await prisma.directorate.upsert({
    where: { kode: "FA" },
    update: {},
    create: { kode: "FA", singkatan: "FA", nama: "Finance & Accounting Directorate", companyGroup: "Kompas Gramedia" },
  });
  const hc = await prisma.directorate.upsert({
    where: { kode: "HC" },
    update: {},
    create: { kode: "HC", singkatan: "HC", nama: "Human Capital Directorate", companyGroup: "Kompas Gramedia" },
  });
  console.log("✓ Directorates seeded");

  // ── Divisions ─────────────────────────────────────────────────────────
  const divCSSM = await prisma.division.upsert({
    where: { kode: "CSSM" },
    update: {},
    create: { kode: "CSSM", nama: "Corporate Sec. & Strategy Management Division", directorateId: cst.id },
  });
  const divIT = await prisma.division.upsert({
    where: { kode: "ITD" },
    update: {},
    create: { kode: "ITD", nama: "Information Technology Division", directorateId: cst.id },
  });
  const divRetail = await prisma.division.upsert({
    where: { kode: "RETL" },
    update: {},
    create: { kode: "RETL", nama: "Retail Division", directorateId: gorp.id },
  });
  const divPub = await prisma.division.upsert({
    where: { kode: "PED" },
    update: {},
    create: { kode: "PED", nama: "Publishing & Education Division", directorateId: gorp.id },
  });
  const divFin = await prisma.division.upsert({
    where: { kode: "FIND" },
    update: {},
    create: { kode: "FIND", nama: "Finance Division", directorateId: fin.id },
  });
  const divAcc = await prisma.division.upsert({
    where: { kode: "ACCD" },
    update: {},
    create: { kode: "ACCD", nama: "Accounting Division", directorateId: fin.id },
  });
  const divHR = await prisma.division.upsert({
    where: { kode: "HRD" },
    update: {},
    create: { kode: "HRD", nama: "Human Resources Division", directorateId: hc.id },
  });
  const divGA = await prisma.division.upsert({
    where: { kode: "GAD" },
    update: {},
    create: { kode: "GAD", nama: "General Affairs Division", directorateId: hc.id },
  });
  console.log("✓ Divisions seeded");

  // ── Departments ───────────────────────────────────────────────────────
  const deptSMO = await prisma.department.upsert({
    where: { kode: "SMO" },
    update: {},
    create: { kode: "SMO", nama: "SMO Department", divisionId: divCSSM.id },
  });
  await prisma.department.upsert({
    where: { kode: "ITIF" },
    update: {},
    create: { kode: "ITIF", nama: "IT Infrastructure Department", divisionId: divIT.id },
  });
  const deptStore = await prisma.department.upsert({
    where: { kode: "STOR" },
    update: {},
    create: { kode: "STOR", nama: "Store Operations Department", divisionId: divRetail.id },
  });
  await prisma.department.upsert({
    where: { kode: "GCOM" },
    update: {},
    create: { kode: "GCOM", nama: "Gramedia.com Department", divisionId: divRetail.id },
  });
  await prisma.department.upsert({
    where: { kode: "EDIT" },
    update: {},
    create: { kode: "EDIT", nama: "Editorial Department", divisionId: divPub.id },
  });
  const deptFin = await prisma.department.upsert({
    where: { kode: "FIN" },
    update: {},
    create: { kode: "FIN", nama: "Finance Department", divisionId: divFin.id },
  });
  await prisma.department.upsert({
    where: { kode: "HROP" },
    update: {},
    create: { kode: "HROP", nama: "HR Operations Department", divisionId: divHR.id },
  });
  console.log("✓ Departments seeded");

  // ── SOP Subcategories ─────────────────────────────────────────────────
  await prisma.sopSubcategory.upsert({
    where: { kode: "SMGR" },
    update: {},
    create: { kode: "SMGR", nama: "SOP Manager", deskripsi: "Panduan manajerial dan kepemimpinan untuk posisi manajer di seluruh unit Gramedia" },
  });
  await prisma.sopSubcategory.upsert({
    where: { kode: "SADF" },
    update: {},
    create: { kode: "SADF", nama: "SOP Administration - Financial", deskripsi: "Prosedur administrasi keuangan, pelaporan, dan tata kelola umum lintas divisi" },
  });
  console.log("✓ SOP Subcategories seeded");

  // ── Super Admin user ──────────────────────────────────────────────────
  const hash = await bcrypt.hash("Admin@123!", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@gramedia.co.id" },
    update: {},
    create: {
      kodeKaryawan: "SA-001",
      nama: "Super Admin",
      email: "superadmin@gramedia.co.id",
      passwordHash: hash,
      unit: "SMO",
      jabatan: "System Administrator",
      role: "superadmin",
      status: "aktif",
    },
  });
  console.log("✓ Super Admin seeded — email: superadmin@gramedia.co.id / pass: Admin@123!");

  // ── Sample SOP Document ───────────────────────────────────────────────
  const sampleSop = await prisma.sopDocument.upsert({
    where: { kode: "MP/FIN/01" },
    update: {},
    create: {
      kode: "MP/FIN/01",
      judul: "Pembayaran Tagihan PO",
      deskripsi: "Prosedur pembayaran tagihan purchase order kepada vendor sesuai ketentuan yang berlaku.",
      kategori: "ss",
      tipe: "MP",
      departmentId: deptFin.id,
      versi: "Original",
      status: "aktif",
      uploadedById: superAdmin.id,
    },
  });
  console.log("✓ Sample SOP seeded");

  // ── FAQs ──────────────────────────────────────────────────────────────
  const faqs = [
    { pertanyaan: "Apa itu SOP Tracker?", jawaban: "SOP Tracker adalah sistem manajemen pembelajaran SOP internal Kompas Gramedia yang memungkinkan karyawan mempelajari SOP secara terstruktur.", urutan: 1 },
    { pertanyaan: "Bagaimana cara memulai pembelajaran SOP?", jawaban: "Pilih SOP dari menu navigasi, kemudian klik tombol 'Pelajari' pada kartu SOP yang ingin dipelajari. Ikuti 7 langkah alur pembelajaran hingga selesai.", urutan: 2 },
    { pertanyaan: "Apa yang harus dilakukan setelah membaca SOP?", jawaban: "Setelah membaca dokumen SOP, Anda perlu mengupload foto atau dokumen sebagai bukti sosialisasi. Admin akan memverifikasi dan membuka akses Post Test.", urutan: 3 },
    { pertanyaan: "Berapa nilai minimum untuk lulus Post Test?", jawaban: "Nilai minimum kelulusan adalah 70 dari 100. Post Test terdiri dari 10 soal pilihan ganda dengan waktu pengerjaan 10 menit.", urutan: 4 },
  ];
  for (const faq of faqs) {
    await prisma.faqEntry.upsert({
      where: { id: `seed-faq-${faq.urutan}` },
      update: {},
      create: { id: `seed-faq-${faq.urutan}`, ...faq, createdById: superAdmin.id },
    });
  }
  console.log("✓ FAQs seeded");

  console.log("\n✅ Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
