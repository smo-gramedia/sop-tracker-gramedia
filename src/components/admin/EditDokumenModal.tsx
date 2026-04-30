// src/components/admin/EditDokumenModal.tsx
"use client";
import { useState } from "react";
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
import { updateSopDocument } from "@/actions/sop-document";
import { SOP_KATEGORI_LABEL, SOP_TIPE_LABEL } from "@/lib/constants";

type Doc = {
  id: string;
  kode: string;
  judul: string;
  deskripsi: string | null;
  kategori: string;
  tipe: string;
  status: string;
  versi: string;
  permittedAccess: string | null;
  subcategoryId: string | null;
  departmentId: string | null;
  tanggalBerlaku: Date | string | null;
  department?: { nama: string } | null;
};

type Department = { id: string; nama: string; kode: string };
type Subcategory = { id: string; kode: string; nama: string };

type Props = {
  open: boolean;
  onClose: () => void;
  sop: Doc | null;
  departments: Department[];
  subcategories: Subcategory[];
};

export default function EditDokumenModal({
  open,
  onClose,
  sop,
  departments,
  subcategories,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !sop) return null;

  // Format tanggal untuk input type=date (YYYY-MM-DD)
  const tanggalBerlakuStr = sop.tanggalBerlaku
    ? typeof sop.tanggalBerlaku === "string"
      ? sop.tanggalBerlaku.split("T")[0]
      : sop.tanggalBerlaku.toISOString().split("T")[0]
    : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sop) return;
    setError(null);
    setSaving(true);

    try {
      const fd = new FormData(e.currentTarget);
      // Pastikan field structure (kategori/tipe/department/subcategory) tetap dikirim
      // walau read-only di UI (supaya tidak hilang di update)
      fd.set("kategori", sop.kategori);
      fd.set("tipe", sop.tipe);
      if (sop.departmentId) fd.set("departmentId", sop.departmentId);
      if (sop.subcategoryId) fd.set("subcategoryId", sop.subcategoryId);

      await updateSopDocument(sop.id, fd);
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal update");
    } finally {
      setSaving(false);
    }
  }

  const currentDepartment = departments.find((d) => d.id === sop.departmentId);
  const currentSubcategory = subcategories.find(
    (s) => s.id === sop.subcategoryId,
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background z-10">
          <div>
            <h2 className="font-display font-bold text-xl">
              Edit Dokumen SOP
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {sop.kode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Read-only structural info */}
          <div className="bg-muted/40 rounded-lg p-4 space-y-1.5 text-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Klasifikasi (read-only)
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
              <span>
                <span className="text-muted-foreground">Kategori:</span>{" "}
                <strong>
                  {SOP_KATEGORI_LABEL[sop.kategori] ?? sop.kategori}
                </strong>
              </span>
              <span>
                <span className="text-muted-foreground">Tipe:</span>{" "}
                <strong>{SOP_TIPE_LABEL[sop.tipe] ?? sop.tipe}</strong>
              </span>
              {currentDepartment && (
                <span>
                  <span className="text-muted-foreground">Departemen:</span>{" "}
                  <strong>{currentDepartment.nama}</strong>
                </span>
              )}
              {currentSubcategory && (
                <span>
                  <span className="text-muted-foreground">Sub-Kategori:</span>{" "}
                  <strong>{currentSubcategory.nama}</strong>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Untuk mengubah kategori/tipe/departemen, hapus dokumen ini lalu
              buat ulang.
            </p>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="kode">Kode</Label>
              <Input
                id="kode"
                name="kode"
                defaultValue={sop.kode}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="versi">Versi</Label>
              <Input
                id="versi"
                name="versi"
                defaultValue={sop.versi}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="judul">Judul Dokumen</Label>
            <Input
              id="judul"
              name="judul"
              defaultValue={sop.judul}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <textarea
              id="deskripsi"
              name="deskripsi"
              defaultValue={sop.deskripsi ?? ""}
              className="w-full border rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="permittedAccess">
              Permitted Access{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (mis: all, store-only)
              </span>
            </Label>
            <Input
              id="permittedAccess"
              name="permittedAccess"
              defaultValue={sop.permittedAccess ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tanggalBerlaku">Tanggal Berlaku</Label>
              <Input
                id="tanggalBerlaku"
                name="tanggalBerlaku"
                type="date"
                defaultValue={tanggalBerlakuStr}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select name="status" defaultValue={sop.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="obsolete">Obsolete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
