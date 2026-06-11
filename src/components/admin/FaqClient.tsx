"use client";

// src/components/admin/FaqClient.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import FaqModal from "./FaqModal";
import { deleteFaqEntry } from "@/actions/glossary-actions";

type Faq = {
  id: string;
  pertanyaan: string;
  jawaban: string;
  urutan: number;
};

export default function FaqClient({ faqs }: { faqs: Faq[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(f: Faq) {
    setEditing(f);
    setModalOpen(true);
  }

  async function handleDelete(f: Faq) {
    if (!confirm(`Hapus FAQ "${f.pertanyaan}"?`)) return;

    setDeleting(f.id);
    try {
      await deleteFaqEntry(f.id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal hapus");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Manajemen Konten</p>
            <h1 className="font-display font-bold text-3xl mt-1">FAQ</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola pertanyaan yang sering diajukan untuk membantu user.
            </p>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus size={16} /> Tambah FAQ
          </Button>
        </div>

        <div className="space-y-2">
          {faqs.length === 0 ? (
            <div className="bg-background rounded-xl border p-12 text-center text-muted-foreground">
              Belum ada FAQ. Klik &ldquo;Tambah FAQ&rdquo; untuk membuat.
            </div>
          ) : (
            faqs.map((f) => (
              <div
                key={f.id}
                className="bg-background rounded-xl border p-5 flex gap-4"
              >
                <GripVertical
                  size={18}
                  className="text-muted-foreground/40 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1">{f.pertanyaan}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {f.jawaban}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs gap-1"
                    onClick={() => openEdit(f)}
                  >
                    <Pencil size={12} /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => handleDelete(f)}
                    disabled={deleting === f.id}
                  >
                    <Trash2 size={12} />{" "}
                    {deleting === f.id ? "..." : "Hapus"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <FaqModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={editing}
      />
    </>
  );
}
