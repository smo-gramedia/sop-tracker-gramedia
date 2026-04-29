// src/app/(admin)/struktur-organisasi/department/page.tsx
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function DepartmentPage() {
  const departments = await prisma.department.findMany({
    orderBy: { kode: "asc" },
    include: {
      division: {
        select: { nama: true, directorate: { select: { singkatan: true } } },
      },
      _count: { select: { sopDocuments: true } },
    },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Struktur Organisasi</p>
          <h1 className="font-display font-bold text-3xl mt-1">Department</h1>
        </div>
        <Button className="gap-2"><Plus size={16}/> Tambah Department</Button>
      </div>
      <div className="bg-background rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {["Kode","Nama Department","Division","Directorate","Dok. SOP","Aksi"].map(h => (
                <th key={h} className={`text-left px-5 py-3 font-medium text-muted-foreground ${h==="Aksi"?"text-right":""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.map(d => (
              <tr key={d.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-semibold">{d.kode}</span>
                </td>
                <td className="px-5 py-3 font-medium">{d.nama}</td>
                <td className="px-5 py-3 text-muted-foreground text-sm">{d.division.nama}</td>
                <td className="px-5 py-3 text-muted-foreground text-sm">{d.division.directorate.singkatan ?? "—"}</td>
                <td className="px-5 py-3 text-center text-muted-foreground">{d._count.sopDocuments}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">Update</Button>
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">Hapus</Button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">Belum ada department</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
