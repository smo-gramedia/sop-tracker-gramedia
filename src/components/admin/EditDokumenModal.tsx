// src/components/admin/EditDokumenModal.tsx
"use client";
import { useEffect, useState } from "react";
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
import { updateSopDocument, getSopFiles } from "@/actions/sop-document";
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

type FileRec = {
  id: string;
  filename: string;
  mimeType: string;
  ukuranKb: number;
  tipe?: string;
};
type SopFiles = {
  utama: FileRec | null;
  raw: FileRec | null;
  lampiran: FileRec[];
};

const basename = (p: string) => p.split("/").pop() || p;

function FileReplaceRow({
  title,
  filename,
  sizeKb,
  accept,
  busy,
  disabled,
  onPick,
}: {
  title: string;
  filename: string | null;
  sizeKb?: number;
  accept: string;
  busy: boolean;
  disabled: boolean;
  onPick: (file: File) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 border rounded-lg text-sm">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{title}</p>
        {filename ? (
          <p className="truncate font-medium">
            {filename}
            {sizeKb != null && (
              <span className="text-[11px] text-muted-foreground ml-1">
                ({(sizeKb / 1024).toFixed(2)} MB)
              </span>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground italic">Belum ada file</p>
        )}
      </div>
      <label className="flex-shrink-0">
        <span
          className={`inline-flex items-center h-7 px-2.5 text-xs rounded-md border transition-colors ${
            disabled || busy
              ? "opacity-50 pointer-events-none"
              : "cursor-pointer hover:bg-muted"
          }`}
        >
          {busy ? "Mengganti..." : "Ganti File"}
        </span>
        <input
          type="file"
          accept={accept}
          hidden
          disabled={disabled || busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

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

  // E3: state untuk daftar file & proses ganti file
  const [files, setFiles] = useState<SopFiles | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const sopId = sop?.id;
  useEffect(() => {
    if (!open || !sopId) return;
    let active = true;
    setLoadingFiles(true);
    setFileError(null);
    setFiles(null);
    getSopFiles(sopId)
      .then((f) => {
        if (active) setFiles(f as SopFiles);
      })
      .catch(() => {
        if (active) setFileError("Gagal memuat daftar file.");
      })
      .finally(() => {
        if (active) setLoadingFiles(false);
      });
    return () => {
      active = false;
    };
  }, [open, sopId]);

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

  async function replaceFile(
    rec: FileRec,
    opts: {
      bucket: "raw-documents" | "sop-attachments";
      tipe: "raw" | "attachment";
      attachmentTipe?: "utama" | "lampiran";
    },
    file: File
  ) {
    if (!sop) return;
    setReplacingId(rec.id);
    setFileError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", opts.bucket);
      fd.append("tipe", opts.tipe);
      fd.append("sopDocumentId", sop.id);
      fd.append("replaceId", rec.id);
      if (opts.attachmentTipe) fd.append("attachmentTipe", opts.attachmentTipe);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const raw = await res.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        throw new Error(
          data.error || `Gagal mengganti file (HTTP ${res.status}).`
        );
      }

      const fresh = await getSopFiles(sop.id);
      setFiles(fresh as SopFiles);
      router.refresh();
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Gagal mengganti file.");
    } finally {
      setReplacingId(null);
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

          {/* File Dokumen — Ganti File (E3) */}
          <div className="space-y-2 pt-2 border-t">
            <Label>File Dokumen</Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Ganti file bila ada revisi isi atau salah upload. File lama akan
              otomatis diganti dengan yang baru.
            </p>
            {loadingFiles ? (
              <p className="text-sm text-muted-foreground py-2">Memuat file…</p>
            ) : files ? (
              <div className="space-y-1.5">
                <FileReplaceRow
                  title="PDF Utama"
                  filename={files.utama ? basename(files.utama.filename) : null}
                  sizeKb={files.utama?.ukuranKb}
                  accept=".pdf,application/pdf"
                  busy={replacingId === files.utama?.id}
                  disabled={!files.utama || replacingId !== null}
                  onPick={(f) =>
                    files.utama &&
                    replaceFile(
                      files.utama,
                      {
                        bucket: "sop-attachments",
                        tipe: "attachment",
                        attachmentTipe: "utama",
                      },
                      f
                    )
                  }
                />
                <FileReplaceRow
                  title="Raw Dokumen (.docx)"
                  filename={files.raw ? basename(files.raw.filename) : null}
                  sizeKb={files.raw?.ukuranKb}
                  accept=".doc,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  busy={replacingId === files.raw?.id}
                  disabled={!files.raw || replacingId !== null}
                  onPick={(f) =>
                    files.raw &&
                    replaceFile(
                      files.raw,
                      { bucket: "raw-documents", tipe: "raw" },
                      f
                    )
                  }
                />
                {files.lampiran.map((lmp) => (
                  <FileReplaceRow
                    key={lmp.id}
                    title="Lampiran"
                    filename={basename(lmp.filename)}
                    sizeKb={lmp.ukuranKb}
                    accept=".pdf,.zip,.docx,.xlsx,.jpg,.jpeg,.png"
                    busy={replacingId === lmp.id}
                    disabled={replacingId !== null}
                    onPick={(f) =>
                      replaceFile(
                        lmp,
                        {
                          bucket: "sop-attachments",
                          tipe: "attachment",
                          attachmentTipe: "lampiran",
                        },
                        f
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                {fileError ?? "Tidak ada file."}
              </p>
            )}
            {fileError && files && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-2.5 text-xs text-destructive">
                {fileError}
              </div>
            )}
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
