import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/utils";

export default async function UserProgressPage() {
  const progress = await prisma.learningProgress.findMany({
    take: 50,
    orderBy: { lastAccessedAt: "desc" },
    include: {
      user:        { select: { id: true, nama: true, kodeKaryawan: true, unit: true } },
      sopDocument: { select: { id: true, kode: true, judul: true, kategori: true } },
    },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Monitoring</p>
        <h1 className="font-display font-bold text-3xl mt-1">User Progress</h1>
      </div>

      <div className="bg-background rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">SOP</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Step</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Terakhir Diakses</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Selesai</th>
            </tr>
          </thead>
          <tbody>
            {progress.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3">
                  <div className="font-medium">{p.user.nama}</div>
                  <div className="text-xs text-muted-foreground">{p.user.kodeKaryawan} · {p.user.unit ?? "—"}</div>
                </td>
                <td className="px-5 py-3">
                  <div className="font-medium text-sm">{p.sopDocument.judul}</div>
                  <div className="text-xs font-mono text-muted-foreground">{p.sopDocument.kode}</div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 7 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-sm ${i <= p.stepCurrent ? "bg-primary" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{p.stepCurrent}/6</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <ProgressBadge status={p.status} />
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {formatTanggal(p.lastAccessedAt)}
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {formatTanggal(p.completedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProgressBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    belum:      "bg-gray-50 text-gray-600 border-gray-200",
    dipelajari: "bg-blue-50 text-blue-700 border-blue-200",
    selesai:    "bg-green-50 text-green-700 border-green-200",
  };
  const labels: Record<string, string> = {
    belum: "Belum", dipelajari: "Sedang dipelajari", selesai: "Selesai",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${map[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}
