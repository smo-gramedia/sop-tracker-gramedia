"use client";

// src/components/admin/DepartmentClient.tsx
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import StrukturOrgTabs from "./StrukturOrgTabs";
import DepartmentModal from "./DepartmentModal";
import { deleteDepartment } from "@/actions/org-actions";

type Department = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  divisionId: string;
  division: {
    id: string;
    nama: string;
    directorate: { id: string; nama: string; singkatan: string | null };
  };
  _count: { sopDocuments: number };
};

type Directorate = {
  id: string;
  nama: string;
  singkatan: string | null;
  divisions: { id: string; nama: string; directorateId: string }[];
};

type Props = {
  items: Department[];
  directorates: Directorate[];
};

export default function DepartmentClient({ items, directorates }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterDir, setFilterDir] = useState<string>("all");
  const [filterDiv, setFilterDiv] = useState<string>("all");

  // Available divisions for filter
  const availableDivisions = useMemo(() => {
    if (filterDir === "all") {
      return directorates.flatMap((d) =>
        d.divisions.map((div) => ({
          ...div,
          directorateName: d.singkatan ?? d.nama,
        }))
      );
    }
    const dir = directorates.find((d) => d.id === filterDir);
    return dir
      ? dir.divisions.map((div) => ({
          ...div,
          directorateName: dir.singkatan ?? dir.nama,
        }))
      : [];
  }, [directorates, filterDir]);

  const filteredItems = useMemo(() => {
    return items.filter((d) => {
      if (
        filterDir !== "all" &&
        d.division.directorate.id !== filterDir
      )
        return false;
      if (filterDiv !== "all" && d.divisionId !== filterDiv) return false;
      return true;
    });
  }, [items, filterDir, filterDiv]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(d: Department) {
    setEditing(d);
    setModalOpen(true);
  }

  async function handleDelete(d: Department) {
    if (d._count.sopDocuments > 0) {
      alert(
        `Tidak bisa hapus "${d.nama}" karena masih punya ${d._count.sopDocuments} SOP. Pindahkan atau hapus SOP terlebih dahulu.`
      );
      return;
    }
    if (!confirm(`Hapus department "${d.nama}"?`)) return;

    setDeleting(d.id);
    try {
      await deleteDepartment(d.id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal hapus");
    } finally {
      setDeleting(null);
    }
  }

  // Reset filterDiv if it doesn't belong to selected dir
  useMemo(() => {
    if (filterDiv === "all") return;
    const valid = availableDivisions.some((d) => d.id === filterDiv);
    if (!valid) setFilterDiv("all");
  }, [availableDivisions, filterDiv]);

  const hasAnyDivision = directorates.some((d) => d.divisions.length > 0);

  return (
    <>
      <div className="p-8 max-w-6xl mx-auto">
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

        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h2 className="font-display font-bold text-xl">Department</h2>
            <p className="text-xs text-muted-foreground">
              Total: {filteredItems.length} department
              {(filterDir !== "all" || filterDiv !== "all") && ` (filter aktif)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterDir} onValueChange={setFilterDir}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Semua Directorate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Directorate</SelectItem>
                {directorates.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.singkatan ?? d.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDiv} onValueChange={setFilterDiv}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Semua Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Division</SelectItem>
                {availableDivisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="gap-2"
              onClick={openCreate}
              disabled={!hasAnyDivision}
              title={
                !hasAnyDivision ? "Tambah division dulu" : undefined
              }
            >
              <Plus size={16} /> Tambah Department
            </Button>
          </div>
        </div>

        {!hasAnyDivision && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
            ⚠️ Anda harus menambah Division terlebih dahulu sebelum bisa
            menambah Department.
          </div>
        )}

        <div className="bg-background rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground w-28">
                  Kode
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Nama
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Division
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Directorate
                </th>
                <th className="text-center px-5 py-3 font-medium text-muted-foreground w-20">
                  SOP
                </th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-muted-foreground text-sm"
                  >
                    {filterDir !== "all" || filterDiv !== "all"
                      ? "Tidak ada department di filter ini."
                      : "Belum ada department. Klik \"Tambah Department\" untuk membuat."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((d) => (
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
                    <td className="px-5 py-3 text-muted-foreground text-sm">
                      {d.division.nama}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-sm">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {d.division.directorate.singkatan ??
                          d.division.directorate.nama}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-muted-foreground">
                      {d._count.sopDocuments}
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
          </table>
        </div>
      </div>

      <DepartmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={editing}
        directorates={directorates}
      />
    </>
  );
}
