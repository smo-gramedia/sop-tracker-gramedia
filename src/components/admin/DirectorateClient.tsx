"use client";

// src/components/admin/DirectorateClient.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import StrukturOrgTabs from "./StrukturOrgTabs";
import DirectorateModal from "./DirectorateModal";
import { deleteDirectorate } from "@/actions/org-actions";

type Directorate = {
  id: string;
  kode: string;
  singkatan: string | null;
  nama: string;
  companyGroup: string | null;
  deskripsi: string | null;
  _count: { divisions: number };
};

type Props = { items: Directorate[] };

export default function DirectorateClient({ items }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Directorate | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(d: Directorate) {
    setEditing(d);
    setModalOpen(true);
  }

  async function handleDelete(d: Directorate) {
    if (d._count.divisions > 0) {
      alert(
        `Tidak bisa hapus "${d.nama}" karena masih punya ${d._count.divisions} division. Hapus dulu division-nya, atau pindah ke directorate lain.`
      );
      return;
    }
    if (!confirm(`Hapus directorate "${d.nama}"?`)) return;

    setDeleting(d.id);
    try {
      await deleteDirectorate(d.id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal hapus");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">Struktur Organisasi</p>
          <h1 className="font-display font-bold text-3xl mt-1">
            Struktur Organisasi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola directorate, division, dan department perusahaan.
          </p>
        </div>

        <StrukturOrgTabs />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-xl">Directorate</h2>
            <p className="text-xs text-muted-foreground">
              Total: {items.length} directorate
            </p>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus size={16} /> Tambah Directorate
          </Button>
        </div>

        <div className="bg-background rounded-xl border overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground w-28">
                  Kode
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Nama
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Singkatan
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Company Group
                </th>
                <th className="text-center px-5 py-3 font-medium text-muted-foreground w-20">
                  Division
                </th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-muted-foreground text-sm"
                  >
                    Belum ada directorate. Klik &ldquo;Tambah Directorate&rdquo;
                    untuk membuat.
                  </td>
                </tr>
              ) : (
                items.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-semibold">
                        {d.kode}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium">{d.nama}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {d.singkatan ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {d.companyGroup ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-center text-muted-foreground">
                      {d._count.divisions}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1"
                          onClick={() => openEdit(d)}
                        >
                          <Pencil size={12} /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleDelete(d)}
                          disabled={deleting === d.id}
                        >
                          <Trash2 size={12} />{" "}
                          {deleting === d.id ? "..." : "Hapus"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table></div>
        </div>
      </div>

      <DirectorateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={editing}
      />
    </>
  );
}
