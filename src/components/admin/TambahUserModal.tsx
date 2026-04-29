// src/components/admin/TambahUserModal.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

type Props = { open: boolean; onClose: () => void };

export default function TambahUserModal({ open, onClose }: Props) {
  const router  = useRouter();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd   = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd);
    const res  = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Terjadi kesalahan");
      setSaving(false);
      return;
    }
    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background">
          <h2 className="font-display font-bold text-xl">Tambah User</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="kodeKaryawan">Kode Karyawan</Label>
              <Input id="kodeKaryawan" name="kodeKaryawan" placeholder="KG-001" required/>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select name="role" defaultValue="user">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input id="nama" name="nama" placeholder="Budi Santoso" required/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="budi@gramedia.co.id" required/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Min. 8 karakter" required minLength={8}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" placeholder="Store / Supporting / SMO"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jabatan">Jabatan</Label>
              <Input id="jabatan" name="jabatan" placeholder="Store Manager"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="section">Section</Label>
              <Input id="section" name="section" placeholder="Integration 2"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="joinedAt">Tanggal Bergabung</Label>
              <Input id="joinedAt" name="joinedAt" type="date"/>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Tambah User"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
