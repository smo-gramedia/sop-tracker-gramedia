"use client";

// src/components/admin/FaqModal.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import {
  createFaqEntry,
  updateFaqEntry,
} from "@/actions/glossary-actions";

type FaqData = {
  id: string;
  pertanyaan: string;
  jawaban: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  data: FaqData | null;
};

export default function FaqModal({ open, onClose, data }: Props) {
  const router = useRouter();
  const isEdit = !!data;
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [pertanyaan, setPertanyaan] = useState("");
  const [jawaban, setJawaban] = useState("");

  useEffect(() => {
    if (open) {
      setPertanyaan(data?.pertanyaan ?? "");
      setJawaban(data?.jawaban ?? "");
      setErrorMsg(null);
    }
  }, [open, data]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      if (!pertanyaan.trim()) throw new Error("Pertanyaan wajib diisi");
      if (!jawaban.trim()) throw new Error("Jawaban wajib diisi");

      if (isEdit && data) {
        await updateFaqEntry(data.id, pertanyaan.trim(), jawaban.trim());
      } else {
        await createFaqEntry(pertanyaan.trim(), jawaban.trim());
      }

      onClose();
      router.refresh();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="bg-background rounded-2xl border w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display font-bold text-lg">
            {isEdit ? "Edit FAQ" : "Tambah FAQ"}
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
            <Label htmlFor="faq-q">
              Pertanyaan <span className="text-destructive">*</span>
            </Label>
            <Input
              id="faq-q"
              value={pertanyaan}
              onChange={(e) => setPertanyaan(e.target.value)}
              placeholder="Bagaimana cara mengakses SOP?"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="faq-a">
              Jawaban <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="faq-a"
              value={jawaban}
              onChange={(e) => setJawaban(e.target.value)}
              placeholder="Pilih kategori SOP di halaman Home, lalu klik..."
              required
              disabled={saving}
              className="w-full border rounded-lg p-3 text-sm min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
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
                : "Tambah FAQ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
