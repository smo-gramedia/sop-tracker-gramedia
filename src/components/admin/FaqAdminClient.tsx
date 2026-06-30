// src/components/admin/FaqAdminClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { createFaq, updateFaq, deleteFaq } from "@/actions/faq";

type Faq = {
  id: string;
  pertanyaan: string;
  jawaban: string;
  urutan: number;
  updatedAt: string;
};

type Props = { faqs: Faq[] };

export default function FaqAdminClient({ faqs }: Props) {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<
    | { mode: "closed" }
    | { mode: "create" }
    | { mode: "edit"; faq: Faq }
  >({ mode: "closed" });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // E7: filter FAQ berdasarkan keyword (cocokkan pertanyaan & jawaban).
  const q = search.trim().toLowerCase();
  const filtered = q
    ? faqs.filter(
        (f) =>
          f.pertanyaan.toLowerCase().includes(q) ||
          f.jawaban.toLowerCase().includes(q)
      )
    : faqs;

  async function handleDelete(id: string) {
    if (!confirm("Hapus FAQ ini?")) return;
    setDeleting(id);
    try {
      await deleteFaq(id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Admin</p>
          <h1 className="font-display font-bold text-3xl mt-1">FAQ</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Kelola pertanyaan dan jawaban yang tampil di halaman bantuan user.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => setModalMode({ mode: "create" })}
        >
          <Plus size={16} /> Tambah FAQ
        </Button>
      </div>

      {/* E7: Pencarian FAQ berdasarkan keyword */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari FAQ berdasarkan kata kunci..."
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((f) => (
          <div
            key={f.id}
            className="bg-background rounded-xl border p-5 flex gap-4"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center text-xs font-mono">
              {f.urutan}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold mb-1">{f.pertanyaan}</div>
              <div className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {f.jawaban}
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={() => setModalMode({ mode: "edit", faq: f })}
              >
                <Pencil size={12} /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleDelete(f.id)}
                disabled={deleting === f.id}
              >
                <Trash2 size={12} />
                {deleting === f.id ? "..." : "Hapus"}
              </Button>
            </div>
          </div>
        ))}
        {faqs.length === 0 && (
          <div className="bg-background rounded-xl border p-12 text-center text-muted-foreground">
            Belum ada FAQ. Klik <strong>Tambah FAQ</strong> untuk membuat yang
            pertama.
          </div>
        )}
        {faqs.length > 0 && filtered.length === 0 && (
          <div className="bg-background rounded-xl border p-12 text-center text-muted-foreground">
            Tidak ada FAQ yang cocok dengan &ldquo;{search}&rdquo;.
          </div>
        )}
      </div>

      {modalMode.mode !== "closed" && (
        <FaqModal
          initial={modalMode.mode === "edit" ? modalMode.faq : null}
          nextUrutan={faqs.length}
          onClose={() => setModalMode({ mode: "closed" })}
          onSaved={() => {
            setModalMode({ mode: "closed" });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal — Tambah / Edit FAQ
// ─────────────────────────────────────────────
function FaqModal({
  initial,
  nextUrutan,
  onClose,
  onSaved,
}: {
  initial: Faq | null;
  nextUrutan: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = initial !== null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      if (isEdit) {
        await updateFaq(initial!.id, fd);
      } else {
        await createFaq(fd);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background z-10">
          <h2 className="font-display font-bold text-xl">
            {isEdit ? "Edit FAQ" : "Tambah FAQ"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="pertanyaan">Pertanyaan</Label>
            <Input
              id="pertanyaan"
              name="pertanyaan"
              defaultValue={initial?.pertanyaan ?? ""}
              placeholder="Contoh: Bagaimana cara mengupload bukti sosialisasi?"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jawaban">Jawaban</Label>
            <textarea
              id="jawaban"
              name="jawaban"
              defaultValue={initial?.jawaban ?? ""}
              placeholder="Tulis jawaban yang jelas dan lengkap…"
              required
              rows={6}
              className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Anda bisa pakai newline untuk membuat paragraf.
            </p>
          </div>

          <div className="space-y-1.5 max-w-[200px]">
            <Label htmlFor="urutan">Urutan Tampil</Label>
            <Input
              id="urutan"
              name="urutan"
              type="number"
              min={0}
              defaultValue={initial?.urutan ?? nextUrutan}
              required
            />
            <p className="text-xs text-muted-foreground">
              Angka kecil tampil lebih dulu.
            </p>
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
              {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah FAQ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
