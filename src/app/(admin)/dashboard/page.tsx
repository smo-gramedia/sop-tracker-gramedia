// src/app/(admin)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, formatTanggal } from "@/lib/utils";
import { Users, FileText, CheckCircle, Clock } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  const [totalUsers, totalDokumen, totalSelesai, menunggu] = await Promise.all([
    prisma.user.count({ where: { role: "user", status: "aktif" } }),
    prisma.sopDocument.count({ where: { status: "aktif" } }),
    prisma.learningProgress.count({ where: { status: "selesai" } }),
    prisma.sosialisasiAttachment.count({ where: { status: "menunggu" } }),
  ]);

  const recentDokumen = await prisma.sopDocument.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { department: true, uploadedBy: { select: { nama: true } } },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Dashboard</p>
        <h1 className="font-display font-bold text-3xl mt-1">
          Selamat datang, {session?.user.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau aktivitas pembelajaran SOP dan kelola konten dari sini.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total User Aktif"
          value={totalUsers}
          color="blue"
        />
        <StatCard
          icon={FileText}
          label="Total Dokumen SOP"
          value={totalDokumen}
          color="purple"
        />
        <StatCard
          icon={CheckCircle}
          label="Progress Selesai"
          value={totalSelesai}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Menunggu Verifikasi"
          value={menunggu}
          color="amber"
        />
      </div>

      {/* Recent documents */}
      <div className="bg-background rounded-xl border">
        <div className="p-5 border-b">
          <h2 className="font-display font-semibold text-lg">
            Dokumen SOP Terbaru
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Kode
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Judul SOP
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Departemen
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Tanggal
              </th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {recentDokumen.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-muted-foreground"
                >
                  Belum ada dokumen SOP.
                </td>
              </tr>
            ) : (
              recentDokumen.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                    {doc.kode}
                  </td>
                  <td className="px-5 py-3 font-medium">{doc.judul}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {doc.department?.nama ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatTanggal(doc.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={doc.status} />
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
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "blue" | "purple" | "green" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    green:
      "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  };
  return (
    <div className="bg-background rounded-xl border p-5">
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
          colors[color]
        )}
      >
        <Icon size={20} />
      </div>
      <div className="font-display font-bold text-3xl">
        {value.toLocaleString("id-ID")}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    aktif: "bg-green-50 text-green-700 border-green-200",
    draft: "bg-gray-50 text-gray-600 border-gray-200",
    obsolete: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={cn(
        "text-xs px-2 py-0.5 rounded-full border font-medium",
        map[status] ?? "bg-muted text-muted-foreground border-border"
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
