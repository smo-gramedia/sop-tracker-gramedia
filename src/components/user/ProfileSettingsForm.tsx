"use client";

// src/components/user/ProfileSettingsForm.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  updateMyProfile,
  changeMyPassword,
} from "@/actions/profile-actions";

type UserData = {
  id: string;
  nama: string;
  email: string;
  kodeUser: string;
  tipeUser: "store" | "department" | null;
  unit: string | null;
};

export default function ProfileSettingsForm({ user }: { user: UserData }) {
  const router = useRouter();

  // Profile state
  const [nama, setNama] = useState(user.nama);
  const [unit, setUnit] = useState(user.unit ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password state
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Tipe label
  const tipeLabel =
    user.tipeUser === "store"
      ? "Store"
      : user.tipeUser === "department"
      ? "Department"
      : "Admin";

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await updateMyProfile({
        nama: nama.trim(),
        unit: unit.trim() || undefined,
      });
      setProfileMsg({ type: "success", text: "Profil berhasil disimpan" });
      router.refresh();
    } catch (e) {
      setProfileMsg({
        type: "error",
        text: e instanceof Error ? e.message : "Gagal menyimpan",
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePwdSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);

    if (newPwd.length < 8) {
      setPwdMsg({
        type: "error",
        text: "Password baru minimal 8 karakter",
      });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({
        type: "error",
        text: "Konfirmasi password tidak cocok",
      });
      return;
    }

    setPwdSaving(true);
    try {
      await changeMyPassword({ oldPassword: oldPwd, newPassword: newPwd });
      setPwdMsg({
        type: "success",
        text: "Password berhasil diubah",
      });
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (e) {
      setPwdMsg({
        type: "error",
        text: e instanceof Error ? e.message : "Gagal mengubah password",
      });
    } finally {
      setPwdSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile section */}
      <div className="bg-background rounded-xl border overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b">
          <User size={16} className="text-muted-foreground" />
          <h2 className="font-display font-semibold">Informasi Profil</h2>
        </div>
        <form onSubmit={handleProfileSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="kode">Kode User</Label>
              <Input
                id="kode"
                value={user.kodeUser}
                disabled
                className="bg-muted font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Tidak bisa diubah
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipe">Tipe</Label>
              <Input
                id="tipe"
                value={tipeLabel}
                disabled
                className="bg-muted"
              />
              <p className="text-[11px] text-muted-foreground">
                Tidak bisa diubah
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-[11px] text-muted-foreground">
              Tidak bisa diubah
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nama">
              {user.tipeUser === "store"
                ? "Nama Toko"
                : user.tipeUser === "department"
                ? "Nama Departemen"
                : "Nama"}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              disabled={profileSaving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unit">Unit / Kategori</Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={
                user.tipeUser === "store"
                  ? "Store Operations"
                  : user.tipeUser === "department"
                  ? "Finance / HR / IT"
                  : "Unit"
              }
              disabled={profileSaving}
            />
          </div>

          {profileMsg && (
            <FormAlert type={profileMsg.type} text={profileMsg.text} />
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </div>

      {/* Password section */}
      <div className="bg-background rounded-xl border overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b">
          <Lock size={16} className="text-muted-foreground" />
          <h2 className="font-display font-semibold">Ubah Password</h2>
        </div>
        <form onSubmit={handlePwdSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="old-pwd">
              Password Saat Ini <span className="text-destructive">*</span>
            </Label>
            <Input
              id="old-pwd"
              type="password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              required
              disabled={pwdSaving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-pwd">
              Password Baru <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-pwd"
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              required
              disabled={pwdSaving}
            />
            <p className="text-[11px] text-muted-foreground">
              Minimal 8 karakter
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-pwd">
              Konfirmasi Password Baru{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirm-pwd"
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
              disabled={pwdSaving}
            />
          </div>

          {pwdMsg && <FormAlert type={pwdMsg.type} text={pwdMsg.text} />}

          <div className="flex justify-end">
            <Button type="submit" disabled={pwdSaving}>
              {pwdSaving ? "Menyimpan..." : "Ubah Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormAlert({
  type,
  text,
}: {
  type: "success" | "error";
  text: string;
}) {
  const isSuccess = type === "success";
  return (
    <div
      className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
        isSuccess
          ? "bg-green-50 border border-green-200 text-green-700"
          : "bg-destructive/10 border border-destructive/30 text-destructive"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={14} />
      ) : (
        <AlertCircle size={14} />
      )}
      {text}
    </div>
  );
}
