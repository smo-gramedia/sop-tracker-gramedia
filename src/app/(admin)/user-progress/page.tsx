// src/app/(admin)/user-progress/page.tsx
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/utils";
import { TrendingUp, CheckCircle, Clock, Circle } from "lucide-react";

export default async function UserProgressPage() {
  const [progress, stats] = await Promise.all([
    prisma.learningProgress.findMany({
      take: 50,
      orderBy: { lastAccessedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            kodeKaryawan: true,
            unit: true,
          },
        },
        sopDocument: {
          select: { id: true, kode: true, judul: true, kategori: true },
        },
      },
    }),
    prisma.learningProgress.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  // Process stats
  const statsMap = Object.fromEntries(
    stats.map((s) => [s.status, s._count])
  );
  const totalCount = stats.reduce((sum, s) => sum + s._count, 0);
  const selesaiCount = statsMap.selesai ?? 0;
  const dipelajariCount = statsMap.dipelajari ?? 0;
  const belumCount = statsMap.belum ?? 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Monitoring</p>
        <h1 className="font-display font-bold text-3xl mt-1">User Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau progress pembelajaran user di seluruh SOP.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={TrendingUp}
          iconColor="text-foreground"
          iconBg="bg-foreground/5"
          label="Total Progress"
          value={totalCount}
        />
        <StatCard
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          label="Selesai"
          value={selesaiCount}
        />
        <StatCard
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          label="Sedang Dipelajari"
          value={dipelajariCount}
        />
        <StatCard
          icon={Circle}
          iconColor="text-gray-500"
          iconBg="bg-gray-100"
          label="Belum Mulai"
          value={belumCount}
        />
      </div>

      <div className="bg-background rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="font-display font-semibold text-sm">
            Aktivitas Terbaru
          </h2>
          <span className="text-xs text-muted-foreground">
            Menampilkan 50 progress terbaru
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                User
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                SOP
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Step
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Terakhir Diakses
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Selesai
              </th>
            </tr>
          </thead>
          <tbody>
            {progress.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-muted-foreground"
                >
                  Belum ada aktivitas pembelajaran.
                </td>
              </tr>
            ) : (
              progress.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium">{p.user.nama}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.user.kodeKaryawan} · {p.user.unit ?? "—"}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-sm">
                      {p.sopDocument.judul}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {p.sopDocument.kode}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 7 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-sm ${
                              i <= p.stepCurrent ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {p.stepCurrent}/6
                      </span>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-background rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}
        >
          <Icon size={14} className={iconColor} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="font-display font-bold text-2xl">{value}</div>
    </div>
  );
}

function ProgressBadge({ status }: { status: string }) {
  // Standardized colors:
  // belum = gray, dipelajari = AMBER (was blue), selesai = green
  const map: Record<string, string> = {
    belum: "bg-gray-50 text-gray-600 border-gray-200",
    dipelajari: "bg-amber-50 text-amber-700 border-amber-200",
    selesai: "bg-green-50 text-green-700 border-green-200",
  };
  const labels: Record<string, string> = {
    belum: "Belum",
    dipelajari: "Sedang dipelajari",
    selesai: "Selesai",
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
