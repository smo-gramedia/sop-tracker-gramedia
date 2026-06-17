// src/app/api/post-test/[id]/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Fetch post test + all results
    const postTest = await prisma.postTest.findUnique({
      where: { id },
      include: {
        sopDocument: {
          select: {
            kode: true,
            judul: true,
            kategori: true,
            department: { select: { nama: true } },
          },
        },
        questions: { select: { id: true } },
        results: {
          orderBy: [{ userId: "asc" }, { attemptNumber: "asc" }],
          include: {
            user: {
              select: {
                kodeUser: true,
                tipeUser: true,
                nama: true,
                unit: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!postTest) {
      return NextResponse.json(
        { error: "Post test tidak ditemukan" },
        { status: 404 }
      );
    }

    if (postTest.results.length === 0) {
      return NextResponse.json(
        { error: "Belum ada pengerjaan untuk di-export" },
        { status: 400 }
      );
    }

    const totalQuestions = postTest.questions.length;

    // Kategori label
    const kategoriLabels: Record<string, string> = {
      sr: "SOP Operation",
      ss: "SOP Supporting Unit",
      sp: "SOP Publishing",
      sg: "SOP General",
      petunjuk: "Petunjuk Pelaksanaan",
    };

    const tipeLabels: Record<string, string> = {
      store: "Store",
      department: "Department",
    };

    // ─── Helper: format date Indonesia ────────────────────────────────
    const formatDate = (date: Date | null) =>
      date
        ? new Date(date).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";

    const formatStatus = (status: string) =>
      status === "lulus" ? "Lulus" : "Tidak Lulus";

    const formatTipeUser = (tipe: string | null) =>
      tipe ? tipeLabels[tipe] ?? tipe : "—";

    // ─── Build workbook ───────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Gramedia SOP Tracker";
    workbook.created = new Date();

    // ────────────────────────────────────────────────────────────────
    // Sheet 1: Info SOP (header info)
    // ────────────────────────────────────────────────────────────────
    const infoSheet = workbook.addWorksheet("Info SOP");
    infoSheet.columns = [{ width: 22 }, { width: 60 }];

    const infoRows: [string, string | number][] = [
      ["Kode SOP", postTest.sopDocument.kode],
      ["Judul SOP", postTest.sopDocument.judul],
      [
        "Kategori",
        kategoriLabels[postTest.sopDocument.kategori] ??
          postTest.sopDocument.kategori,
      ],
      ["Departemen", postTest.sopDocument.department?.nama ?? "—"],
      ["", ""],
      ["Total Soal", totalQuestions],
      ["Passing Grade", postTest.passingGrade],
      ["Durasi (menit)", postTest.durasiMenit],
      ["", ""],
      ["Total Pengerjaan", postTest.results.length],
      ["Unique User", new Set(postTest.results.map((r) => r.userId)).size],
      ["Lulus", postTest.results.filter((r) => r.status === "lulus").length],
      [
        "Tidak Lulus",
        postTest.results.filter((r) => r.status === "tidak_lulus").length,
      ],
      ["", ""],
      ["Tanggal Export", formatDate(new Date())],
      ["Di-export oleh", session.user.name ?? session.user.email ?? "Admin"],
    ];

    infoRows.forEach((row, idx) => {
      infoSheet.addRow(row);
      if (row[0]) {
        infoSheet.getCell(idx + 1, 1).font = { bold: true };
        infoSheet.getCell(idx + 1, 1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F4F6" },
        };
      }
    });

    // ────────────────────────────────────────────────────────────────
    // Sheet 2: Summary — latest result per user + total attempts
    // ────────────────────────────────────────────────────────────────
    const summarySheet = workbook.addWorksheet("Summary Per Unit");

    // ────────────────────────────────────────────────────────────────
    // Group by unit kerja (userId) — untuk summary compliance rate
    // ────────────────────────────────────────────────────────────────
    const byUnit: Record<
      string,
      {
        user: (typeof postTest.results)[0]["user"];
        userId: string;
        totalKaryawan: number;
        lulusCount: number;
        tidakLulusCount: number;
        complianceRate: number;
        latestAt: Date;
      }
    > = {};

    postTest.results.forEach((r) => {
      if (!byUnit[r.userId]) {
        byUnit[r.userId] = {
          user: r.user,
          userId: r.userId,
          totalKaryawan: 0,
          lulusCount: 0,
          tidakLulusCount: 0,
          complianceRate: 0,
          latestAt: r.dikerjakanAt,
        };
      }
      const u = byUnit[r.userId];
      u.totalKaryawan += 1;
      if (r.status === "lulus") u.lulusCount += 1;
      else u.tidakLulusCount += 1;
      if (r.dikerjakanAt > u.latestAt) u.latestAt = r.dikerjakanAt;
    });

    const unitSummaries = Object.values(byUnit).map((u) => ({
      ...u,
      complianceRate:
        u.totalKaryawan > 0
          ? Math.round((u.lulusCount / u.totalKaryawan) * 100)
          : 0,
    }));

    summarySheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Kode User", key: "kodeUser", width: 18 },
      { header: "Tipe", key: "tipeUser", width: 12 },
      { header: "Nama Unit Kerja", key: "nama", width: 28 },
      { header: "Unit", key: "unit", width: 18 },
      { header: "Email", key: "email", width: 30 },
      { header: "Karyawan Ikut", key: "totalKaryawan", width: 14 },
      { header: "Lulus", key: "lulusCount", width: 10 },
      { header: "Tidak Lulus", key: "tidakLulusCount", width: 12 },
      { header: "Compliance Rate (%)", key: "complianceRate", width: 18 },
      { header: "Update Terakhir", key: "latestAt", width: 18 },
    ];

    unitSummaries.forEach((u, idx) => {
      summarySheet.addRow({
        no: idx + 1,
        kodeUser: u.user.kodeUser,
        tipeUser: formatTipeUser(u.user.tipeUser),
        nama: u.user.nama,
        unit: u.user.unit ?? "—",
        email: u.user.email,
        totalKaryawan: u.totalKaryawan,
        lulusCount: u.lulusCount,
        tidakLulusCount: u.tidakLulusCount,
        complianceRate: u.complianceRate,
        latestAt: formatDate(u.latestAt),
      });
    });

    // Status column for Summary — no fixed status col, just header style
    styleSheet(summarySheet, unitSummaries.length, 0); // 0 = no color-coding

    // ────────────────────────────────────────────────────────────────
    // Sheet: Detail Per Karyawan — list semua submission dengan NIK + Nama
    // ────────────────────────────────────────────────────────────────
    const detailSheet = workbook.addWorksheet("Detail Per Karyawan");

    detailSheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "NIK", key: "nik", width: 12 },
      { header: "Nama Karyawan", key: "namaKaryawan", width: 28 },
      { header: "Kode Unit Kerja", key: "kodeUser", width: 18 },
      { header: "Nama Unit Kerja", key: "nama", width: 28 },
      { header: "Unit", key: "unit", width: 18 },
      { header: "Skor", key: "skor", width: 8 },
      { header: "Jawaban Benar", key: "benar", width: 13 },
      { header: "Jawaban Salah", key: "salah", width: 13 },
      { header: "Status", key: "status", width: 13 },
      { header: "Tanggal Pengerjaan", key: "dikerjakanAt", width: 18 },
      { header: "Tanggal Selesai", key: "selesaiAt", width: 18 },
    ];

    // Sort by tanggal desc (paling baru di atas)
    const sortedDetail = [...postTest.results].sort(
      (a, b) =>
        new Date(b.dikerjakanAt).getTime() -
        new Date(a.dikerjakanAt).getTime()
    );

    sortedDetail.forEach((r, idx) => {
      detailSheet.addRow({
        no: idx + 1,
        nik: r.nikKaryawan,
        namaKaryawan: r.namaKaryawan,
        kodeUser: r.user.kodeUser,
        nama: r.user.nama,
        unit: r.user.unit ?? "—",
        skor: r.skor,
        benar: `${r.jumlahBenar}/${totalQuestions}`,
        salah: r.jumlahSalah,
        status: formatStatus(r.status),
        dikerjakanAt: formatDate(r.dikerjakanAt),
        selesaiAt: formatDate(r.selesaiAt),
      });
    });

    // Status column for Detail = col 10
    styleSheet(detailSheet, sortedDetail.length, 10);

    // ─── Generate file ────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const safeKode = postTest.sopDocument.kode.replace(/\//g, "-");
    const dateStr = new Date().toISOString().slice(0, 10);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="post-test-${safeKode}-${dateStr}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("[Export Post Test Error]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal generate Excel file",
      },
      { status: 500 }
    );
  }
}

// ─── Helper: style sheet (header + status color + border) ─────────────
function styleSheet(
  sheet: ExcelJS.Worksheet,
  dataRowCount: number,
  statusColIdx: number
) {
  // Header styling
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  headerRow.height = 22;

  // Color code Status column (skip kalau statusColIdx === 0)
  if (statusColIdx > 0) {
    for (let r = 2; r <= dataRowCount + 1; r++) {
      const cell = sheet.getCell(r, statusColIdx);
      const value = String(cell.value ?? "");
      let fillColor: string | null = null;
      if (value === "Lulus") fillColor = "FFD1FAE5";
      else if (value === "Tidak Lulus") fillColor = "FFFEE2E2";
      if (fillColor) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: fillColor },
        };
        cell.font = { bold: true };
      }
    }
  }

  // Auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length },
  };

  // Freeze header
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // Border all data cells
  const lastRow = dataRowCount + 1;
  const lastCol = sheet.columns.length;
  for (let r = 1; r <= lastRow; r++) {
    for (let c = 1; c <= lastCol; c++) {
      const cell = sheet.getCell(r, c);
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    }
  }
}
