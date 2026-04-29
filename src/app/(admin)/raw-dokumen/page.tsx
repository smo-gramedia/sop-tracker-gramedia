// src/app/(admin)/raw-dokumen/page.tsx
import { prisma } from "@/lib/prisma";
import { formatTanggal, formatFileSize } from "@/lib/utils";
import { SOP_KATEGORI_LABEL } from "@/lib/constants";

export default async function RawDokumenPage() {
  const rawDocs = await prisma.rawDocument.findMany({
    orderBy: { uploadedAt: "desc" },
    include: {
      sopDocument: {
        select: { kode: true, judul: true, kategori: true, department: { select: { nama: true } } },
      },
      uploadedBy: { select: { nama: true } },
    },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Manajemen Dokumen</p>
        <h1 className="font-display font-bold text-3xl mt-1">Raw Dokumen</h1>
      </div>

      <div className="bg-muted/30 rounded-xl border p-4 mb-6 text-sm text-muted-foreground flex gap-2">
        <span>ℹ</span>
        <span>Raw dokumen berupa file Word (.docx) yang diunggah bersama SOP. Hanya tersedia untuk <strong className="text-foreground">view</strong> dan <strong className="text-foreground">download</strong>.</span>
      </div>

      <div className="bg-background rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Judul Dokumen</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Jenis Dokumen</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Division / Departemen</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tanggal Upload</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Ukuran</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rawDocs.map(r => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3">
                  <div className="font-medium">{r.sopDocument.judul}</div>
                  <div className="text-xs font-mono text-muted-foreground">{r.sopDocument.kode}</div>
                </td>
                <td className="px-5 py-3">
                  <KategoriBadge kategori={r.sopDocument.kategori} />
                </td>
                <td className="px-5 py-3 text-muted-foreground text-sm">
                  {r.sopDocument.department?.nama ?? "—"}
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{formatTanggal(r.uploadedAt)}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{formatFileSize(r.ukuranKb)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button className="text-xs border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors font-medium">👁 View</button>
                    <button className="text-xs bg-foreground text-background rounded-lg px-3 py-1.5 hover:bg-foreground/90 transition-colors font-medium">⬇ Download .docx</button>
                  </div>
                </td>
              </tr>
            ))}
            {rawDocs.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">Belum ada raw dokumen</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KategoriBadge({ kategori }: { kategori: string }) {
  const colors: Record<string, string> = {
    sr: "bg-green-50 text-green-700 border-green-200",
    ss: "bg-blue-50 text-blue-700 border-blue-200",
    sp: "bg-purple-50 text-purple-700 border-purple-200",
    sg: "bg-amber-50 text-amber-700 border-amber-200",
    petunjuk: "bg-gray-50 text-gray-600 border-gray-200",
  };
  const labels: Record<string, string> = {
    sr:"SOP Operation", ss:"SOP Supporting Unit", sp:"SOP Publishing",
    sg:"SOP General", petunjuk:"Petunjuk Pelaksanaan",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[kategori] ?? "bg-muted text-muted-foreground"}`}>
      {labels[kategori] ?? kategori}
    </span>
  );
}
