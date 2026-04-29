import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical } from "lucide-react";

export default async function FaqAdminPage() {
  const faqs = await prisma.faqEntry.findMany({ orderBy: { urutan: "asc" } });
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Admin</p>
          <h1 className="font-display font-bold text-3xl mt-1">FAQ</h1>
        </div>
        <Button className="gap-2"><Plus size={16} /> Tambah FAQ</Button>
      </div>
      <div className="space-y-2">
        {faqs.map(f => (
          <div key={f.id} className="bg-background rounded-xl border p-5 flex gap-4">
            <GripVertical size={18} className="text-muted-foreground/40 mt-0.5 flex-shrink-0 cursor-grab" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold mb-1">{f.pertanyaan}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{f.jawaban}</div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">Edit</Button>
              <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">Hapus</Button>
            </div>
          </div>
        ))}
        {faqs.length === 0 && (
          <div className="bg-background rounded-xl border p-12 text-center text-muted-foreground">
            Belum ada FAQ
          </div>
        )}
      </div>
    </div>
  );
}
