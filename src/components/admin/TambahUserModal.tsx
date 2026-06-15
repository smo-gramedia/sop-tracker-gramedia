"use client";

// src/components/admin/TambahUserModal.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Store, Building2, Shield, CheckCircle2 } from "lucide-react";

type Props = { open: boolean; onClose: () => void };

type TipeUser = "store" | "department" | "admin";

export default function TambahUserModal({ open, onClose }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ─── Form state ───────────────────────────────────────────────────
  const [tipeUser, setTipeUser] = useState<TipeUser>("store");
  const [kodeStore, setKodeStore] = useState("");
  const [singkatanDept, setSingkatanDept] = useState("");
  const [kodeUserManual, setKodeUserManual] = useState("");
  const [adminRole, setAdminRole] = useState<"admin" | "superadmin">("admin");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [unit, setUnit] = useState("");
  // ─── Tanggal bergabung: auto-fill hari ini (read-only, tidak bisa diubah) ──
  // Format: YYYY-MM-DD untuk input type="date"
  // Setter tetap ada supaya bisa di-refresh saat modal dibuka ulang (besoknya tanggal baru)
  const todayISO = () => new Date().toISOString().split("T")[0];
  const [joinedAt, setJoinedAt] = useState<string>(todayISO);

  // ─── Preview kode (calculated) ────────────────────────────────────
  const [previewKode, setPreviewKode] = useState("");
  const [existingCount, setExistingCount] = useState(0);

  // Compute preview kode saat input berubah
  useEffect(() => {
    if (tipeUser === "store") {
      if (/^\d{5}$/.test(kodeStore)) {
        setPreviewKode(`STR-${kodeStore}-???`);
        // Optional: bisa fetch dari API untuk hitung existing user, tapi simplified dulu
      } else {
        setPreviewKode("");
      }
    } else if (tipeUser === "department") {
      if (/^[A-Z]{2,5}$/.test(singkatanDept)) {
        setPreviewKode(`DEPT-${singkatanDept}-???`);
      } else {
        setPreviewKode("");
      }
    } else {
      // admin
      setPreviewKode(kodeUserManual);
    }
  }, [tipeUser, kodeStore, singkatanDept, kodeUserManual]);

  // Reset form saat modal open
  useEffect(() => {
    if (open) {
      setTipeUser("store");
      setKodeStore("");
      setSingkatanDept("");
      setKodeUserManual("");
      setAdminRole("admin");
      setNama("");
      setEmail("");
      setPassword("");
      setUnit("");
      // Refresh ke tanggal hari ini setiap modal dibuka (penting kalau besok dibuka, dapat tanggal baru)
      setJoinedAt(todayISO());
      setError("");
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // ─── Client-side validation ────────────────────────────────────
    if (tipeUser === "store") {
      if (!/^\d{5}$/.test(kodeStore)) {
        setError("Kode toko harus 5 digit angka (contoh: 00123)");
        return;
      }
    } else if (tipeUser === "department") {
      if (!/^[A-Z]{2,5}$/.test(singkatanDept)) {
        setError("Singkatan departemen harus 2-5 huruf uppercase (contoh: SMO, AUDIT)");
        return;
      }
    } else {
      if (!kodeUserManual.trim()) {
        setError("Kode user wajib diisi untuk admin");
        return;
      }
    }

    if (!nama.trim()) {
      setError("Nama wajib diisi");
      return;
    }
    if (!email.trim()) {
      setError("Email wajib diisi");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    setSaving(true);

    const body: any = {
      tipeUser,
      nama: nama.trim(),
      email: email.trim(),
      password,
      unit: unit.trim() || undefined,
      joinedAt: joinedAt || undefined,
    };

    if (tipeUser === "store") body.kodeStore = kodeStore;
    else if (tipeUser === "department") body.singkatanDept = singkatanDept;
    else {
      body.kodeUserManual = kodeUserManual.trim();
      body.role = adminRole;
    }

    const res = await fetch("/api/users", {
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
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="bg-background rounded-2xl border w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-background z-10">
          <div>
            <h2 className="font-display font-bold text-lg">Tambah User</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daftarkan unit kerja (store / department) atau admin baru
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* ─── Tipe User Selector ──────────────────────────────── */}
          <div className="space-y-2">
            <Label>
              Tipe User <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <TipeUserButton
                active={tipeUser === "store"}
                onClick={() => setTipeUser("store")}
                icon={Store}
                label="Store"
                disabled={saving}
              />
              <TipeUserButton
                active={tipeUser === "department"}
                onClick={() => setTipeUser("department")}
                icon={Building2}
                label="Department"
                disabled={saving}
              />
              <TipeUserButton
                active={tipeUser === "admin"}
                onClick={() => setTipeUser("admin")}
                icon={Shield}
                label="Admin"
                disabled={saving}
              />
            </div>
          </div>

          {/* ─── Conditional: Store ─────────────────────────────── */}
          {tipeUser === "store" && (
            <div className="space-y-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <Label htmlFor="kodeStore">
                Kode Toko (5 digit){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="kodeStore"
                placeholder="00123"
                value={kodeStore}
                onChange={(e) =>
                  setKodeStore(e.target.value.replace(/\D/g, "").slice(0, 5))
                }
                disabled={saving}
                maxLength={5}
                inputMode="numeric"
              />
              <KodePreview kode={previewKode} tipeUser="store" />
            </div>
          )}

          {/* ─── Conditional: Department ────────────────────────── */}
          {tipeUser === "department" && (
            <div className="space-y-2 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
              <Label htmlFor="singkatanDept">
                Singkatan Departemen (2-5 huruf){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="singkatanDept"
                placeholder="SMO"
                value={singkatanDept}
                onChange={(e) =>
                  setSingkatanDept(
                    e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 5)
                  )
                }
                disabled={saving}
                maxLength={5}
              />
              <KodePreview kode={previewKode} tipeUser="department" />
              <p className="text-[11px] text-muted-foreground">
                Contoh: SMO, FIN, HR, IT, AUDIT, EDIT
              </p>
            </div>
          )}

          {/* ─── Conditional: Admin ─────────────────────────────── */}
          {tipeUser === "admin" && (
            <div className="space-y-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
              <div className="space-y-1.5">
                <Label htmlFor="kodeUserManual">
                  Kode User <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="kodeUserManual"
                  placeholder="ADMIN-002, SUPERADMIN-002"
                  value={kodeUserManual}
                  onChange={(e) => setKodeUserManual(e.target.value.toUpperCase())}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role Admin</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminRole("admin")}
                    disabled={saving}
                    className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                      adminRole === "admin"
                        ? "bg-foreground text-background border-foreground font-semibold"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminRole("superadmin")}
                    disabled={saving}
                    className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                      adminRole === "superadmin"
                        ? "bg-foreground text-background border-foreground font-semibold"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    Super Admin
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Common fields ──────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="nama">
              {tipeUser === "store"
                ? "Nama Toko"
                : tipeUser === "department"
                ? "Nama Departemen"
                : "Nama"}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nama"
              placeholder={
                tipeUser === "store"
                  ? "Gramedia Matraman"
                  : tipeUser === "department"
                  ? "Strategic Management Office"
                  : "Nama Admin"
              }
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={
                tipeUser === "store"
                  ? "str.matraman@gramedia.co.id"
                  : tipeUser === "department"
                  ? "dept.smo@gramedia.co.id"
                  : "admin@gramedia.co.id"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={saving}
              required
              minLength={8}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit / Kategori</Label>
              <Input
                id="unit"
                placeholder={
                  tipeUser === "store"
                    ? "Store Operations"
                    : tipeUser === "department"
                    ? "Finance / HR / IT"
                    : "SMO"
                }
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="joinedAt">Tanggal Bergabung</Label>
              <Input
                id="joinedAt"
                type="date"
                value={joinedAt}
                disabled
                className="bg-muted/40 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Otomatis diisi tanggal hari ini
              </p>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Tambah User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tipe User Button ─────────────────────────────────────────────────
function TipeUserButton({
  active,
  onClick,
  icon: Icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-all ${
        active
          ? "bg-primary/10 border-primary text-primary"
          : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/30"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Icon size={20} />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

// ─── Kode Preview ─────────────────────────────────────────────────────
function KodePreview({
  kode,
  tipeUser,
}: {
  kode: string;
  tipeUser: "store" | "department";
}) {
  if (!kode) {
    return (
      <p className="text-[11px] text-muted-foreground italic">
        {tipeUser === "store"
          ? "Masukkan 5 digit kode toko untuk lihat preview kode user"
          : "Masukkan 2-5 huruf singkatan untuk lihat preview kode user"}
      </p>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <CheckCircle2 size={12} className="text-green-600 flex-shrink-0" />
      <span className="text-muted-foreground">Preview kode user:</span>
      <code className="bg-background border rounded px-1.5 py-0.5 font-mono font-bold">
        {kode}
      </code>
      <span className="text-[10px] text-muted-foreground">
        (counter auto-generate)
      </span>
    </div>
  );
}
