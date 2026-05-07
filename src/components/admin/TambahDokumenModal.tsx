"use client";

// src/components/admin/TambahDokumenModal.tsx
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
import { X, FileText, Paperclip, FileBox, Trash2, Plus } from "lucide-react";
import { createSopDocument } from "@/actions/sop-document";

type Dept = { id: string; nama: string; kode: string };
type Division = { id: string; nama: string; departments: Dept[] };
type Directorate = {
  id: string;
  nama: string;
  singkatan: string | null;
  divisions: Division[];
};
type Subcategory = { id: string; kode: string; nama: string };

type Props = {
  open: boolean;
  onClose: () => void;
  directorates: Directorate[];
  subcategories: Subcategory[];
};

type UploadProgress = {
  step:
    | "idle"
    | "creating"
    | "uploading-utama"
    | "uploading-raw"
    | "uploading-lampiran"
    | "done"
    | "error";
  message: string;
  filesUploaded: number;
  filesTotal: number;
};

export default function TambahDokumenModal({
  open,
  onClose,
  directorates,
  subcategories,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Form state
  const [kategori, setKategori] = useState("");
  const [tipe, setTipe] = useState("");
  const [dirId, setDirId] = useState("");
  const [divId, setDivId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [subkatId, setSubkatId] = useState("");

  // File state
  const [pdfUtama, setPdfUtama] = useState<File | null>(null);
  const [rawDoc, setRawDoc] = useState<File | null>(null);
  const [lampiran, setLampiran] = useState<File[]>([]);

  // Progress state
  const [progress, setProgress] = useState<UploadProgress>({
    step: "idle",
    message: "",
    filesUploaded: 0,
    filesTotal: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derived
  const divisions = directorates.find((d) => d.id === dirId)?.divisions ?? [];
  const departments = divisions.find((d) => d.id === divId)?.departments ?? [];

  useEffect(() => {
    setDivId("");
    setDeptId("");
  }, [dirId]);
  useEffect(() => {
    setDeptId("");
  }, [divId]);

  const isFixed = kategori === "petunjuk" || kategori === "sg";
  const showOrg = !isFixed && !!kategori;
  const showSubkat = kategori === "sg";

  if (!open) return null;

  function resetState() {
    setKategori("");
    setTipe("");
    setDirId("");
    setDivId("");
    setDeptId("");
    setSubkatId("");
    setPdfUtama(null);
    setRawDoc(null);
    setLampiran([]);
    setProgress({ step: "idle", message: "", filesUploaded: 0, filesTotal: 0 });
    setErrorMsg(null);
  }

  function handleClose() {
    if (saving) {
      if (!confirm("Upload sedang berjalan. Yakin ingin batal?")) return;
    }
    resetState();
    onClose();
  }

  async function uploadFile(
    sopId: string,
    file: File,
    config: {
      bucket: "raw-documents" | "sop-attachments";
      tipe: "raw" | "attachment";
      attachmentTipe?: "utama" | "lampiran";
    }
  ): Promise<void> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", config.bucket);
    fd.append("tipe", config.tipe);
    fd.append("sopDocumentId", sopId);
    if (config.attachmentTipe) {
      fd.append("attachmentTipe", config.attachmentTipe);
    }

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `Upload "${file.name}" gagal: ${data.error || res.status}`
      );
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      // Validasi: minimal 1 PDF utama wajib (kalau kategori bukan petunjuk)
      if (kategori !== "petunjuk" && !pdfUtama) {
        throw new Error("PDF utama wajib di-upload.");
      }

      // STEP 1: Create SOP document
      const totalFiles =
        (pdfUtama ? 1 : 0) + (rawDoc ? 1 : 0) + lampiran.length;

      setProgress({
        step: "creating",
        message: "Membuat data SOP...",
        filesUploaded: 0,
        filesTotal: totalFiles,
      });

      const fd = new FormData(e.currentTarget);
      if (deptId) fd.set("departmentId", deptId);
      if (subkatId) fd.set("subcategoryId", subkatId);

      // Default tipe untuk petunjuk
      if (kategori === "petunjuk") {
        fd.set("tipe", "petunjuk");
      }

      const result = await createSopDocument(fd);
      if (!result?.id) {
        throw new Error("Gagal membuat SOP");
      }

      const sopId = result.id;

      // STEP 2: Upload PDF utama
      let uploaded = 0;
      if (pdfUtama) {
        setProgress({
          step: "uploading-utama",
          message: `Upload PDF utama: ${pdfUtama.name}...`,
          filesUploaded: uploaded,
          filesTotal: totalFiles,
        });
        await uploadFile(sopId, pdfUtama, {
          bucket: "sop-attachments",
          tipe: "attachment",
          attachmentTipe: "utama",
        });
        uploaded++;
      }

      // STEP 3: Upload Raw Doc
      if (rawDoc) {
        setProgress({
          step: "uploading-raw",
          message: `Upload Raw Dokumen: ${rawDoc.name}...`,
          filesUploaded: uploaded,
          filesTotal: totalFiles,
        });
        await uploadFile(sopId, rawDoc, {
          bucket: "raw-documents",
          tipe: "raw",
        });
        uploaded++;
      }

      // STEP 4: Upload Lampiran (sequential)
      for (let i = 0; i < lampiran.length; i++) {
        const file = lampiran[i];
        setProgress({
          step: "uploading-lampiran",
          message: `Upload Lampiran (${i + 1}/${lampiran.length}): ${file.name}...`,
          filesUploaded: uploaded,
          filesTotal: totalFiles,
        });
        await uploadFile(sopId, file, {
          bucket: "sop-attachments",
          tipe: "attachment",
          attachmentTipe: "lampiran",
        });
        uploaded++;
      }

      // DONE
      setProgress({
        step: "done",
        message: "Berhasil!",
        filesUploaded: uploaded,
        filesTotal: uploaded,
      });

      setTimeout(() => {
        resetState();
        onClose();
        router.refresh();
        setSaving(false);
      }, 800);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan";
      setErrorMsg(msg);
      setProgress((prev) => ({
        ...prev,
        step: "error",
        message: msg,
      }));
      setSaving(false);
    }
  }

  function removeLampiran(idx: number) {
    setLampiran((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background z-10">
          <h2 className="font-display font-bold text-xl">Tambah Dokumen</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Kategori SOP */}
          <div className="space-y-1.5">
            <Label>
              Kategori SOP{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (menentukan halaman tujuan)
              </span>
            </Label>
            <Select
              name="kategori"
              onValueChange={(v) => {
                setKategori(v);
                setTipe("");
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Pilih Kategori SOP --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sr">SOP Operation</SelectItem>
                <SelectItem value="ss">SOP Supporting Unit</SelectItem>
                <SelectItem value="sp">SOP Publishing &amp; Education</SelectItem>
                <SelectItem value="sg">SOP General</SelectItem>
                <SelectItem value="petunjuk">Petunjuk Pelaksanaan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipe Dokumen */}
          {kategori && kategori !== "petunjuk" && (
            <div className="space-y-1.5">
              <Label>
                Tipe Dokumen{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (format)
                </span>
              </Label>
              <Select name="tipe" onValueChange={setTipe} required>
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Tipe --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MP">Manual Prosedur</SelectItem>
                  <SelectItem value="PS">Panduan / Standar</SelectItem>
                  <SelectItem value="IK">Instruksi Kerja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Hint fixed kategori */}
          {isFixed && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              {kategori === "petunjuk"
                ? "Petunjuk Pelaksanaan memiliki halaman tersendiri — Directorate, Division, dan Departemen tidak diperlukan."
                : "SOP General memiliki halaman tersendiri — Directorate, Division, dan Departemen tidak diperlukan."}
            </div>
          )}

          {/* Sub-Kategori */}
          {showSubkat && (
            <div className="space-y-1.5">
              <Label>Sub-Kategori</Label>
              <Select onValueChange={setSubkatId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Sub-Kategori --" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.kode} — {s.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Org fields */}
          {showOrg && (
            <div className="space-y-4 border rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Klasifikasi Organisasi
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Directorate</Label>
                  <Select onValueChange={setDirId}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Pilih Directorate --" />
                    </SelectTrigger>
                    <SelectContent>
                      {directorates.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.singkatan ? `${d.singkatan} — ` : ""}
                          {d.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Division</Label>
                  <Select onValueChange={setDivId} disabled={!dirId}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Pilih Division --" />
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Departemen</Label>
                <Select onValueChange={setDeptId} disabled={!divId}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Pilih Departemen --" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.kode} — {d.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Base fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="kode">Kode</Label>
              <Input id="kode" name="kode" placeholder="MP/COM/04" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="versi">Versi</Label>
              <Input
                id="versi"
                name="versi"
                placeholder="Original"
                defaultValue="Original"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="judul">Judul Dokumen</Label>
            <Input
              id="judul"
              name="judul"
              placeholder="Pembayaran Tagihan PO"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <textarea
              id="deskripsi"
              name="deskripsi"
              placeholder="Deskripsi singkat dokumen..."
              className="w-full border rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tanggalBerlaku">Tanggal Berlaku</Label>
              <Input id="tanggalBerlaku" name="tanggalBerlaku" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select name="status" defaultValue="draft">
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

          {/* Upload zones */}
          <div className="border-t pt-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              File Dokumen
            </p>

            {/* PDF Utama */}
            <FileUploadZone
              icon={FileText}
              label="PDF Dokumen SOP"
              hint={
                kategori === "petunjuk"
                  ? "PDF petunjuk — opsional"
                  : "PDF utama yang akan dibaca user (wajib)"
              }
              accept=".pdf,application/pdf"
              file={pdfUtama}
              onChange={setPdfUtama}
              required={kategori !== "petunjuk"}
              maxSizeMb={50}
            />

            {/* Raw Doc */}
            <FileUploadZone
              icon={FileBox}
              label="Raw Dokumen (Editable)"
              hint=".docx — file sumber editable, hanya admin"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              file={rawDoc}
              onChange={setRawDoc}
              maxSizeMb={50}
            />

            {/* Lampiran (multiple) */}
            <div className="border-2 border-dashed rounded-xl p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <Paperclip size={20} className="text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Lampiran (Multiple)</div>
                  <div className="text-xs text-muted-foreground">
                    .pdf, .zip, .docx, .xlsx, .jpg, .png · Maks 50MB per file
                  </div>
                </div>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md border hover:bg-muted">
                    <Plus size={12} /> Tambah
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.zip,.docx,.xlsx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      setLampiran((prev) => [...prev, ...files]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {lampiran.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {lampiran.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/40 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Paperclip
                          size={12}
                          className="text-muted-foreground flex-shrink-0"
                        />
                        <span className="truncate">{f.name}</span>
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">
                          ({(f.size / 1024 / 1024).toFixed(2)}MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLampiran(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {saving && progress.step !== "idle" && progress.step !== "error" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">
                  {progress.message}
                </span>
                {progress.filesTotal > 0 && (
                  <span className="text-xs text-blue-600">
                    {progress.filesUploaded}/{progress.filesTotal}
                  </span>
                )}
              </div>
              <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{
                    width:
                      progress.filesTotal > 0
                        ? `${(progress.filesUploaded / progress.filesTotal) * 100}%`
                        : progress.step === "creating"
                        ? "20%"
                        : "0%",
                  }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
              <strong>Error:</strong> {errorMsg}
              <p className="text-xs mt-1 text-destructive/80">
                SOP mungkin sudah ter-create tapi upload gagal. Cek di tabel
                Upload Dokumen, hapus dan coba lagi.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Tambah Dokumen"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// File upload zone (single file)
function FileUploadZone({
  icon: Icon,
  label,
  hint,
  accept,
  file,
  onChange,
  required,
  maxSizeMb,
}: {
  icon: React.ElementType;
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
  required?: boolean;
  maxSizeMb: number;
}) {
  function handleFile(f: File | null) {
    if (!f) {
      onChange(null);
      return;
    }
    if (f.size > maxSizeMb * 1024 * 1024) {
      alert(`File terlalu besar (maks ${maxSizeMb}MB)`);
      return;
    }
    onChange(f);
  }

  return (
    <label className="flex items-center gap-3 border-2 border-dashed rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors mb-2">
      <Icon size={20} className="text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium flex items-center gap-1.5">
          {label}
          {required && (
            <span className="text-[10px] text-destructive font-normal">
              *wajib
            </span>
          )}
        </div>
        {file ? (
          <div className="text-xs text-green-600 truncate flex items-center gap-2">
            ✓ {file.name}{" "}
            <span className="text-muted-foreground">
              ({(file.size / 1024 / 1024).toFixed(2)}MB)
            </span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">{hint}</div>
        )}
      </div>
      {file && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onChange(null);
          }}
          className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
        >
          <Trash2 size={14} />
        </button>
      )}
      <input
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
