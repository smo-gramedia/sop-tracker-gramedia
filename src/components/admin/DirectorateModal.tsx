"use client";

// src/components/admin/DirectorateModal.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import {
  createDirectorate,
  updateDirectorate,
} from "@/actions/org-actions";

type DirectorateData = {
  id: string;
  kode: string;
  singkatan: string | null;
  nama: string;
  companyGroup: string | null;
  deskripsi: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  // Mode edit: pass existing data; mode create: pass null
  data: DirectorateData | null;
};

export default function DirectorateModal({ open, onClose, data }: Props) {
  const router = useRouter();
  const isEdit = !!data;
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [kode, setKode] = useState("");
  const [singkatan, setSingkatan] = useState("");
  const [nama, setNama] = useState("");
  const [companyGroup, setCompanyGroup] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  // Reset form when modal opens / data changes
  useEffect(() => {
    if (open) {
      setKode(data?.kode ?? "");
      setSingkatan(data?.singkatan ?? "");
      setNama(data?.nama ?? "");
      setCompanyGroup(data?.companyGroup ?? "");
      setDeskripsi(data?.deskripsi ?? "");
      setErrorMsg(null);
    }
  }, [open, data]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      if (!kode.trim()) throw new Error("Kode wajib diisi");
      if (!nama.trim()) throw new Error("Nama wajib diisi");

      const payload = {
        kode: kode.trim(),
        nama: nama.trim(),
        singkatan: singkatan.trim() || undefined,
        companyGroup: companyGroup.trim() || undefined,
        deskripsi: deskripsi.trim() || undefined,
      };

      if (isEdit && data) {
        await updateDirectorate(data.id, payload);
      } else {
        await createDirectorate(payload);
      }

      onClose();
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan";
      // Detect unique constraint
      if (msg.includes("Unique") || msg.includes("unique")) {
        setErrorMsg(`Kode "${kode}" sudah digunakan. Pakai kode lain.`);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="bg-background rounded-2xl border w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display font-bold text-lg">
            {isEdit ? "Edit Directorate" : "Tambah Directorate"}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dir-kode">
                Kode <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dir-kode"
                value={kode}
                onChange={(e) => setKode(e.target.value.toUpperCase())}
                placeholder="CST"
                required
                disabled={saving}
              />
              <p className="text-[11px] text-muted-foreground">
                Identifier unik
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dir-singkatan">Singkatan</Label>
              <Input
                id="dir-singkatan"
                value={singkatan}
                onChange={(e) => setSingkatan(e.target.value)}
                placeholder="CST"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dir-nama">
              Nama Lengkap <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dir-nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Customer Service & Technology"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dir-cg">Company Group</Label>
            <Input
              id="dir-cg"
              value={companyGroup}
              onChange={(e) => setCompanyGroup(e.target.value)}
              placeholder="Kompas Gramedia"
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dir-deskripsi">Deskripsi</Label>
            <textarea
              id="dir-deskripsi"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Deskripsi singkat directorate..."
              disabled={saving}
              className="w-full border rounded-lg p-3 text-sm min-h-[70px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Menyimpan..."
                : isEdit
                ? "Simpan Perubahan"
                : "Tambah Directorate"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
