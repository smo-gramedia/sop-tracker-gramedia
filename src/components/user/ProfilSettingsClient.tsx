// src/components/user/ProfilSettingsClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { updateMyProfile, changeMyPassword } from "@/actions/user-profile";

type UserData = {
  id: string;
  kodeKaryawan: string;
  nama: string;
  email: string;
  unit: string | null;
  jabatan: string | null;
  section: string | null;
  role: string;
};

type Props = { user: UserData };

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export default function ProfilSettingsClient({ user }: Props) {
  return (
    <div className="space-y-6">
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  );
}

// ─────────────────────────────────────────────
// Profile form (nama, unit, jabatan, section)
// ─────────────────────────────────────────────
function ProfileForm({ user }: { user: UserData }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ type: "loading" });
    try {
      const fd = new FormData(e.currentTarget);
      await updateMyProfile(fd);
      setStatus({
        type: "success",
        message: "Profil berhasil diperbarui",
      });
      router.refresh();
    } catch (e) {
      setStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Gagal memperbarui profil",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background rounded-2xl border overflow-hidden"
    >
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <User size={18} />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg">
              Informasi Profil
            </h2>
            <p className="text-xs text-muted-foreground">
              Data dasar akun Anda di sistem
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Read-only fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Kode Karyawan</Label>
            <Input value={user.kodeKaryawan} disabled className="bg-muted/40" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Email</Label>
            <Input value={user.email} disabled className="bg-muted/40" />
          </div>
        </div>

        <p className="text-xs text-muted-foreground -mt-2">
          Kode karyawan dan email tidak dapat diubah. Hubungi admin jika ada
          kesalahan.
        </p>

        {/* Editable fields */}
        <div className="space-y-1.5">
          <Label htmlFor="nama">Nama Lengkap</Label>
          <Input
            id="nama"
            name="nama"
            defaultValue={user.nama}
            required
            maxLength={100}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              name="unit"
              defaultValue={user.unit ?? ""}
              placeholder="Mis: SMO, Toko Surabaya"
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jabatan">Jabatan</Label>
            <Input
              id="jabatan"
              name="jabatan"
              defaultValue={user.jabatan ?? ""}
              placeholder="Mis: Staff Audit"
              maxLength={100}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="section">Section</Label>
          <Input
            id="section"
            name="section"
            defaultValue={user.section ?? ""}
            placeholder="Mis: Internal Communications"
            maxLength={100}
          />
        </div>

        <StatusBanner status={status} />
      </div>

      <div className="px-6 py-4 bg-muted/30 border-t flex justify-end">
        <Button type="submit" disabled={status.type === "loading"}>
          {status.type === "loading" ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Password change form
// ─────────────────────────────────────────────
function PasswordForm() {
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [formKey, setFormKey] = useState(0); // trick untuk reset form setelah submit

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ type: "loading" });
    try {
      const fd = new FormData(e.currentTarget);
      await changeMyPassword(fd);
      setStatus({
        type: "success",
        message: "Password berhasil diubah",
      });
      setFormKey((k) => k + 1); // reset form
    } catch (e) {
      setStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Gagal mengubah password",
      });
    }
  }

  return (
    <form
      key={formKey}
      onSubmit={handleSubmit}
      className="bg-background rounded-2xl border overflow-hidden"
    >
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg">
              Ubah Password
            </h2>
            <p className="text-xs text-muted-foreground">
              Pastikan password baru cukup kuat dan mudah Anda ingat
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Password Lama</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Password Baru</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">Minimal 6 karakter</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </div>

        <StatusBanner status={status} />
      </div>

      <div className="px-6 py-4 bg-muted/30 border-t flex justify-end">
        <Button type="submit" disabled={status.type === "loading"}>
          {status.type === "loading" ? "Menyimpan..." : "Ubah Password"}
        </Button>
      </div>
    </form>
  );
}

function StatusBanner({ status }: { status: Status }) {
  if (status.type === "success") {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
        <CheckCircle2 size={16} />
        {status.message}
      </div>
    );
  }
  if (status.type === "error") {
    return (
      <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive flex items-center gap-2">
        <AlertCircle size={16} />
        {status.message}
      </div>
    );
  }
  return null;
}
