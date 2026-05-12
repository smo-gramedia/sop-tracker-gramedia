// src/components/admin/UserManajemenClient.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Search, Store, Building2 } from "lucide-react";
import TambahUserModal from "./TambahUserModal";
import { formatTanggal } from "@/lib/utils";

type User = {
  id: string;
  kodeUser: string;
  tipeUser: "store" | "department" | null;
  nama: string;
  email: string;
  unit: string | null;
  status: string;
  joinedAt: Date | null;
  createdAt: Date;
  _count: { learningProgress: number };
};

export default function UserManajemenClient({ users }: { users: User[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // ─── Filter state ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tipeFilter, setTipeFilter] = useState("");

  async function toggleStatus(id: string, current: string) {
    setToggling(id);
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status: current === "aktif" ? "nonaktif" : "aktif",
      }),
    });
    setToggling(null);
    router.refresh();
  }

  // ─── Filtered users ─────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          u.nama.toLowerCase().includes(q) ||
          (u.unit?.toLowerCase().includes(q) ?? false) ||
          u.kodeUser.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter && u.status !== statusFilter) return false;
      if (tipeFilter) {
        if (tipeFilter === "store" && u.tipeUser !== "store") return false;
        if (tipeFilter === "department" && u.tipeUser !== "department")
          return false;
      }
      return true;
    });
  }, [users, search, statusFilter, tipeFilter]);

  // Stats
  const aktif = users.filter((u) => u.status === "aktif").length;
  const nonaktif = users.filter((u) => u.status === "nonaktif").length;
  const storeCount = users.filter((u) => u.tipeUser === "store").length;
  const deptCount = users.filter((u) => u.tipeUser === "department").length;

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Admin</p>
            <h1 className="font-display font-bold text-3xl mt-1">
              User Manajemen
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola unit kerja (store dan department) yang akan mempelajari SOP.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Tambah User
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-background rounded-xl border p-5">
            <div className="font-display font-bold text-3xl">{users.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Total User</div>
          </div>
          <div className="bg-background rounded-xl border p-5">
            <div className="flex items-center gap-2">
              <div className="font-display font-bold text-3xl text-blue-600">
                {storeCount}
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-1">Store</div>
          </div>
          <div className="bg-background rounded-xl border p-5">
            <div className="flex items-center gap-2">
              <div className="font-display font-bold text-3xl text-purple-600">
                {deptCount}
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-1">Department</div>
          </div>
          <div className="bg-background rounded-xl border p-5">
            <div className="font-display font-bold text-3xl text-green-600">
              {aktif}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Aktif ({nonaktif} nonaktif)
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4 flex-wrap">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-background border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama, kode user, unit, atau email..."
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
            className="bg-background border rounded-xl px-3 py-2 text-sm min-w-[140px]"
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>

        <div className="bg-background rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Unit Kerja
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Tipe
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Email
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Unit
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  SOP
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Bergabung
                </th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar tipeUser={u.tipeUser} nama={u.nama} />
                      <div>
                        <div className="font-medium">{u.nama}</div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {u.kodeUser}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <TipeBadge tipe={u.tipeUser} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-sm">
                    {u.email}
                  </td>
                  <td className="px-5 py-3 text-sm">{u.unit ?? "—"}</td>
                  <td className="px-5 py-3 text-center font-medium">
                    {u._count.learningProgress}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium
                      ${
                        u.status === "aktif"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {u.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {formatTanggal(u.joinedAt ?? u.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 px-2.5 text-xs ${
                          u.status === "aktif"
                            ? "text-destructive border-destructive/30 hover:bg-destructive/10"
                            : ""
                        }`}
                        onClick={() => toggleStatus(u.id, u.status)}
                        disabled={toggling === u.id}
                      >
                        {u.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    {users.length === 0
                      ? "Belum ada user"
                      : "Tidak ada user yang sesuai filter"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredUsers.length > 0 && (
            <div className="px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground text-right">
              Menampilkan {filteredUsers.length} dari {users.length} user
            </div>
          )}
        </div>
      </div>

      <TambahUserModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

// ─── User Avatar (icon per tipe) ──────────────────────────────────────
function UserAvatar({
  tipeUser,
  nama,
}: {
  tipeUser: "store" | "department" | null;
  nama: string;
}) {
  if (tipeUser === "store") {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
        <Store size={14} />
      </div>
    );
  }
  if (tipeUser === "department") {
    return (
      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
        <Building2 size={14} />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
      {nama.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Tipe Badge ───────────────────────────────────────────────────────
function TipeBadge({
  tipe,
}: {
  tipe: "store" | "department" | null;
}) {
  if (tipe === "store") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-blue-50 text-blue-700 border-blue-200">
        <Store size={10} /> Store
      </span>
    );
  }
  if (tipe === "department") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-purple-50 text-purple-700 border-purple-200">
        <Building2 size={10} /> Department
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">—</span>
  );
}
