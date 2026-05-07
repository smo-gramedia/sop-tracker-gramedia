// prisma/seed-dummy-sops.ts
// ═══════════════════════════════════════════════════════════════════
// Dummy SOPs Seed Script
// ───────────────────────────────────────────────────────────────────
// Tujuan: populate banyak dokumen SOP untuk semua kategori,
// supaya halaman SOP listing & Juklak bisa di-test dengan data realistis.
//
// Cara jalankan:
//   npx tsx prisma/seed-dummy-sops.ts
//
// Idempotent: Aman dijalankan berulang kali (pakai upsert by kode).
// ═══════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding dummy SOPs...\n");

  // ─── Get superadmin sebagai uploader ────────────────────────────
  const superadmin = await prisma.user.findFirst({
    where: { role: "superadmin" },
    select: { id: true },
  });
  if (!superadmin) {
    throw new Error(
      "Superadmin not found. Jalankan seed utama dulu: npx tsx prisma/seed.ts"
    );
  }

  // ─── Get departments by code ────────────────────────────────────
  const allDepts = await prisma.department.findMany({
    select: { id: true, kode: true, nama: true },
  });
  const deptMap = Object.fromEntries(allDepts.map((d) => [d.kode, d]));

  // Required departments
  const required = ["STOR", "GCOM", "EDIT", "FIN", "HROP", "SMO"];
  const missing = required.filter((k) => !deptMap[k]);
  if (missing.length > 0) {
    throw new Error(
      `Departments missing: ${missing.join(
        ", "
      )}. Jalankan seed utama dulu: npx tsx prisma/seed.ts`
    );
  }

  // ─── Get/create subcategories untuk SOP General ─────────────────
  console.log("→ Subcategories for SOP General...");
  const subcatHRGA = await prisma.sopSubcategory.upsert({
    where: { kode: "HRGA" },
    update: {},
    create: {
      kode: "HRGA",
      nama: "HR & General Affairs",
      deskripsi: "Kebijakan HR, GA, dan urusan umum karyawan",
    },
  });
  const subcatFIN = await prisma.sopSubcategory.upsert({
    where: { kode: "FINGEN" },
    update: {},
    create: {
      kode: "FINGEN",
      nama: "Finance General",
      deskripsi: "Kebijakan keuangan umum",
    },
  });
  const subcatIT = await prisma.sopSubcategory.upsert({
    where: { kode: "ITGEN" },
    update: {},
    create: {
      kode: "ITGEN",
      nama: "IT & Security",
      deskripsi: "Kebijakan IT, keamanan data, dan infrastruktur",
    },
  });
  console.log("  ✓ 3 subcategories\n");

  // ═══════════════════════════════════════════════════════════════
  // SOP DATA — 10+ per kategori
  // ═══════════════════════════════════════════════════════════════

  type SopSeed = {
    kode: string;
    judul: string;
    deskripsi: string;
    tipe: "MP" | "PS" | "IK" | "petunjuk";
    versi: string;
    tanggalBerlaku: Date;
    departmentId?: string;
    subcategoryId?: string;
  };

  const today = new Date();
  const dt = (offset: number) =>
    new Date(today.getFullYear(), today.getMonth() - offset, 1);

  // ─── 1. SOP OPERATION (sr) — Retail/Store Operations ────────────
  const sopOperation: SopSeed[] = [
    {
      kode: "MP/STOR/02",
      judul: "Stock Opname Bulanan",
      deskripsi:
        "Prosedur penghitungan dan pencocokan stok fisik dengan sistem secara berkala di toko Gramedia.",
      tipe: "MP",
      versi: "Revisi-1",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["STOR"].id,
    },
    {
      kode: "MP/STOR/03",
      judul: "Penanganan Komplain Pelanggan",
      deskripsi:
        "Standar operasional untuk menerima, mencatat, dan menindaklanjuti komplain dari pelanggan toko.",
      tipe: "MP",
      versi: "Original",
      tanggalBerlaku: dt(4),
      departmentId: deptMap["STOR"].id,
    },
    {
      kode: "PS/STOR/01",
      judul: "Standar Layanan Kasir",
      deskripsi:
        "Panduan etika, kecepatan, dan akurasi proses transaksi di kasir toko Gramedia.",
      tipe: "PS",
      versi: "Revisi-2",
      tanggalBerlaku: dt(1),
      departmentId: deptMap["STOR"].id,
    },
    {
      kode: "IK/STOR/01",
      judul: "Display Buku Pojok New Arrival",
      deskripsi:
        "Instruksi kerja penataan buku terbitan baru di pojok New Arrival sesuai standar visual merchandising.",
      tipe: "IK",
      versi: "Original",
      tanggalBerlaku: dt(3),
      departmentId: deptMap["STOR"].id,
    },
    {
      kode: "IK/STOR/02",
      judul: "Pembukaan dan Penutupan Toko",
      deskripsi:
        "Checklist harian aktivitas pembukaan toko di pagi hari dan penutupan toko di malam hari.",
      tipe: "IK",
      versi: "Revisi-1",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["STOR"].id,
    },
    {
      kode: "MP/GCOM/01",
      judul: "Proses Order Online Gramedia.com",
      deskripsi:
        "Alur pemrosesan pesanan online dari penerimaan order, picking, packing, hingga shipping.",
      tipe: "MP",
      versi: "Revisi-3",
      tanggalBerlaku: dt(1),
      departmentId: deptMap["GCOM"].id,
    },
    {
      kode: "MP/GCOM/02",
      judul: "Pengelolaan Refund & Return Online",
      deskripsi:
        "Prosedur penerimaan permintaan refund dan return dari pelanggan e-commerce Gramedia.com.",
      tipe: "MP",
      versi: "Original",
      tanggalBerlaku: dt(5),
      departmentId: deptMap["GCOM"].id,
    },
    {
      kode: "PS/GCOM/01",
      judul: "Standar Promosi Flash Sale",
      deskripsi:
        "Panduan strategi, durasi, dan pricing untuk pelaksanaan flash sale di Gramedia.com.",
      tipe: "PS",
      versi: "Revisi-1",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["GCOM"].id,
    },
    {
      kode: "IK/GCOM/01",
      judul: "Update Harga Produk di Sistem",
      deskripsi:
        "Instruksi langkah-langkah update harga jual produk di backend Gramedia.com.",
      tipe: "IK",
      versi: "Original",
      tanggalBerlaku: dt(3),
      departmentId: deptMap["GCOM"].id,
    },
    {
      kode: "MP/STOR/04",
      judul: "Penerimaan Barang dari Distributor",
      deskripsi:
        "Prosedur penerimaan, pemeriksaan, dan input barang masuk dari distributor ke gudang toko.",
      tipe: "MP",
      versi: "Revisi-1",
      tanggalBerlaku: dt(4),
      departmentId: deptMap["STOR"].id,
    },
    {
      kode: "PS/STOR/02",
      judul: "Standar Kebersihan & Keamanan Toko",
      deskripsi:
        "Panduan pemeliharaan kebersihan, keamanan, dan kerapihan area toko untuk pengalaman belanja optimal.",
      tipe: "PS",
      versi: "Original",
      tanggalBerlaku: dt(6),
      departmentId: deptMap["STOR"].id,
    },
  ];

  // ─── 2. SOP SUPPORTING UNIT (ss) — Finance, HR ──────────────────
  const sopSupporting: SopSeed[] = [
    {
      kode: "MP/FIN/01",
      judul: "Pembayaran Tagihan PO",
      deskripsi:
        "Prosedur verifikasi dan pembayaran tagihan Purchase Order dari vendor mitra.",
      tipe: "MP",
      versi: "Revisi-2",
      tanggalBerlaku: dt(1),
      departmentId: deptMap["FIN"].id,
    },
    {
      kode: "MP/FIN/02",
      judul: "Reimbursement Karyawan",
      deskripsi:
        "Alur pengajuan, verifikasi, dan pencairan reimbursement biaya operasional karyawan.",
      tipe: "MP",
      versi: "Original",
      tanggalBerlaku: dt(3),
      departmentId: deptMap["FIN"].id,
    },
    {
      kode: "PS/FIN/01",
      judul: "Standar Pelaporan Keuangan Bulanan",
      deskripsi:
        "Panduan format dan timeline pelaporan keuangan bulanan ke management.",
      tipe: "PS",
      versi: "Revisi-1",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["FIN"].id,
    },
    {
      kode: "IK/FIN/01",
      judul: "Posting Jurnal Penjualan Harian",
      deskripsi:
        "Instruksi kerja posting jurnal penjualan dari sistem POS ke sistem akuntansi.",
      tipe: "IK",
      versi: "Original",
      tanggalBerlaku: dt(4),
      departmentId: deptMap["FIN"].id,
    },
    {
      kode: "MP/HROP/01",
      judul: "Onboarding Karyawan Baru",
      deskripsi:
        "Prosedur penerimaan dan pengenalan karyawan baru di hari pertama kerja.",
      tipe: "MP",
      versi: "Revisi-3",
      tanggalBerlaku: dt(1),
      departmentId: deptMap["HROP"].id,
    },
    {
      kode: "MP/HROP/02",
      judul: "Proses Cuti Tahunan Karyawan",
      deskripsi:
        "Alur pengajuan, persetujuan, dan pencatatan cuti tahunan karyawan.",
      tipe: "MP",
      versi: "Original",
      tanggalBerlaku: dt(5),
      departmentId: deptMap["HROP"].id,
    },
    {
      kode: "PS/HROP/01",
      judul: "Standar Penilaian Kinerja",
      deskripsi:
        "Panduan kriteria, periode, dan metode penilaian kinerja karyawan tahunan.",
      tipe: "PS",
      versi: "Revisi-1",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["HROP"].id,
    },
    {
      kode: "IK/HROP/01",
      judul: "Update Data Karyawan di HRIS",
      deskripsi:
        "Instruksi kerja update data master karyawan di sistem HRIS perusahaan.",
      tipe: "IK",
      versi: "Original",
      tanggalBerlaku: dt(3),
      departmentId: deptMap["HROP"].id,
    },
    {
      kode: "MP/HROP/03",
      judul: "Exit Interview Karyawan",
      deskripsi:
        "Prosedur wawancara perpisahan dengan karyawan yang mengundurkan diri.",
      tipe: "MP",
      versi: "Original",
      tanggalBerlaku: dt(6),
      departmentId: deptMap["HROP"].id,
    },
    {
      kode: "MP/FIN/03",
      judul: "Closing Periode Akuntansi",
      deskripsi:
        "Alur kegiatan tutup buku akhir bulan dan akhir tahun fiskal perusahaan.",
      tipe: "MP",
      versi: "Revisi-2",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["FIN"].id,
    },
    {
      kode: "IK/FIN/02",
      judul: "Rekonsiliasi Bank Harian",
      deskripsi:
        "Instruksi kerja rekonsiliasi mutasi rekening bank dengan kas perusahaan.",
      tipe: "IK",
      versi: "Original",
      tanggalBerlaku: dt(4),
      departmentId: deptMap["FIN"].id,
    },
  ];

  // ─── 3. SOP PUBLISHING & EDUCATION (sp) ──────────────────────────
  const sopPublishing: SopSeed[] = [
    {
      kode: "MP/EDIT/01",
      judul: "Akuisisi Naskah Penulis Baru",
      deskripsi:
        "Prosedur penerimaan, review, dan kontrak naskah dari penulis pemula.",
      tipe: "MP",
      versi: "Revisi-1",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["EDIT"].id,
    },
    {
      kode: "MP/EDIT/02",
      judul: "Editing & Proofreading Naskah",
      deskripsi:
        "Alur editing substantif, copy editing, dan proofreading naskah sebelum cetak.",
      tipe: "MP",
      versi: "Revisi-2",
      tanggalBerlaku: dt(1),
      departmentId: deptMap["EDIT"].id,
    },
    {
      kode: "MP/EDIT/03",
      judul: "Pengelolaan Royalty Penulis",
      deskripsi:
        "Prosedur perhitungan, laporan, dan pembayaran royalty kepada penulis berdasarkan penjualan.",
      tipe: "MP",
      versi: "Original",
      tanggalBerlaku: dt(3),
      departmentId: deptMap["EDIT"].id,
    },
    {
      kode: "PS/EDIT/01",
      judul: "Standar Cover Buku",
      deskripsi:
        "Panduan desain, tipografi, dan elemen visual cover buku terbitan Gramedia.",
      tipe: "PS",
      versi: "Revisi-1",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["EDIT"].id,
    },
    {
      kode: "PS/EDIT/02",
      judul: "Standar ISBN & Hak Cipta",
      deskripsi:
        "Panduan pengurusan ISBN, registrasi hak cipta, dan legal naskah.",
      tipe: "PS",
      versi: "Original",
      tanggalBerlaku: dt(4),
      departmentId: deptMap["EDIT"].id,
    },
    {
      kode: "IK/EDIT/01",
      judul: "Layouting Naskah dengan InDesign",
      deskripsi:
        "Instruksi kerja proses layout naskah cetak menggunakan Adobe InDesign.",
      tipe: "IK",
      versi: "Original",
      tanggalBerlaku: dt(3),
      departmentId: deptMap["EDIT"].id,
    },
    {
      kode: "IK/EDIT/02",
      judul: "Submit Naskah ke Percetakan",
      deskripsi:
        "Instruksi packaging file final naskah dan koordinasi dengan vendor percetakan.",
      tipe: "IK",
      versi: "Revisi-1",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["EDIT"].id,
    },
    {
      kode: "MP/EDIT/04",
      judul: "Promosi Buku Baru",
      deskripsi:
        "Prosedur perencanaan dan eksekusi kampanye promosi peluncuran buku baru.",
      tipe: "MP",
      versi: "Original",
      tanggalBerlaku: dt(5),
      departmentId: deptMap["EDIT"].id,
    },
    {
      kode: "PS/EDIT/03",
      judul: "Standar Penyusunan Sinopsis",
      deskripsi:
        "Panduan format dan gaya bahasa penulisan sinopsis di belakang cover buku.",
      tipe: "PS",
      versi: "Original",
      tanggalBerlaku: dt(6),
      departmentId: deptMap["EDIT"].id,
    },
    {
      kode: "MP/EDIT/05",
      judul: "Reprint Buku Best Seller",
      deskripsi:
        "Alur evaluasi, penjadwalan, dan eksekusi cetak ulang buku best seller.",
      tipe: "MP",
      versi: "Revisi-1",
      tanggalBerlaku: dt(3),
      departmentId: deptMap["EDIT"].id,
    },
    {
      kode: "IK/EDIT/03",
      judul: "Input Metadata Buku ke Sistem",
      deskripsi:
        "Instruksi kerja input metadata buku (judul, ISBN, kategori) ke sistem inventory.",
      tipe: "IK",
      versi: "Original",
      tanggalBerlaku: dt(4),
      departmentId: deptMap["EDIT"].id,
    },
  ];

  // ─── 4. SOP GENERAL (sg) — Cross-divisional, pakai subcategory ───
  const sopGeneral: SopSeed[] = [
    {
      kode: "MP/GEN/01",
      judul: "Penggunaan Email Korporat",
      deskripsi:
        "Pedoman umum penggunaan email korporat untuk komunikasi bisnis dan personal.",
      tipe: "MP",
      versi: "Revisi-2",
      tanggalBerlaku: dt(1),
      subcategoryId: subcatIT.id,
    },
    {
      kode: "MP/GEN/02",
      judul: "Kebijakan Keamanan Password",
      deskripsi:
        "Standar pembuatan, penyimpanan, dan rotasi password untuk semua sistem internal.",
      tipe: "MP",
      versi: "Revisi-1",
      tanggalBerlaku: dt(2),
      subcategoryId: subcatIT.id,
    },
    {
      kode: "PS/GEN/01",
      judul: "Standar Backup Data Karyawan",
      deskripsi:
        "Panduan backup berkala data kerja karyawan ke server perusahaan.",
      tipe: "PS",
      versi: "Original",
      tanggalBerlaku: dt(3),
      subcategoryId: subcatIT.id,
    },
    {
      kode: "MP/GEN/03",
      judul: "Pengajuan Cuti Khusus",
      deskripsi:
        "Prosedur pengajuan cuti khusus seperti cuti melahirkan, sakit panjang, dan ibadah.",
      tipe: "MP",
      versi: "Revisi-1",
      tanggalBerlaku: dt(2),
      subcategoryId: subcatHRGA.id,
    },
    {
      kode: "PS/GEN/02",
      judul: "Code of Conduct Karyawan",
      deskripsi:
        "Kode etik dan tata laku karyawan dalam berinteraksi di lingkungan kerja.",
      tipe: "PS",
      versi: "Original",
      tanggalBerlaku: dt(6),
      subcategoryId: subcatHRGA.id,
    },
    {
      kode: "PS/GEN/03",
      judul: "Standar Berpakaian (Dress Code)",
      deskripsi:
        "Panduan dress code karyawan untuk hari kerja, casual day, dan acara formal.",
      tipe: "PS",
      versi: "Original",
      tanggalBerlaku: dt(4),
      subcategoryId: subcatHRGA.id,
    },
    {
      kode: "IK/GEN/01",
      judul: "Pengajuan Reimbursement Transport",
      deskripsi:
        "Instruksi pengajuan reimbursement biaya transportasi kerja melalui sistem.",
      tipe: "IK",
      versi: "Original",
      tanggalBerlaku: dt(3),
      subcategoryId: subcatFIN.id,
    },
    {
      kode: "MP/GEN/04",
      judul: "Pengelolaan Aset IT Karyawan",
      deskripsi:
        "Prosedur pemberian, pemeliharaan, dan penyerahan kembali laptop/handphone karyawan.",
      tipe: "MP",
      versi: "Revisi-1",
      tanggalBerlaku: dt(2),
      subcategoryId: subcatIT.id,
    },
    {
      kode: "PS/GEN/04",
      judul: "Standar Anti Korupsi & Gratifikasi",
      deskripsi:
        "Kebijakan anti korupsi, gratifikasi, dan benturan kepentingan karyawan.",
      tipe: "PS",
      versi: "Revisi-1",
      tanggalBerlaku: dt(5),
      subcategoryId: subcatHRGA.id,
    },
    {
      kode: "MP/GEN/05",
      judul: "Pelaporan Keluhan Whistleblower",
      deskripsi:
        "Saluran dan prosedur pelaporan pelanggaran etika atau hukum oleh karyawan.",
      tipe: "MP",
      versi: "Original",
      tanggalBerlaku: dt(4),
      subcategoryId: subcatHRGA.id,
    },
    {
      kode: "IK/GEN/02",
      judul: "Akses VPN ke Jaringan Internal",
      deskripsi:
        "Instruksi konfigurasi VPN untuk akses jaringan internal dari remote.",
      tipe: "IK",
      versi: "Original",
      tanggalBerlaku: dt(3),
      subcategoryId: subcatIT.id,
    },
    {
      kode: "PS/GEN/05",
      judul: "Standar Penggunaan Logo Perusahaan",
      deskripsi:
        "Panduan penggunaan logo, font, dan warna corporate identity Gramedia.",
      tipe: "PS",
      versi: "Original",
      tanggalBerlaku: dt(7),
      subcategoryId: subcatHRGA.id,
    },
  ];

  // ─── 5. PETUNJUK PELAKSANAAN (petunjuk) ──────────────────────────
  const sopPetunjuk: SopSeed[] = [
    {
      kode: "PND/SMO/01",
      judul: "Petunjuk Penyusunan KPI Unit",
      deskripsi:
        "Panduan teknis penyusunan Key Performance Indicators di level unit kerja.",
      tipe: "petunjuk",
      versi: "Original",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["SMO"].id,
    },
    {
      kode: "PND/SMO/02",
      judul: "Petunjuk Cascading KPI",
      deskripsi:
        "Panduan menurunkan KPI dari Directorate ke Division, Department, dan Individu.",
      tipe: "petunjuk",
      versi: "Revisi-1",
      tanggalBerlaku: dt(3),
      departmentId: deptMap["SMO"].id,
    },
    {
      kode: "PND/SMO/03",
      judul: "Petunjuk Review Bulanan KPI",
      deskripsi:
        "Format dan cara melaksanakan review pencapaian KPI secara bulanan.",
      tipe: "petunjuk",
      versi: "Original",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["SMO"].id,
    },
    {
      kode: "PND/SMO/04",
      judul: "Petunjuk Champion Team Bisnis",
      deskripsi:
        "Cara membentuk dan mengelola Champion Team untuk inisiatif strategis.",
      tipe: "petunjuk",
      versi: "Revisi-2",
      tanggalBerlaku: dt(1),
      departmentId: deptMap["SMO"].id,
    },
    {
      kode: "PND/SMO/05",
      judul: "Petunjuk Penyusunan Business Plan",
      deskripsi:
        "Petunjuk teknis penyusunan Business Plan tahunan tingkat Directorate.",
      tipe: "petunjuk",
      versi: "Original",
      tanggalBerlaku: dt(5),
      departmentId: deptMap["SMO"].id,
    },
    {
      kode: "PND/STOR/01",
      judul: "Petunjuk Pembukaan Toko Baru",
      deskripsi:
        "Panduan teknis pembukaan toko Gramedia baru, dari survei lokasi hingga grand opening.",
      tipe: "petunjuk",
      versi: "Original",
      tanggalBerlaku: dt(4),
      departmentId: deptMap["STOR"].id,
    },
    {
      kode: "PND/HROP/01",
      judul: "Petunjuk Rekrutmen Karyawan",
      deskripsi:
        "Panduan teknis proses rekrutmen dari posting lowongan hingga penerbitan offering letter.",
      tipe: "petunjuk",
      versi: "Revisi-1",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["HROP"].id,
    },
    {
      kode: "PND/HROP/02",
      judul: "Petunjuk Pelatihan Internal",
      deskripsi:
        "Panduan penyelenggaraan training, workshop, dan seminar internal karyawan.",
      tipe: "petunjuk",
      versi: "Original",
      tanggalBerlaku: dt(3),
      departmentId: deptMap["HROP"].id,
    },
    {
      kode: "PND/FIN/01",
      judul: "Petunjuk Penyusunan Anggaran Tahunan",
      deskripsi:
        "Panduan teknis penyusunan anggaran tahunan tiap unit kerja.",
      tipe: "petunjuk",
      versi: "Revisi-1",
      tanggalBerlaku: dt(4),
      departmentId: deptMap["FIN"].id,
    },
    {
      kode: "PND/EDIT/01",
      judul: "Petunjuk Editing Buku Anak",
      deskripsi:
        "Panduan khusus editing dan layouting buku anak dengan ilustrasi.",
      tipe: "petunjuk",
      versi: "Original",
      tanggalBerlaku: dt(2),
      departmentId: deptMap["EDIT"].id,
    },
    {
      kode: "PND/GCOM/01",
      judul: "Petunjuk Penanganan Komplain Online",
      deskripsi:
        "Panduan eskalasi komplain pelanggan e-commerce sesuai tingkat keparahan.",
      tipe: "petunjuk",
      versi: "Revisi-1",
      tanggalBerlaku: dt(3),
      departmentId: deptMap["GCOM"].id,
    },
  ];

  // ═══════════════════════════════════════════════════════════════
  // INSERT SOPs
  // ═══════════════════════════════════════════════════════════════

  async function insertCategory(
    label: string,
    kategori: "sr" | "ss" | "sp" | "sg" | "petunjuk",
    sops: SopSeed[]
  ) {
    console.log(`→ ${label}...`);
    let count = 0;
    for (const sop of sops) {
      await prisma.sopDocument.upsert({
        where: { kode: sop.kode },
        update: {
          judul: sop.judul,
          deskripsi: sop.deskripsi,
        },
        create: {
          kode: sop.kode,
          judul: sop.judul,
          deskripsi: sop.deskripsi,
          kategori,
          tipe: sop.tipe,
          versi: sop.versi,
          tanggalBerlaku: sop.tanggalBerlaku,
          status: "aktif",
          uploadedById: superadmin.id,
          departmentId: sop.departmentId,
          subcategoryId: sop.subcategoryId,
        },
      });
      count++;
    }
    console.log(`  ✓ ${count} dokumen\n`);
    return count;
  }

  const total =
    (await insertCategory("SOP Operation (sr)", "sr", sopOperation)) +
    (await insertCategory("SOP Supporting Unit (ss)", "ss", sopSupporting)) +
    (await insertCategory(
      "SOP Publishing & Education (sp)",
      "sp",
      sopPublishing
    )) +
    (await insertCategory("SOP General (sg)", "sg", sopGeneral)) +
    (await insertCategory(
      "Petunjuk Pelaksanaan (petunjuk)",
      "petunjuk",
      sopPetunjuk
    ));

  console.log("═══════════════════════════════════════════════════════");
  console.log(`✅ Selesai! Total ${total} dummy SOP documents berhasil dibuat.`);
  console.log("═══════════════════════════════════════════════════════\n");
  console.log("Cek hasilnya:");
  console.log("  • /sop/sr        — SOP Operation (11 dokumen)");
  console.log("  • /sop/ss        — SOP Supporting Unit (11 dokumen)");
  console.log("  • /sop/sp        — SOP Publishing & Education (11 dokumen)");
  console.log("  • /sop/sg        — SOP General (12 dokumen, 3 subkategori)");
  console.log("  • /sop/petunjuk  — Petunjuk Pelaksanaan (11 dokumen)\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
