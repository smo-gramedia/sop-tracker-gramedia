// src/components/admin/KategoriClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { createSopSubcategory, updateSopSubcategory, deleteSopSubcategory } from "@/actions/org-actions";

type Sub = { id:string; kode:string; nama:string; deskripsi:string|null; _count:{ sopDocuments:number } };

export default function KategoriClient({ subcategories }: { subcategories: Sub[] }) {
  const router = useRouter();
  const [modal,   setModal]   = useState<"tambah"|"edit"|null>(null);
  const [editing, setEditing] = useState<Sub|null>(null);
  const [kode,    setKode]    = useState("");
  const [nama,    setNama]    = useState("");
  const [desk,    setDesk]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  function openEdit(s: Sub) { setEditing(s); setKode(s.kode); setNama(s.nama); setDesk(s.deskripsi??""); setModal("edit"); }
  function openTambah()      { setEditing(null); setKode(""); setNama(""); setDesk(""); setError(""); setModal("tambah"); }

  async function handleSave() {
    if (!kode.trim()||!nama.trim()) { setError("Kode dan nama wajib diisi."); return; }
    setSaving(true); setError("");
    try {
      if (modal==="tambah") await createSopSubcategory({ kode: kode.toUpperCase(), nama, deskripsi: desk||undefined });
      else if (editing)     await updateSopSubcategory(editing.id, { kode: kode.toUpperCase(), nama, deskripsi: desk||undefined });
      setModal(null); router.refresh();
    } catch (e: any) { setError(e.message ?? "Terjadi kesalahan"); }
    setSaving(false);
  }

  async function handleDelete(id: string, nama: string) {
    if (!confirm(`Hapus kategori "${nama}"?`)) return;
    await deleteSopSubcategory(id);
    router.refresh();
  }

  return (
    <>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Manajemen Dokumen</p>
            <h1 className="font-display font-bold text-3xl mt-1">Kategori SOP General</h1>
          </div>
          <Button className="gap-2" onClick={openTambah}><Plus size={16}/> Tambah Kategori</Button>
        </div>

        <div className="bg-muted/30 rounded-xl border p-4 mb-6 text-sm text-muted-foreground flex gap-2">
          <span>ℹ</span>
          <span>Kategori ini digunakan sebagai sub-kategori pada halaman <strong className="text-foreground">SOP General</strong> dan pilihan saat admin menambah dokumen dengan Kategori SOP = SOP General.</span>
        </div>

        <div className="bg-background rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground w-28">Kode</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nama</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Deskripsi</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground w-24 text-center">Dokumen</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-semibold">{s.kode}</span>
                  </td>
                  <td className="px-5 py-3 font-medium">{s.nama}</td>
                  <td className="px-5 py-3 text-muted-foreground text-sm">{s.deskripsi ?? "—"}</td>
                  <td className="px-5 py-3 text-center text-muted-foreground">{s._count.sopDocuments}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={() => openEdit(s)}>Update</Button>
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDelete(s.id, s.nama)}>Hapus</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {subcategories.length===0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">Belum ada kategori</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl border w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-display font-bold text-lg">{modal==="tambah" ? "Tambah Kategori" : "Update Kategori"}</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Kode <span className="text-xs text-muted-foreground">(unik)</span></Label>
                  <Input placeholder="SMGR" value={kode} onChange={e => setKode(e.target.value.toUpperCase())}/>
                </div>
                <div className="space-y-1.5">
                  <Label>Nama Kategori</Label>
                  <Input placeholder="SOP Manager" value={nama} onChange={e => setNama(e.target.value)}/>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Deskripsi</Label>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Penjelasan singkat..."
                  value={desk}
                  onChange={e => setDesk(e.target.value)}
                />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
