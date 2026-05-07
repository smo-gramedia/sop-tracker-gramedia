"use client";

// src/components/admin/DepartmentModal.tsx
import { useState, useEffect, useMemo } from "react";
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
import { createDepartment, updateDepartment } from "@/actions/org-actions";

type DepartmentData = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  divisionId: string;
};

type Directorate = {
  id: string;
  nama: string;
  singkatan: string | null;
  divisions: { id: string; nama: string; directorateId: string }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  data: DepartmentData | null;
  directorates: Directorate[];
};

export default function DepartmentModal({
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
  const [divisionId, setDivisionId] = useState("");

  // Find which directorate the current division belongs to (for edit mode)
  useEffect(() => {
    if (open) {
      setKode(data?.kode ?? "");
      setNama(data?.nama ?? "");
      setDeskripsi(data?.deskripsi ?? "");
      setDivisionId(data?.divisionId ?? "");

      if (data?.divisionId) {
        // Find parent directorate
        for (const dir of directorates) {
          const div = dir.divisions.find((d) => d.id === data.divisionId);
          if (div) {
            setDirectorateId(dir.id);
            break;
          }
        }
      } else {
        setDirectorateId("");
      }
      setErrorMsg(null);
    }
  }, [open, data, directorates]);

  // Reset divisionId when directorate changes (and not in edit mode init)
  const availableDivisions = useMemo(() => {
    if (!directorateId) return [];
    return (
      directorates.find((d) => d.id === directorateId)?.divisions ?? []
    );
  }, [directorateId, directorates]);

  // Auto-clear division if it doesn't belong to selected directorate
  useEffect(() => {
    if (!divisionId) return;
    const exists = availableDivisions.some((d) => d.id === divisionId);
    if (!exists) setDivisionId("");
  }, [availableDivisions, divisionId]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      if (!kode.trim()) throw new Error("Kode wajib diisi");
      if (!nama.trim()) throw new Error("Nama wajib diisi");
      if (!divisionId) throw new Error("Division wajib dipilih");

      const payload = {
        kode: kode.trim(),
        nama: nama.trim(),
        deskripsi: deskripsi.trim() || undefined,
        divisionId,
      };

      if (isEdit && data) {
        await updateDepartment(data.id, payload);
      } else {
        await createDepartment(payload);
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
            {isEdit ? "Edit Department" : "Tambah Department"}
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
              <Label>
                Directorate <span className="text-destructive">*</span>
              </Label>
              <Select
                value={directorateId}
                onValueChange={setDirectorateId}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih --" />
                </SelectTrigger>
                <SelectContent>
                  {directorates.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.singkatan ?? d.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Division <span className="text-destructive">*</span>
              </Label>
              <Select
                value={divisionId}
                onValueChange={setDivisionId}
                disabled={saving || !directorateId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !directorateId
                        ? "Pilih directorate dulu"
                        : "-- Pilih --"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableDivisions.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      Tidak ada division
                    </div>
                  ) : (
                    availableDivisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nama}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept-kode">
              Kode <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dept-kode"
              value={kode}
              onChange={(e) => setKode(e.target.value.toUpperCase())}
              placeholder="STOR"
              required
              disabled={saving}
            />
            <p className="text-[11px] text-muted-foreground">
              Identifier unik (mis: STOR, FIN, EDIT)
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept-nama">
              Nama Department <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dept-nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Store Operations Department"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept-deskripsi">Deskripsi</Label>
            <textarea
              id="dept-deskripsi"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Deskripsi singkat department..."
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
                : "Tambah Department"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
