// src/components/admin/TambahDokumenModal.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { createSopDocument } from "@/actions/sop-document";

type Dept        = { id: string; nama: string; kode: string };
type Division    = { id: string; nama: string; departments: Dept[] };
type Directorate = { id: string; nama: string; singkatan: string | null; divisions: Division[] };
type Subcategory = { id: string; kode: string; nama: string };

type Props = {
  open: boolean;
  onClose: () => void;
  directorates: Directorate[];
  subcategories: Subcategory[];
};

export default function TambahDokumenModal({ open, onClose, directorates, subcategories }: Props) {
  const router = useRouter();
  const [saving, setSaving]         = useState(false);
  const [kategori, setKategori]     = useState("");
  const [tipe, setTipe]             = useState("");
  const [dirId, setDirId]           = useState("");
  const [divId, setDivId]           = useState("");
  const [deptId, setDeptId]         = useState("");
  const [subkatId, setSubkatId]     = useState("");

  // Derived lists
  const divisions   = directorates.find(d => d.id === dirId)?.divisions ?? [];
  const departments = divisions.find(d => d.id === divId)?.departments ?? [];

  // Reset cascades
  useEffect(() => { setDivId(""); setDeptId(""); }, [dirId]);
  useEffect(() => { setDeptId(""); }, [divId]);

  const isFixed   = kategori === "petunjuk" || kategori === "sg";
  const showOrg   = !isFixed && !!kategori;
  const showSubkat= kategori === "sg";

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    if (deptId)   fd.set("departmentId",  deptId);
    if (subkatId) fd.set("subcategoryId", subkatId);
    await createSopDocument(fd);
    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background">
          <h2 className="font-display font-bold text-xl">Tambah Dokumen</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Kategori SOP */}
          <div className="space-y-1.5">
            <Label>Kategori SOP <span className="text-xs text-muted-foreground font-normal">(menentukan halaman tujuan)</span></Label>
            <Select name="kategori" onValueChange={v => { setKategori(v); setTipe(""); }} required>
              <SelectTrigger><SelectValue placeholder="-- Pilih Kategori SOP --"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="sr">SOP Operation</SelectItem>
                <SelectItem value="ss">SOP Supporting Unit</SelectItem>
                <SelectItem value="sp">SOP Publishing &amp; Education</SelectItem>
                <SelectItem value="sg">SOP General</SelectItem>
                <SelectItem value="petunjuk">Petunjuk Pelaksanaan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipe Dokumen — hidden for petunjuk */}
          {kategori && kategori !== "petunjuk" && (
            <div className="space-y-1.5">
              <Label>Tipe Dokumen <span className="text-xs text-muted-foreground font-normal">(format)</span></Label>
              <Select name="tipe" onValueChange={setTipe} required>
                <SelectTrigger><SelectValue placeholder="-- Pilih Tipe --"/></SelectTrigger>
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

          {/* Sub-Kategori — only for SOP General */}
          {showSubkat && (
            <div className="space-y-1.5">
              <Label>Sub-Kategori</Label>
              <Select onValueChange={setSubkatId}>
                <SelectTrigger><SelectValue placeholder="-- Pilih Sub-Kategori --"/></SelectTrigger>
                <SelectContent>
                  {subcategories.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.kode} — {s.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Org fields */}
          {showOrg && (
            <div className="space-y-4 border rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Klasifikasi Organisasi</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Directorate</Label>
                  <Select onValueChange={setDirId}>
                    <SelectTrigger><SelectValue placeholder="-- Pilih Directorate --"/></SelectTrigger>
                    <SelectContent>
                      {directorates.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.singkatan ? `${d.singkatan} — ` : ""}{d.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Division</Label>
                  <Select onValueChange={setDivId} disabled={!dirId}>
                    <SelectTrigger><SelectValue placeholder="-- Pilih Division --"/></SelectTrigger>
                    <SelectContent>
                      {divisions.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Departemen</Label>
                <Select onValueChange={setDeptId} disabled={!divId}>
                  <SelectTrigger><SelectValue placeholder="-- Pilih Departemen --"/></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.kode} — {d.nama}</SelectItem>
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
              <Input id="kode" name="kode" placeholder="MP/COM/04" required/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="versi">Versi</Label>
              <Input id="versi" name="versi" placeholder="Original" defaultValue="Original"/>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="judul">Judul Dokumen</Label>
            <Input id="judul" name="judul" placeholder="Pembayaran Tagihan PO" required/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <textarea id="deskripsi" name="deskripsi"
              placeholder="Deskripsi singkat dokumen..."
              className="w-full border rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tanggalBerlaku">Tanggal Berlaku</Label>
              <Input id="tanggalBerlaku" name="tanggalBerlaku" type="date"/>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select name="status" defaultValue="draft">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="obsolete">Obsolete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload zones */}
          <div className="space-y-2">
            {[
              { icon:"📄", label:"Upload Dokumen", ext:".pdf" },
              { icon:"📝", label:"Upload Raw Dokumen", ext:".docx — masuk ke Raw Dokumen" },
              { icon:"📎", label:"Upload Lampiran",  ext:".zip" },
            ].map(z => (
              <label key={z.label} className="flex items-center gap-3 border-2 border-dashed rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                <span className="text-xl">{z.icon}</span>
                <div>
                  <div className="text-sm font-medium">{z.label}</div>
                  <div className="text-xs text-muted-foreground">{z.ext}</div>
                </div>
                <input type="file" className="hidden"/>
              </label>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Tambah Dokumen"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
