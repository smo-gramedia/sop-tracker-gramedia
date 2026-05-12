"use client";

// src/components/admin/UserProgressClient.tsx
import { useState, useMemo } from "react";
import { formatTanggal } from "@/lib/utils";
import {
  TrendingUp,
  CheckCircle,
  Clock,
  Circle,
  Search,
  Store,
  Building2,
} from "lucide-react";

type ProgressItem = {
  id: string;
  stepCurrent: number;
  status: string;
  lastAccessedAt: Date | null;
  completedAt: Date | null;
  user: {
    id: string;
    nama: string;
    kodeUser: string;
    tipeUser: "store" | "department" | null;
    unit: string | null;
  };
  sopDocument: {
    id: string;
    kode: string;
    judul: string;
    kategori: string;
  };
};

type Props = {
  progressList: ProgressItem[];
  totalCount: number;
  selesaiCount: number;
  dipelajariCount: number;
  belumCount: number;
};

export default function UserProgressClient({
  progressList,
  totalCount,
  selesaiCount,
  dipelajariCount,
  belumCount,
}: Props) {
  // ─── Filter state ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tipeFilter, setTipeFilter] = useState("");

  // ─── Filtered list ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return progressList.filter((p) => {
      // Search: nama SOP, kode SOP, nama user, kode user
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          p.sopDocument.judul.toLowerCase().includes(q) ||
          p.sopDocument.kode.toLowerCase().includes(q) ||
          p.user.nama.toLowerCase().includes(q) ||
          p.user.kodeUser.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter && p.status !== statusFilter) return false;
      if (tipeFilter && p.user.tipeUser !== tipeFilter) return false;
      return true;
    });
  }, [progressList, search, statusFilter, tipeFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Monitoring</p>
        <h1 className="font-display font-bold text-3xl mt-1">User Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau progress pembelajaran unit kerja (store dan department) di
          seluruh SOP.
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

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-background border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama SOP, kode, atau nama unit kerja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent border-none outline-none"
          />
        </div>
        <select
          value={tipeFilter}
          onChange={(e) => setTipeFilter(e.target.value)}
          className="bg-background border rounded-xl px-3 py-2 text-sm min-w-[160px]"
        >
          <option value="">Semua Tipe</option>
          <option value="store">Store</option>
          <option value="department">Department</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background border rounded-xl px-3 py-2 text-sm min-w-[180px]"
        >
          <option value="">Semua Status</option>
          <option value="belum">Belum Mulai</option>
          <option value="dipelajari">Sedang Dipelajari</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>

      <div className="bg-background rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="font-display font-semibold text-sm">
            Aktivitas Pembelajaran
          </h2>
          <span className="text-xs text-muted-foreground">
            Menampilkan {filtered.length} dari {progressList.length} progress
          </span>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/40 z-10">
              <tr className="border-b">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Unit Kerja
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
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    {progressList.length === 0
                      ? "Belum ada aktivitas pembelajaran."
                      : "Tidak ada progress yang sesuai filter"}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <TipeIcon tipe={p.user.tipeUser} />
                        <div className="min-w-0">
                          <div className="font-medium">{p.user.nama}</div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-mono">{p.user.kodeUser}</span>
                            {p.user.unit && (
                              <>
                                <span className="mx-1">·</span>
                                <span>{p.user.unit}</span>
                              </>
                            )}
                          </div>
                        </div>
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

function TipeIcon({ tipe }: { tipe: "store" | "department" | null }) {
  if (tipe === "store") {
    return (
      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
        <Store size={12} />
      </div>
    );
  }
  if (tipe === "department") {
    return (
      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
        <Building2 size={12} />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
      —
    </div>
  );
}

function ProgressBadge({ status }: { status: string }) {
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
