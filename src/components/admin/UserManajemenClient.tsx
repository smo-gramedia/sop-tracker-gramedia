// src/components/admin/UserManajemenClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TambahUserModal from "./TambahUserModal";
import { formatTanggal } from "@/lib/utils";

type User = {
  id: string; kodeKaryawan: string; nama: string; email: string;
  unit: string | null; jabatan: string | null; status: string;
  joinedAt: Date | null; createdAt: Date;
  _count: { learningProgress: number };
};

export default function UserManajemenClient({ users }: { users: User[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [toggling, setToggling]   = useState<string | null>(null);

  async function toggleStatus(id: string, current: string) {
    setToggling(id);
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: current === "aktif" ? "nonaktif" : "aktif" }),
    });
    setToggling(null);
    router.refresh();
  }

  const aktif    = users.filter(u => u.status === "aktif").length;
  const nonaktif = users.filter(u => u.status === "nonaktif").length;

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Admin</p>
            <h1 className="font-display font-bold text-3xl mt-1">User Manajemen</h1>
          </div>
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus size={16}/> Tambah User
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-background rounded-xl border p-5">
            <div className="font-display font-bold text-3xl">{users.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Total User</div>
          </div>
          <div className="bg-background rounded-xl border p-5">
            <div className="font-display font-bold text-3xl text-green-600">{aktif}</div>
            <div className="text-sm text-muted-foreground mt-1">Aktif</div>
          </div>
          <div className="bg-background rounded-xl border p-5">
            <div className="font-display font-bold text-3xl text-muted-foreground">{nonaktif}</div>
            <div className="text-sm text-muted-foreground mt-1">Nonaktif</div>
          </div>
        </div>

        <div className="bg-background rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Karyawan</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Unit / Jabatan</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">SOP</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Bergabung</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {u.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{u.nama}</div>
                        <div className="text-xs font-mono text-muted-foreground">{u.kodeKaryawan}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-sm">{u.unit ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.jabatan ?? "—"}</div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-sm">{u.email}</td>
                  <td className="px-5 py-3 text-center font-medium">{u._count.learningProgress}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                      ${u.status==="aktif" ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border"}`}>
                      {u.status==="aktif" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{formatTanggal(u.joinedAt ?? u.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">View</Button>
                      <Button
                        variant="outline" size="sm"
                        className={`h-7 px-2.5 text-xs ${u.status==="aktif" ? "text-destructive border-destructive/30 hover:bg-destructive/10" : ""}`}
                        onClick={() => toggleStatus(u.id, u.status)}
                        disabled={toggling === u.id}
                      >
                        {u.status==="aktif" ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">Belum ada user</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TambahUserModal open={modalOpen} onClose={() => { setModalOpen(false); router.refresh(); }}/>
    </>
  );
}
