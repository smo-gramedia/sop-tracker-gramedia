// src/app/(admin)/attachment/page.tsx
import { getAttachments } from "@/actions/attachment";
import { formatTanggal } from "@/lib/utils";
import AttachmentActions from "@/components/admin/AttachmentActions";

export default async function AttachmentPage() {
  const { data: attachments, total } = await getAttachments();

  const menunggu = attachments.filter((a) => a.status === "menunggu").length;
  const disetujui = attachments.filter((a) => a.status === "disetujui").length;
  const ditolak = attachments.filter((a) => a.status === "ditolak").length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Monitoring</p>
        <h1 className="font-display font-bold text-3xl mt-1">
          Attachment Sosialisasi SOP
        </h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Masuk", value: total, color: "text-foreground" },
          { label: "Menunggu", value: menunggu, color: "text-amber-600" },
          { label: "Disetujui", value: disetujui, color: "text-green-600" },
          { label: "Ditolak", value: ditolak, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="bg-background rounded-xl border p-5">
            <div className={`font-display font-bold text-3xl ${s.color}`}>
              {s.value}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-background rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Nama User
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                SOP
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Upload ke-
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Tanggal
              </th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {attachments.map((att) => (
              <tr
                key={att.id}
                className="border-b last:border-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="font-medium">{att.user.nama}</div>
                  <div className="text-xs text-muted-foreground">
                    {att.user.unit ?? "—"}
                  </div>
                </td>
                <td className="px-5 py-3 text-sm">{att.sopDocument.judul}</td>
                <td className="px-5 py-3">
                  <AttStatusBadge status={att.status} />
                </td>
                <td className="px-5 py-3 text-center text-muted-foreground">
                  {att.uploadKe}
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {formatTanggal(att.uploadedAt)}
                </td>
                <td className="px-5 py-3">
                  <AttachmentActions attachment={att} />
                </td>
              </tr>
            ))}
            {attachments.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-muted-foreground"
                >
                  Belum ada bukti sosialisasi yang diupload.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    menunggu: "bg-amber-50 text-amber-700 border-amber-200",
    disetujui: "bg-green-50 text-green-700 border-green-200",
    ditolak: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-gray-50 text-gray-600 border-gray-200",
  };
  const labels: Record<string, string> = {
    menunggu: "Menunggu",
    disetujui: "Disetujui",
    ditolak: "Ditolak",
    pending: "Pending",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
        map[status] ?? ""
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
