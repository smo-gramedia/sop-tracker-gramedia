"use client";

// src/components/admin/DetailUserModal.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Store,
  Building2,
  Shield,
  Mail,
  Hash,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  BookOpen,
  FileText,
  Award,
} from "lucide-react";
import { formatTanggal } from "@/lib/utils";

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
  createdAt: string;
  _count: {
    learningProgress: number;
    sosialisasiAttachments: number;
    postTestResults: number;
  };
};

export default function DetailUserModal({ open, userId, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    setError("");
    setUser(null);

    fetch(`/api/users/${userId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || "Gagal memuat detail user");
        }
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, userId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl border shadow-2xl w-full max-w-2xl my-4 sm:my-8 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h2 className="font-display font-bold text-2xl">Detail User</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Informasi lengkap unit kerja
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={18} /> Memuat detail...
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20">
              {error}
            </div>
          )}

          {user && (
            <>
              {/* Hero — avatar, nama, kode */}
              <div className="flex items-center gap-4 pb-6 border-b">
                <div className="flex-shrink-0">
                  <UserIcon tipeUser={user.tipeUser} role={user.role} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-xl">{user.nama}</h3>
                  <p className="font-mono text-sm text-muted-foreground mt-0.5">
                    {user.kodeUser}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <TipeBadge tipeUser={user.tipeUser} role={user.role} />
                    <StatusBadge status={user.status} />
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <InfoCard icon={<Mail size={14} />} label="Email" value={user.email} />
                <InfoCard
                  icon={<Hash size={14} />}
                  label="Unit"
                  value={user.unit ?? "—"}
                />
                <InfoCard
                  icon={<Calendar size={14} />}
                  label="Tanggal Bergabung"
                  value={user.joinedAt ? formatTanggal(user.joinedAt) : "—"}
                />
                <InfoCard
                  icon={<Calendar size={14} />}
                  label="Dibuat"
                  value={formatTanggal(user.createdAt)}
                />
              </div>

              {/* Stats (cuma untuk user, bukan admin) */}
              {user.role === "user" && (
                <div>
                  <h4 className="font-medium text-sm mb-3">
                    Aktivitas Pembelajaran
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <StatBox
                      icon={<BookOpen size={16} className="text-blue-600" />}
                      value={user._count.learningProgress}
                      label="SOP Dipelajari"
                    />
                    <StatBox
                      icon={<FileText size={16} className="text-purple-600" />}
                      value={user._count.sosialisasiAttachments}
                      label="Bukti Upload"
                    />
                    <StatBox
                      icon={<Award size={16} className="text-green-600" />}
                      value={user._count.postTestResults}
                      label="Post Test"
                    />
                  </div>
                </div>
              )}

              {/* Note tentang password */}
              <div className="bg-muted/40 rounded-xl p-4 border text-xs text-muted-foreground">
                <p>
                  <strong>Catatan keamanan:</strong> Password user tidak ditampilkan
                  (di-hash dengan bcrypt). Untuk mengatur ulang password, gunakan tombol{" "}
                  <strong>Edit</strong>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t bg-muted/20 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub Components ──────────────────────────────────────────────────

function UserIcon({
  tipeUser,
  role,
}: {
  tipeUser: "store" | "department" | null;
  role: string;
}) {
  if (role === "admin" || role === "superadmin") {
    return (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
        <Shield size={28} />
      </div>
    );
  }
  if (tipeUser === "store") {
    return (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-lg">
        <Store size={28} />
      </div>
    );
  }
  if (tipeUser === "department") {
    return (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center shadow-lg">
        <Building2 size={28} />
      </div>
    );
  }
  return (
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-600 text-white flex items-center justify-center shadow-lg text-xl font-bold">
      ?
    </div>
  );
}

function TipeBadge({
  tipeUser,
  role,
}: {
  tipeUser: "store" | "department" | null;
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
  if (tipeUser === "store") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-blue-50 text-blue-700 border-blue-200">
        <Store size={10} /> Store
      </span>
    );
  }
  if (tipeUser === "department") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-purple-50 text-purple-700 border-purple-200">
        <Building2 size={10} /> Department
      </span>
    );
  }
  return null;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "aktif") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-green-50 text-green-700 border-green-200">
        <CheckCircle2 size={10} /> Aktif
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-muted text-muted-foreground border-border">
      <XCircle size={10} /> Nonaktif
    </span>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 border">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon} {label}
      </div>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  );
}

function StatBox({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-background rounded-xl border p-4 text-center">
      <div className="flex items-center justify-center mb-2">{icon}</div>
      <div className="font-display font-bold text-2xl">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
