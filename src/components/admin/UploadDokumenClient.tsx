// src/components/admin/UploadDokumenClient.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, BookMarked } from "lucide-react";
import TambahDokumenModal from "./TambahDokumenModal";
import EditDokumenModal from "./EditDokumenModal";
import { deleteSopDocument } from "@/actions/sop-document";
import GlossaryReviewModal from "./GlossaryReviewModal";

// Extended Doc type — include all fields yang EditDokumenModal butuhkan
type Doc = {
  id: string;
  kode: string;
  judul: string;
  deskripsi: string | null;
  kategori: string;
  tipe: string;
  status: string;
  versi: string;
  permittedAccess: string | null;
  juklakKategori: string | null;
  subcategoryId: string | null;
  departmentId: string | null;
  tanggalBerlaku: Date | string | null;
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
  const [glossaryDoc, setGlossaryDoc] = useState<{
    id: string;
    kode: string;
  } | null>(null);

  // ─── Filter state ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ─── Extract departments flat (untuk EditDokumenModal) ──────────────
  // EditDokumenModal butuh array departments flat, sedangkan kita terima
  // directorates yang nested (directorate → division → department).
  const allDepartments = useMemo(() => {
    return directorates.flatMap((dir) =>
      dir.divisions.flatMap((div) =>
        div.departments.map((dept) => ({
          id: dept.id,
          nama: dept.nama,
          kode: dept.kode,
        }))
      )
    );
  }, [directorates]);

  // ─── Dynamic department list (from current docs, untuk filter) ──────
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    docs.forEach((d) => {
      if (d.department?.nama) set.add(d.department.nama);
    });
    return Array.from(set).sort();
  }, [docs]);

  // ─── Filtered docs ──────────────────────────────────────────────────
  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      // Search: nama SOP, kode
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          doc.judul.toLowerCase().includes(q) ||
          doc.kode.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (kategoriFilter && doc.kategori !== kategoriFilter) return false;
      if (deptFilter && doc.department?.nama !== deptFilter) return false;
      if (statusFilter && doc.status !== statusFilter) return false;
      return true;
    });
  }, [docs, search, kategoriFilter, deptFilter, statusFilter]);

  async function handleDelete(id: string) {
    if (!confirm("Hapus dokumen ini? Semua lampiran juga akan terhapus."))
      return;
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

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4 flex-wrap">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-background border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama SOP atau kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent border-none outline-none"
            />
          </div>
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="bg-background border rounded-xl px-3 py-2 text-sm min-w-[160px]"
          >
            <option value="">Semua Kategori</option>
            <option value="sr">SOP Operation</option>
            <option value="ss">Supporting Unit</option>
            <option value="sp">Publishing</option>
            <option value="sg">General</option>
            <option value="petunjuk">Petunjuk</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-background border rounded-xl px-3 py-2 text-sm min-w-[160px]"
          >
            <option value="">Semua Departemen</option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border rounded-xl px-3 py-2 text-sm min-w-[140px]"
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="draft">Draft</option>
            <option value="obsolete">Obsolete</option>
          </select>
        </div>

        <div className="bg-background rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground w-32">
                    Kode
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Judul SOP
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Versi
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
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Tanggal Upload
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {doc.kode}
                    </td>
                    <td className="px-5 py-3 font-medium">{doc.judul}</td>
                    <td className="px-5 py-3 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                        {doc.versi}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <KategoriBadge kategori={doc.kategori} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-sm">
                      {doc.department?.nama ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1"
                        onClick={() =>
                          setGlossaryDoc({ id: doc.id, kode: doc.kode })
                        }
                      >
                        <BookMarked size={12} /> Glosarium
                      </Button>
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
              {filteredDocs.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    {docs.length === 0
                      ? "Belum ada dokumen"
                      : "Tidak ada dokumen yang sesuai filter"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <div className="px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground text-right">
            Menampilkan {filteredDocs.length} dari {docs.length} dokumen
            {total > docs.length && (
              <span className="ml-1 text-muted-foreground/70">
                (total {total} di database)
              </span>
            )}
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
          sop={editingDoc}
          departments={allDepartments}
          subcategories={subcategories}
        />
      )}

      <GlossaryReviewModal
        open={!!glossaryDoc}
        onClose={() => setGlossaryDoc(null)}
        sopId={glossaryDoc?.id ?? null}
        sopKode={glossaryDoc?.kode}
      />
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
