// src/components/admin/TambahPostTestModal.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2 } from "lucide-react";

type SopOption = { id: string; kode: string; judul: string };
type Question  = { pertanyaan: string; opsiA: string; opsiB: string; opsiC: string; opsiD: string; jawabanBenar: "a"|"b"|"c"|"d" };

const emptyQ = (): Question => ({ pertanyaan:"", opsiA:"", opsiB:"", opsiC:"", opsiD:"", jawabanBenar:"a" });

type Props = { open: boolean; onClose: () => void; sopOptions: SopOption[] };

export default function TambahPostTestModal({ open, onClose, sopOptions }: Props) {
  const router   = useRouter();
  const [saving, setSaving]     = useState(false);
  const [sopId,  setSopId]      = useState("");
  const [grade,  setGrade]      = useState("70");
  const [durasi, setDurasi]     = useState("10");
  const [questions, setQs]      = useState<Question[]>(Array.from({length:10}, emptyQ));
  const [error,  setError]      = useState("");

  if (!open) return null;

  function updateQ(i: number, field: keyof Question, value: string) {
    setQs(prev => prev.map((q, idx) => idx === i ? {...q, [field]: value} : q));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sopId) { setError("Pilih SOP terlebih dahulu."); return; }
    const unanswered = questions.findIndex(q => !q.pertanyaan.trim());
    if (unanswered !== -1) { setError(`Pertanyaan ${unanswered+1} belum diisi.`); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/post-test/create", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ sopDocumentId: sopId, passingGrade: +grade, durasiMenit: +durasi, questions }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Terjadi kesalahan");
      setSaving(false);
      return;
    }
    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background z-10">
          <div>
            <h2 className="font-display font-bold text-xl">Tambah Post Test</h2>
            <p className="text-sm text-muted-foreground mt-0.5">10 soal pilihan ganda</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Config */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3 space-y-1.5">
              <Label>SOP</Label>
              <Select onValueChange={setSopId} required>
                <SelectTrigger><SelectValue placeholder="-- Pilih SOP --"/></SelectTrigger>
                <SelectContent>
                  {sopOptions.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.kode} — {s.judul}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Passing Grade</Label>
              <Input type="number" value={grade} onChange={e => setGrade(e.target.value)} min={1} max={100}/>
            </div>
            <div className="space-y-1.5">
              <Label>Durasi (menit)</Label>
              <Input type="number" value={durasi} onChange={e => setDurasi(e.target.value)} min={1}/>
            </div>
            <div className="space-y-1.5">
              <Label>Jumlah Soal</Label>
              <Input value="10" readOnly className="bg-muted cursor-not-allowed"/>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((q, i) => (
              <div key={i} className="border rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-bold flex-shrink-0">{i+1}</span>
                  <Input
                    placeholder={`Pertanyaan ${i+1}...`}
                    value={q.pertanyaan}
                    onChange={e => updateQ(i,"pertanyaan",e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pl-9">
                  {(["A","B","C","D"] as const).map(opt => (
                    <label key={opt}
                      className={`flex items-center gap-2 border rounded-lg p-2.5 cursor-pointer transition-colors
                        ${q.jawabanBenar === opt.toLowerCase() ? "border-green-500 bg-green-50" : "hover:bg-muted"}`}>
                      <input
                        type="radio" name={`jawaban-${i}`} value={opt.toLowerCase()}
                        checked={q.jawabanBenar === opt.toLowerCase()}
                        onChange={() => updateQ(i,"jawabanBenar",opt.toLowerCase())}
                        className="accent-green-600"
                      />
                      <span className="text-xs font-medium text-muted-foreground w-4">{opt}.</span>
                      <Input
                        className="h-7 text-xs border-0 p-0 focus-visible:ring-0"
                        placeholder={`Opsi ${opt}`}
                        value={q[`opsi${opt}` as keyof Question] as string}
                        onChange={e => updateQ(i,`opsi${opt}` as keyof Question,e.target.value)}
                        required
                      />
                    </label>
                  ))}
                </div>
                <div className="pl-9 text-xs text-muted-foreground">
                  ✓ Klik opsi untuk menandai sebagai jawaban benar
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t sticky bottom-0 bg-background py-4">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Post Test"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
