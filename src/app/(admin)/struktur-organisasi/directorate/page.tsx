import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function DirectoratePage() {
  const items = await prisma.directorate.findMany({
    orderBy: { kode: "asc" },
    include: { _count: { select: { divisions: true } } },
  });
  return (
    <OrgPage
      title="Directorate" subtitle="Struktur Organisasi"
      headers={["Kode","Singkatan","Nama","Company Group","Division","Aksi"]}
      rows={items.map(i => [
        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-semibold">{i.kode}</span>,
        i.singkatan ?? "—",
        <span className="font-medium">{i.nama}</span>,
        i.companyGroup ?? "—",
        i._count.divisions,
      ])}
    />
  );
}

function OrgPage({ title, subtitle, headers, rows }: {
  title: string; subtitle: string;
  headers: string[];
  rows: (React.ReactNode | string | number)[][];
}) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          <h1 className="font-display font-bold text-3xl mt-1">{title}</h1>
        </div>
        <Button className="gap-2"><Plus size={16} /> Tambah {title}</Button>
      </div>
      <div className="bg-background rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {headers.map(h => (
                <th key={h} className={`text-left px-5 py-3 font-medium text-muted-foreground ${h === "Aksi" ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-5 py-3 text-muted-foreground">{cell}</td>
                ))}
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">Update</Button>
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">Hapus</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
