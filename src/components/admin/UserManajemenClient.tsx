// src/components/admin/UserManajemenClient.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Store,
  Building2,
  Shield,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import TambahUserModal from "./TambahUserModal";
import DetailUserModal from "./DetailUserModal";
import EditUserModal from "./EditUserModal";
import { formatTanggal } from "@/lib/utils";

type User = {
  id: string;
  kodeUser: string;
  tipeUser: "store" | "department" | null;
  nama: string;
  email: string;
  unit: string | null;
  status: string;
  role: string;
  joinedAt: Date | null;
  createdAt: Date;
  _count: { learningProgress: number };
};

const PAGE_SIZE = 10;

export default function UserManajemenClient({ users }: { users: User[] }) {
  const router = useRouter();
  const [tambahOpen, setTambahOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  // ─── Filter state ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tipeFilter, setTipeFilter] = useState(""); // store | department | admin
  const [page, setPage] = useState(1);

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
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          u.nama.toLowerCase().includes(q) ||
          (u.unit?.toLowerCase().includes(q) ?? false) ||
          u.kodeUser.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Status
      if (statusFilter && u.status !== statusFilter) return false;
      // Tipe — sekarang termasuk filter Admin
      if (tipeFilter) {
        if (tipeFilter === "store" && u.tipeUser !== "store") return false;
        if (tipeFilter === "department" && u.tipeUser !== "department")
          return false;
        if (
          tipeFilter === "admin" &&
          u.role !== "admin" &&
          u.role !== "superadmin"
        )
          return false;
      }
      return true;
    });
  }, [users, search, statusFilter, tipeFilter]);

  // ─── Pagination ─────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset to page 1 saat filter berubah
  const filtersKey = `${search}|${statusFilter}|${tipeFilter}`;
  useMemo(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  // ─── Stats ──────────────────────────────────────────────────────────
  const aktif = users.filter((u) => u.status === "aktif").length;
  const nonaktif = users.filter((u) => u.status === "nonaktif").length;
  const storeCount = users.filter((u) => u.tipeUser === "store").length;
  const deptCount = users.filter((u) => u.tipeUser === "department").length;
  const adminCount = users.filter(
    (u) => u.role === "admin" || u.role === "superadmin"
  ).length;

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Admin</p>
            <h1 className="font-display font-bold text-2xl sm:text-3xl mt-1">
              User Manajemen
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola unit kerja (store, department) dan admin yang akan
              mengakses sistem.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setTambahOpen(true)}>
            <Plus size={16} /> Tambah User
          </Button>
        </div>

        {/* Stats Summary — sekarang 5 cards (Total, Store, Dept, Admin, Aktif) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="bg-background rounded-xl border p-4 sm:p-5">
            <div className="font-display font-bold text-2xl sm:text-3xl">{users.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total User</div>
          </div>
          <div className="bg-background rounded-xl border p-4 sm:p-5">
            <div className="font-display font-bold text-2xl sm:text-3xl text-blue-600">
              {storeCount}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Store</div>
          </div>
          <div className="bg-background rounded-xl border p-4 sm:p-5">
            <div className="font-display font-bold text-2xl sm:text-3xl text-purple-600">
              {deptCount}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Department</div>
          </div>
          <div className="bg-background rounded-xl border p-4 sm:p-5">
            <div className="font-display font-bold text-2xl sm:text-3xl text-amber-600">
              {adminCount}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Admin</div>
          </div>
          <div className="bg-background rounded-xl border p-4 sm:p-5 col-span-2 sm:col-span-1">
            <div className="font-display font-bold text-2xl sm:text-3xl text-green-600">
              {aktif}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
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
            <option value="admin">Admin / Superadmin</option>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 sm:px-5 py-3 font-medium text-muted-foreground">
                    Unit Kerja
                  </th>
                  <th className="text-left px-4 sm:px-5 py-3 font-medium text-muted-foreground">
                    Tipe
                  </th>
                  <th className="text-left px-4 sm:px-5 py-3 font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left px-4 sm:px-5 py-3 font-medium text-muted-foreground">
                    Unit
                  </th>
                  <th className="text-left px-4 sm:px-5 py-3 font-medium text-muted-foreground">
                    SOP
                  </th>
                  <th className="text-left px-4 sm:px-5 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 sm:px-5 py-3 font-medium text-muted-foreground">
                    Bergabung
                  </th>
                  <th className="text-right px-4 sm:px-5 py-3 font-medium text-muted-foreground">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          tipeUser={u.tipeUser}
                          role={u.role}
                          nama={u.nama}
                        />
                        <div>
                          <div className="font-medium">{u.nama}</div>
                          <div className="text-xs font-mono text-muted-foreground">
                            {u.kodeUser}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <TipeBadge tipe={u.tipeUser} role={u.role} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-sm">
                      {u.email}
                    </td>
                    <td className="px-5 py-3 text-sm">{u.unit ?? "—"}</td>
                    <td className="px-5 py-3 text-center font-medium">
                      {u.role === "user" ? u._count.learningProgress : "—"}
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
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setDetailUserId(u.id)}
                          title="Lihat detail"
                        >
                          <Eye size={12} /> Detail
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setEditUserId(u.id)}
                          title="Edit user"
                        >
                          <Pencil size={12} /> Edit
                        </Button>
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
          </div>

          {/* ─── Pagination Footer ─────────────────────────────────── */}
          {filteredUsers.length > 0 && (
            <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-muted-foreground">
                Menampilkan{" "}
                <strong>{(currentPage - 1) * PAGE_SIZE + 1}</strong>–
                <strong>
                  {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}
                </strong>{" "}
                dari <strong>{filteredUsers.length}</strong> user
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="text-xs px-3 py-1 bg-background border rounded-md min-w-[60px] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <TambahUserModal
        open={tambahOpen}
        onClose={() => {
          setTambahOpen(false);
          router.refresh();
        }}
      />
      <DetailUserModal
        open={detailUserId !== null}
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />
      <EditUserModal
        open={editUserId !== null}
        userId={editUserId}
        onClose={() => setEditUserId(null)}
      />
    </>
  );
}

// ─── User Avatar (icon per tipe / role) ──────────────────────────────
function UserAvatar({
  tipeUser,
  role,
  nama,
}: {
  tipeUser: "store" | "department" | null;
  role: string;
  nama: string;
}) {
  if (role === "admin" || role === "superadmin") {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
        <Shield size={14} />
      </div>
    );
  }
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

// ─── Tipe Badge (sekarang juga handle admin/superadmin) ──────────────
function TipeBadge({
  tipe,
  role,
}: {
  tipe: "store" | "department" | null;
  role: string;
}) {
  if (role === "superadmin") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-amber-50 text-amber-700 border-amber-200">
        <Shield size={10} /> Super Admin
      </span>
    );
  }
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-orange-50 text-orange-700 border-orange-200">
        <Shield size={10} /> Admin
      </span>
    );
  }
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
  return <span className="text-xs text-muted-foreground">—</span>;
}
