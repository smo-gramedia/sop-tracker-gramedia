// src/app/api/attachment/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data untuk di-export" },
        { status: 400 }
      );
    }

    // Fetch attachments lengkap
    const attachments = await prisma.sosialisasiAttachment.findMany({
      where: { id: { in: ids } },
      orderBy: { uploadedAt: "desc" },
      include: {
        user: {
          select: {
            kodeUser: true,
            tipeUser: true,
            nama: true,
            email: true,
            unit: true,
          },
        },
        sopDocument: {
          select: {
            kode: true,
            judul: true,
            kategori: true,
            department: { select: { nama: true } },
          },
        },
        reviewedBy: { select: { nama: true } },
      },
    });

    // Build Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Gramedia SOP Tracker";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Attachment Sosialisasi");

    // Header row
    sheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Kode User", key: "kodeUser", width: 18 },
      { header: "Tipe", key: "tipeUser", width: 12 },
      { header: "Nama Unit Kerja", key: "nama", width: 28 },
      { header: "Email", key: "email", width: 30 },
      { header: "Unit", key: "unit", width: 18 },
      { header: "Kode SOP", key: "kodeSop", width: 16 },
      { header: "Judul SOP", key: "judulSop", width: 35 },
      { header: "Kategori", key: "kategori", width: 18 },
      { header: "Departemen", key: "departemen", width: 22 },
      { header: "Status", key: "status", width: 12 },
      { header: "Upload ke-", key: "uploadKe", width: 11 },
      { header: "Tanggal Upload", key: "uploadedAt", width: 18 },
      { header: "Direview oleh", key: "reviewedBy", width: 22 },
      { header: "Tanggal Review", key: "reviewedAt", width: 18 },
      { header: "Alasan Tolak", key: "alasanTolak", width: 40 },
    ];

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F2937" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "left" };
    headerRow.height = 22;

    // Label mappings
    const kategoriLabels: Record<string, string> = {
      sr: "SOP Operation",
      ss: "SOP Supporting Unit",
      sp: "SOP Publishing",
      sg: "SOP General",
      petunjuk: "Petunjuk Pelaksanaan",
    };
    const statusLabels: Record<string, string> = {
      menunggu: "Menunggu",
      disetujui: "Disetujui",
      ditolak: "Ditolak",
      pending: "Pending",
    };
    const tipeLabels: Record<string, string> = {
      store: "Store",
      department: "Department",
    };

    // Data rows
    attachments.forEach((att, idx) => {
      sheet.addRow({
        no: idx + 1,
        kodeUser: att.user.kodeUser,
        tipeUser: att.user.tipeUser
          ? tipeLabels[att.user.tipeUser] ?? att.user.tipeUser
          : "—",
        nama: att.user.nama,
        email: att.user.email,
        unit: att.user.unit ?? "—",
        kodeSop: att.sopDocument.kode,
        judulSop: att.sopDocument.judul,
        kategori:
          kategoriLabels[att.sopDocument.kategori] ?? att.sopDocument.kategori,
        departemen: att.sopDocument.department?.nama ?? "—",
        status: statusLabels[att.status] ?? att.status,
        uploadKe: att.uploadKe,
        uploadedAt: att.uploadedAt
          ? new Date(att.uploadedAt).toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
        reviewedBy: att.reviewedBy?.nama ?? "—",
        reviewedAt: att.reviewedAt
          ? new Date(att.reviewedAt).toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
        alasanTolak: att.alasanTolak ?? "",
      });
    });

    // Color code status column (now col 11)
    const statusColIdx = 11;
    for (let r = 2; r <= attachments.length + 1; r++) {
      const cell = sheet.getCell(r, statusColIdx);
      const value = String(cell.value ?? "");
      let fillColor: string | null = null;
      if (value === "Menunggu") fillColor = "FFFEF3C7";
      else if (value === "Disetujui") fillColor = "FFD1FAE5";
      else if (value === "Ditolak") fillColor = "FFFEE2E2";
      if (fillColor) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: fillColor },
        };
        cell.font = { bold: true };
      }
    }

    // Auto-filter on header
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columns.length },
    };

    // Freeze header row
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    // Border all cells with data
    const lastRow = attachments.length + 1;
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

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="attachment-sosialisasi-${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("[Export Attachment Error]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Gagal generate Excel file",
      },
      { status: 500 }
    );
  }
}
