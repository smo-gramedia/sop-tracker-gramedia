// src/components/user/JuklakClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Eye, Download, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Document = {
  id: string;
  kode: string;
  judul: string;
  tanggalBerlaku: string | null;
  permittedAccess: string | null;
  departmentNama: string | null;
  progressStatus: "belum" | "dipelajari" | "selesai" | null;
};

type Props = {
  documents: Document[];
  accessValues: string[];
  departmentValues: string[];
};

export default function JuklakClient({
  documents,
  accessValues,
  departmentValues,
}: Props) {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterAccess, setFilterAccess] = useState("");

  // Filter logic
  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      // Search by judul or kode
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !doc.judul.toLowerCase().includes(q) &&
          !doc.kode.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      // Filter by departemen
      if (filterDept && doc.departmentNama !== filterDept) return false;
      // Filter by permitted access
      if (filterAccess && doc.permittedAccess !== filterAccess) return false;
      return true;
    });
  }, [documents, search, filterDept, filterAccess]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-primary mb-2 font-semibold">
          Petunjuk Pelaksanaan
        </div>
        <h1 className="font-display font-bold text-4xl mb-3">
          Petunjuk Pelaksanaan
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Halaman ini menampilkan seluruh juklak yang dapat diakses berdasarkan
          unit atau departemen.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-brand rounded-xl p-5">
          <div className="text-sm text-white/70 mb-1">Total Dokumen</div>
          <div className="font-display font-bold text-3xl text-white">
            {documents.length}
          </div>
        </div>
        <div className="bg-background border rounded-xl p-5">
          <div className="text-sm text-muted-foreground mb-1">
            Kategori Aktif
          </div>
          <div className="font-display font-bold text-xl">
            {departmentValues.length > 0
              ? `${departmentValues.length} Departemen`
              : "Semua Akses"}
          </div>
        </div>
        <div className="bg-background border rounded-xl p-5">
          <div className="text-sm text-muted-foreground mb-1">Akses Aktif</div>
          <div className="font-display font-bold text-xl">
            {accessValues.length > 0
              ? `${accessValues.length} Tipe`
              : "Semua Akses"}
          </div>
        </div>
      </div>

      {/* Search + Filter Card */}
      <div className="bg-background rounded-xl border p-6 mb-6">
        <h3 className="font-display font-semibold text-lg mb-1">
          Cari juklak yang Anda butuhkan
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Tabel menampilkan daftar juklak dengan informasi nomor, subjek,
          tanggal berlaku, dan akses.
        </p>

        <div className="flex flex-col md:flex-row gap-3 mb-5">
          {/* Search input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Cari judul juklak..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter departemen */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
          >
            <option value="">Semua Kategori</option>
            {departmentValues.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Filter access */}
          <select
            value={filterAccess}
            onChange={(e) => setFilterAccess(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
          >
            <option value="">Semua Akses</option>
            {accessValues.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2">
                <th className="text-left py-3 px-3 font-semibold text-muted-foreground w-12">
                  No
                </th>
                <th className="text-left py-3 px-3 font-semibold text-muted-foreground">
                  Nama Dokumen
                </th>
                <th className="text-left py-3 px-3 font-semibold text-muted-foreground w-36">
                  Valid Date
                </th>
                <th className="text-left py-3 px-3 font-semibold text-muted-foreground w-44">
                  Permitted Access
                </th>
                <th className="text-right py-3 px-3 font-semibold text-muted-foreground w-72">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, idx) => (
                <tr
                  key={doc.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-3 text-muted-foreground">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium">{doc.judul}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {doc.kode}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    {doc.tanggalBerlaku
                      ? new Date(doc.tanggalBerlaku).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "—"}
                  </td>
                  <td className="py-3 px-3">
                    <AccessBadge access={doc.permittedAccess} />
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1"
                      >
                        <Eye size={12} /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1"
                      >
                        <Download size={12} /> Download
                      </Button>
                      <Link href={`/belajar/${doc.id}`}>
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1"
                        >
                          <BookOpen size={12} /> Pelajari
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {documents.length === 0
                      ? "Belum ada juklak yang tersedia."
                      : "Tidak ada hasil yang cocok dengan filter Anda."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="mt-4 text-xs text-muted-foreground text-right">
            Menampilkan {filtered.length} dari {documents.length} juklak
          </div>
        )}
      </div>
    </div>
  );
}

// Badge component untuk Permitted Access
function AccessBadge({ access }: { access: string | null }) {
  if (!access) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  // Beberapa color hint berdasarkan value (fallback ke neutral)
  const colorMap: Record<string, string> = {
    all: "bg-blue-50 text-blue-700 border-blue-200",
    "store-only": "bg-amber-50 text-amber-700 border-amber-200",
    Store: "bg-amber-50 text-amber-700 border-amber-200",
    Finance: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const color =
    colorMap[access] ?? "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={`inline-flex text-xs px-2.5 py-0.5 rounded-full border font-medium ${color}`}
    >
      {access}
    </span>
  );
}
