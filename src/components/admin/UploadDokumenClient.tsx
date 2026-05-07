// src/components/admin/UploadDokumenClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import TambahDokumenModal from "./TambahDokumenModal";
import EditDokumenModal  from "./EditDokumenModal";
import { deleteSopDocument } from "@/actions/sop-document";

type Doc = {
  id: string;
  kode: string;
  judul: string;
  kategori: string;
  tipe: string;
  status: string;
  createdAt: Date;
  department: { nama: string } | null;
};

type Directorate = {
  id: string;
  nama: string;
  singkatan: string | null;
  divisions: {
    id: string;
    nama: string;
    departments: { id: string; nama: string; kode: string }[];
  }[];
};

type Subcategory = { id: string; kode: string; nama: string };

type Props = {
  docs: Doc[];
  total: number;
  directorates: Directorate[];
  subcategories: Subcategory[];
};

export default function UploadDokumenClient({
  docs,
  total,
  directorates,
  subcategories,
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Hapus dokumen ini? Semua lampiran juga akan terhapus.")) return;
    setDeleting(id);
    try {
      await deleteSopDocument(id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal hapus");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Manajemen Dokumen</p>
            <h1 className="font-display font-bold text-3xl mt-1">
              Upload Dokumen
            </h1>
          </div>
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Tambah Dokumen
          </Button>
        </div>

        <div className="bg-background rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground w-32">
                  Kode
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Judul SOP
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Kategori
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Departemen
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                    {doc.kode}
                  </td>
                  <td className="px-5 py-3 font-medium">{doc.judul}</td>
                  <td className="px-5 py-3">
                    <KategoriBadge kategori={doc.kategori} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-sm">
                    {doc.department?.nama ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1"
                        onClick={() => setEditingDoc(doc)}
                      >
                        <Pencil size={12} /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deleting === doc.id}
                      >
                        <Trash2 size={12} />{" "}
                        {deleting === doc.id ? "..." : "Hapus"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    Belum ada dokumen
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            Total: {total} dokumen
          </div>
        </div>
      </div>

      <TambahDokumenModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        directorates={directorates}
        subcategories={subcategories}
      />

      {editingDoc && (
        <EditDokumenModal
          open={!!editingDoc}
          onClose={() => setEditingDoc(null)}
          doc={editingDoc}
          directorates={directorates}
          subcategories={subcategories}
        />
      )}
    </>
  );
}

function KategoriBadge({ kategori }: { kategori: string }) {
  const colors: Record<string, string> = {
    sr: "bg-green-50 text-green-700 border-green-200",
    ss: "bg-blue-50 text-blue-700 border-blue-200",
    sp: "bg-purple-50 text-purple-700 border-purple-200",
    sg: "bg-amber-50 text-amber-700 border-amber-200",
    petunjuk: "bg-gray-50 text-gray-600 border-gray-200",
  };
  const labels: Record<string, string> = {
    sr: "SOP Operation",
    ss: "SOP Supporting Unit",
    sp: "SOP Publishing",
    sg: "SOP General",
    petunjuk: "Petunjuk Pelaksanaan",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
        colors[kategori] ?? ""
      }`}
    >
      {labels[kategori] ?? kategori}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    aktif: "bg-green-50 text-green-700 border-green-200",
    draft: "bg-gray-50 text-gray-600 border-gray-200",
    obsolete: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
        map[status] ?? ""
      }`}
    >
      {status}
    </span>
  );
}
