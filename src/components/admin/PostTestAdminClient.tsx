// src/components/admin/PostTestAdminClient.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText } from "lucide-react";
import TambahPostTestModal from "./TambahPostTestModal";
import { deletePostTest } from "@/actions/post-test-actions";

type PostTest = {
  id: string;
  passingGrade: number;
  durasiMenit: number;
  jumlahSoal: number;
  createdAt: Date;
  sopDocument: { kode: string; judul: string; kategori: string };
  _count: { questions: number; results: number };
};

type SopOption = { id: string; kode: string; judul: string };

type Props = { postTests: PostTest[]; sopOptions: SopOption[] };

export default function PostTestAdminClient({ postTests, sopOptions }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ─── Filter state ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");

  // ─── Filtered list ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return postTests.filter((pt) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          pt.sopDocument.judul.toLowerCase().includes(q) ||
          pt.sopDocument.kode.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (kategoriFilter && pt.sopDocument.kategori !== kategoriFilter)
        return false;
      return true;
    });
  }, [postTests, search, kategoriFilter]);

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Hapus post test ini? Semua soal dan hasil pengerjaan user juga akan terhapus."
      )
    )
      return;

    setDeleting(id);
    try {
      await deletePostTest(id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal hapus post test");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6 flex items-start sm:items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Monitoring</p>
            <h1 className="font-display font-bold text-2xl sm:text-3xl mt-1">Post Test</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola soal Post Test dan pantau hasil pengerjaan user per SOP.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Tambah Post Test
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-background border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
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
        </div>

        <div className="space-y-3">
          {filtered.map((pt) => (
            <div
              key={pt.id}
              className="bg-background rounded-xl border overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <KategoriBadge kategori={pt.sopDocument.kategori} />
                    <span className="text-xs font-mono text-muted-foreground">
                      {pt.sopDocument.kode}
                    </span>
                  </div>
                  <div className="font-medium">{pt.sopDocument.judul}</div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 text-sm flex-shrink-0 flex-wrap">
                  <div className="text-center">
                    <div className="font-semibold">{pt.jumlahSoal}</div>
                    <div className="text-xs text-muted-foreground">Soal</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{pt.passingGrade}</div>
                    <div className="text-xs text-muted-foreground">Passing</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{pt.durasiMenit}m</div>
                    <div className="text-xs text-muted-foreground">Durasi</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{pt._count.results}</div>
                    <div className="text-xs text-muted-foreground">
                      Pengerjaan
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-auto sm:ml-0">
                    <Link href={`/post-test/${pt.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1"
                      >
                        <FileText size={12} /> Lihat Detail
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleDelete(pt.id)}
                      disabled={deleting === pt.id}
                    >
                      {deleting === pt.id ? "..." : "Hapus"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-background rounded-xl border p-12 text-center text-muted-foreground">
              {postTests.length === 0
                ? "Belum ada post test"
                : "Tidak ada post test yang sesuai filter"}
            </div>
          )}
          {filtered.length > 0 && (
            <div className="text-xs text-muted-foreground text-right pt-2">
              Menampilkan {filtered.length} dari {postTests.length} post test
            </div>
          )}
        </div>
      </div>

      <TambahPostTestModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          router.refresh();
        }}
        sopOptions={sopOptions}
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
    sr: "Operation",
    ss: "Supporting",
    sp: "Publishing",
    sg: "General",
    petunjuk: "Petunjuk",
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${
        colors[kategori] ?? ""
      }`}
    >
      {labels[kategori] ?? kategori}
    </span>
  );
}
