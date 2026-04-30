// src/components/admin/GlosariumClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Download, X } from "lucide-react";
import { createGlossaryEntry, updateGlossaryEntry, deleteGlossaryEntry } from "@/actions/glossary-actions";
import { formatTanggal } from "@/lib/utils";

type Entry = { id: string; kata: string; deskripsi: string; updatedAt: Date };

export default function GlosariumClient({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const [modal,   setModal]   = useState<"tambah"|"edit"|null>(null);
  const [editing, setEditing] = useState<Entry|null>(null);
  const [kata,    setKata]    = useState("");
  const [desk,    setDesk]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState("");

  const filtered = entries.filter(e =>
    e.kata.toLowerCase().includes(search.toLowerCase()) ||
    e.deskripsi.toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(entry: Entry) {
    setEditing(entry);
    setKata(entry.kata);
    setDesk(entry.deskripsi);
    setModal("edit");
  }

  function openTambah() {
    setEditing(null);
    setKata(""); setDesk("");
    setModal("tambah");
  }

  async function handleSave() {
    if (!kata.trim() || !desk.trim()) return;
    setSaving(true);
    if (modal === "tambah") {
      await createGlossaryEntry(kata, desk);
    } else if (editing) {
      await updateGlossaryEntry(editing.id, kata, desk);
    }
    setSaving(false);
    setModal(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus kata ini?")) return;
    await deleteGlossaryEntry(id);
    router.refresh();
  }

  function exportTxt() {
    const text = entries.map(e => `${e.kata}\n${e.deskripsi}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "glosarium-sop.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Manajemen Dokumen</p>
            <h1 className="font-display font-bold text-3xl mt-1">Glosarium</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={exportTxt}><Download size={16}/> Export .txt</Button>
            <Button className="gap-2" onClick={openTambah}><Plus size={16}/> Tambah Kata</Button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-background border rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
          <span className="text-muted-foreground">🔍</span>
          <input
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder="Cari kata atau istilah..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-background rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground w-40">Kata / Istilah</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Deskripsi</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground w-28">Diperbarui</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground w-24">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 font-semibold">{e.kata}</td>
                  <td className="px-5 py-3 text-muted-foreground leading-relaxed">{e.deskripsi}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{formatTanggal(e.updatedAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={() => openEdit(e)}>Edit</Button>
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDelete(e.id)}>Hapus</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">Tidak ada kata</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl border w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-display font-bold text-lg">{modal==="tambah" ? "Tambah Kata" : "Edit Kata"}</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label>Kata / Istilah</Label>
                <Input placeholder="Contoh: SOP" value={kata} onChange={e => setKata(e.target.value)}/>
              </div>
              <div className="space-y-1.5">
                <Label>Deskripsi</Label>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Penjelasan singkat..."
                  value={desk}
                  onChange={e => setDesk(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
                <Button onClick={handleSave} disabled={saving || !kata.trim() || !desk.trim()}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
