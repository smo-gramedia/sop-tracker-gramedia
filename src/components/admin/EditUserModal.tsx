"use client";

// src/components/admin/EditUserModal.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

type Props = {
  open: boolean;
  userId: string | null;
  onClose: () => void;
};

type UserDetail = {
  id: string;
  kodeUser: string;
  tipeUser: "store" | "department" | null;
  nama: string;
  email: string;
  unit: string | null;
  status: string;
  role: string;
  joinedAt: string | null;
};

export default function EditUserModal({ open, userId, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ─── Form state ───────────────────────────────────────────────────
  const [user, setUser] = useState<UserDetail | null>(null);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState<"aktif" | "nonaktif">("aktif");
  const [joinedAt, setJoinedAt] = useState("");

  // ─── Reset password (optional) ─────────────────────────────────────
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Load user data saat modal dibuka
  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    setError("");
    setSuccess(false);
    setUser(null);
    setResetPasswordMode(false);
    setNewPassword("");
    setConfirmPassword("");

    fetch(`/api/users/${userId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || "Gagal memuat data user");
        }
        return res.json();
      })
      .then((data: UserDetail) => {
        setUser(data);
        setNama(data.nama);
        setEmail(data.email);
        setUnit(data.unit ?? "");
        setStatus(data.status as "aktif" | "nonaktif");
        setJoinedAt(
          data.joinedAt
            ? new Date(data.joinedAt).toISOString().split("T")[0]
            : ""
        );
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, userId]);

  // ─── Submit ───────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!user) return;

    // Validasi password kalau mode reset aktif
    if (resetPasswordMode) {
      if (newPassword.length < 8) {
        setError("Password baru minimal 8 karakter");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Konfirmasi password tidak cocok");
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    const payload: Record<string, unknown> = {
      nama,
      email,
      unit: unit.trim() || null,
      status,
      joinedAt: joinedAt || null,
    };
    if (resetPasswordMode && newPassword) {
      payload.newPassword = newPassword;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Gagal menyimpan perubahan");
      }
      setSuccess(true);
      // Auto-close & refresh setelah 1 detik
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl border shadow-2xl w-full max-w-2xl my-4 sm:my-8 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h2 className="font-display font-bold text-2xl">Edit User</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user
                ? `Ubah informasi untuk ${user.nama} (${user.kodeUser})`
                : "Memuat data..."}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={18} /> Memuat data user...
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl border border-destructive/20 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-200 flex items-start gap-2">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              <p>Perubahan berhasil disimpan.</p>
            </div>
          )}

          {user && (
            <>
              {/* Read-only info */}
              <div className="bg-muted/40 rounded-xl p-4 border grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Kode User</p>
                  <p className="font-mono font-medium">{user.kodeUser}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipe / Role</p>
                  <p className="font-medium">
                    {user.role === "superadmin"
                      ? "Super Admin"
                      : user.role === "admin"
                      ? "Admin"
                      : user.tipeUser === "store"
                      ? "Store"
                      : user.tipeUser === "department"
                      ? "Department"
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Editable fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-nama">Nama Unit Kerja *</Label>
                  <Input
                    id="edit-nama"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Toko Matraman / SMO Department / dll"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@gramedia.co.id"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-unit">Unit / Departemen</Label>
                  <Input
                    id="edit-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Operations / IT / dll (opsional)"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-joined">Tanggal Bergabung</Label>
                  <Input
                    id="edit-joined"
                    type="date"
                    value={joinedAt}
                    onChange={(e) => setJoinedAt(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Status</Label>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setStatus("aktif")}
                      disabled={saving}
                      className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        status === "aktif"
                          ? "bg-green-50 text-green-700 border-green-300"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("nonaktif")}
                      disabled={saving}
                      className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        status === "nonaktif"
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      Nonaktif
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset Password section */}
              <div className="border-t pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <KeyRound size={14} /> Reset Password
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Atur password baru untuk user ini (opsional)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResetPasswordMode(!resetPasswordMode);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={saving}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {resetPasswordMode ? "Batal Reset" : "Reset Password"}
                  </button>
                </div>

                {resetPasswordMode && (
                  <div className="space-y-3 bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-start gap-2 text-xs text-amber-800">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <p>
                        User akan diminta login ulang dengan password baru. Pastikan
                        Bapak komunikasikan password baru ke user.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="new-pw">Password Baru</Label>
                      <div className="relative">
                        <Input
                          id="new-pw"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 8 karakter"
                          disabled={saving}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirm-pw">Konfirmasi Password</Label>
                      <Input
                        id="confirm-pw"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        disabled={saving}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t bg-muted/20 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || saving || !user}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
