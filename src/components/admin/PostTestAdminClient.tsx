// src/components/admin/PostTestAdminClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import TambahPostTestModal from "./TambahPostTestModal";
import { formatTanggal } from "@/lib/utils";

type PostTest = {
  id: string; passingGrade: number; durasiMenit: number; jumlahSoal: number; createdAt: Date;
  sopDocument: { kode: string; judul: string; kategori: string };
  _count: { questions: number; results: number };
  questions?: Array<{ id:string; pertanyaan:string; opsiA:string; opsiB:string; opsiC:string; opsiD:string; jawabanBenar:string }>;
  results?: Array<{ id:string; skor:number; status:string; attemptNumber:number; dikerjakan_at:Date; user?:{ nama:string } }>;
};
type SopOption = { id: string; kode: string; judul: string };

type Props = { postTests: PostTest[]; sopOptions: SopOption[] };

export default function PostTestAdminClient({ postTests, sopOptions }: Props) {
  const router = useRouter();
  const [modalOpen,  setModalOpen]  = useState(false);
  const [expanded,   setExpanded]   = useState<string|null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Hapus post test ini?")) return;
    await fetch(`/api/post-test/create?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Monitoring</p>
            <h1 className="font-display font-bold text-3xl mt-1">Post Test</h1>
          </div>
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus size={16}/> Tambah Post Test
          </Button>
        </div>

        <div className="space-y-3">
          {postTests.map(pt => (
            <div key={pt.id} className="bg-background rounded-xl border overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{pt.sopDocument.judul}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5">{pt.sopDocument.kode}</div>
                </div>
                <div className="flex items-center gap-6 text-sm flex-shrink-0">
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
                    <div className="text-xs text-muted-foreground">Pengerjaan</div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1"
                      onClick={() => setExpanded(expanded === pt.id ? null : pt.id)}
                    >
                      {expanded === pt.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                      {expanded === pt.id ? "Tutup" : "Lihat Soal"}
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      className="h-7 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleDelete(pt.id)}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded soal */}
              {expanded === pt.id && pt.questions && (
                <div className="border-t bg-muted/20 p-5 space-y-4">
                  <h3 className="font-semibold text-sm">Daftar Soal</h3>
                  {pt.questions.map((q, i) => (
                    <div key={q.id} className="text-sm">
                      <div className="font-medium mb-1.5">{i+1}. {q.pertanyaan}</div>
                      <div className="grid grid-cols-2 gap-1 pl-4">
                        {["A","B","C","D"].map(opt => (
                          <div key={opt} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded
                            ${q.jawabanBenar === opt.toLowerCase() ? "bg-green-100 text-green-700 font-medium" : "text-muted-foreground"}`}>
                            <span className="font-mono w-4">{opt}.</span>
                            {q[`opsi${opt}` as keyof typeof q] as string}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {postTests.length === 0 && (
            <div className="bg-background rounded-xl border p-12 text-center text-muted-foreground">
              Belum ada post test
            </div>
          )}
        </div>
      </div>

      <TambahPostTestModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); router.refresh(); }}
        sopOptions={sopOptions}
      />
    </>
  );
}
