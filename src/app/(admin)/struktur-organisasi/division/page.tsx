// src/app/(admin)/struktur-organisasi/division/page.tsx
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function DivisionPage() {
  const divisions = await prisma.division.findMany({
    orderBy: { kode: "asc" },
    include: {
      directorate: { select: { nama: true, singkatan: true } },
      _count: { select: { departments: true } },
    },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Struktur Organisasi</p>
          <h1 className="font-display font-bold text-3xl mt-1">Division</h1>
        </div>
        <Button className="gap-2"><Plus size={16}/> Tambah Division</Button>
      </div>
      <div className="bg-background rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {["Kode","Nama Division","Directorate","Departemen","Aksi"].map(h => (
                <th key={h} className={`text-left px-5 py-3 font-medium text-muted-foreground ${h==="Aksi"?"text-right":""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {divisions.map(d => (
              <tr key={d.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-semibold">{d.kode}</span>
                </td>
                <td className="px-5 py-3 font-medium">{d.nama}</td>
                <td className="px-5 py-3 text-muted-foreground text-sm">
                  {d.directorate.singkatan ? `${d.directorate.singkatan} — ` : ""}{d.directorate.nama}
                </td>
                <td className="px-5 py-3 text-center text-muted-foreground">{d._count.departments}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">Update</Button>
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">Hapus</Button>
                  </div>
                </td>
              </tr>
            ))}
            {divisions.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">Belum ada division</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
