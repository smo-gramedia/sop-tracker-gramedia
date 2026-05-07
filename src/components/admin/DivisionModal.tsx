"use client";

// src/components/admin/DivisionModal.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { createDivision, updateDivision } from "@/actions/org-actions";

type DivisionData = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  directorateId: string;
};

type Directorate = {
  id: string;
  nama: string;
  singkatan: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  data: DivisionData | null;
  directorates: Directorate[];
};

export default function DivisionModal({
  open,
  onClose,
  data,
  directorates,
}: Props) {
  const router = useRouter();
  const isEdit = !!data;
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [directorateId, setDirectorateId] = useState("");

  useEffect(() => {
    if (open) {
      setKode(data?.kode ?? "");
      setNama(data?.nama ?? "");
      setDeskripsi(data?.deskripsi ?? "");
      setDirectorateId(data?.directorateId ?? "");
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
      if (!directorateId) throw new Error("Directorate wajib dipilih");

      const payload = {
        kode: kode.trim(),
        nama: nama.trim(),
        deskripsi: deskripsi.trim() || undefined,
        directorateId,
      };

      if (isEdit && data) {
        await updateDivision(data.id, payload);
      } else {
        await createDivision(payload);
      }

      onClose();
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan";
      if (msg.includes("Unique") || msg.includes("unique")) {
        setErrorMsg(`Kode "${kode}" sudah digunakan.`);
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
            {isEdit ? "Edit Division" : "Tambah Division"}
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
          <div className="space-y-1.5">
            <Label>
              Directorate <span className="text-destructive">*</span>
            </Label>
            <Select
              value={directorateId}
              onValueChange={setDirectorateId}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Pilih Directorate --" />
              </SelectTrigger>
              <SelectContent>
                {directorates.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    Belum ada directorate. Tambahkan dulu di tab Directorate.
                  </div>
                ) : (
                  directorates.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.singkatan ? `${d.singkatan} — ` : ""}
                      {d.nama}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="div-kode">
              Kode <span className="text-destructive">*</span>
            </Label>
            <Input
              id="div-kode"
              value={kode}
              onChange={(e) => setKode(e.target.value.toUpperCase())}
              placeholder="GORP-RETAIL"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="div-nama">
              Nama Division <span className="text-destructive">*</span>
            </Label>
            <Input
              id="div-nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Retail Division"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="div-deskripsi">Deskripsi</Label>
            <textarea
              id="div-deskripsi"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Deskripsi singkat division..."
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
                : "Tambah Division"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
