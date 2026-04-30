// src/app/(user)/sop/[kategori]/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SOP_KATEGORI_LABEL } from "@/lib/constants";
import type { SopKategori } from "@prisma/client";

const VALID_KATEGORI = ["sr","ss","sp","sg","petunjuk"] as const;

type Props = { params: { kategori: string } };

export default async function SopKategoriPage({ params }: Props) {
  const { kategori } = params;
  if (!VALID_KATEGORI.includes(kategori as never)) notFound();

  const session = await auth();

  const [documents, subcategories] = await Promise.all([
    prisma.sopDocument.findMany({
      where: { kategori: kategori as SopKategori, status: "aktif" },
      orderBy: { kode: "asc" },
      include: {
        department:  { select: { id: true, nama: true } },
        subcategory: { select: { id: true, nama: true } },
      },
    }),
    kategori === "sg"
      ? prisma.sopSubcategory.findMany({ orderBy: { kode: "asc" } })
      : Promise.resolve([]),
  ]);

  // Get user's learning progress for these docs
  const myProgress = await prisma.learningProgress.findMany({
    where: {
      userId: session!.user.id,
      sopDocumentId: { in: documents.map(d => d.id) },
    },
  });
  const progressMap = Object.fromEntries(myProgress.map(p => [p.sopDocumentId, p]));

  // Group by department or subcategory
  const grouped = groupDocuments(documents, kategori as SopKategori);
  const pageTitle = SOP_KATEGORI_LABEL[kategori] ?? kategori.toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Navbar */}
      <nav className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link href="/home" className="flex items-center gap-2 font-display font-bold text-lg">
            <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">G</div>
            Gramedia
          </Link>
          <Link href="/home" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
          <Link href="/sop/petunjuk" className="text-sm text-muted-foreground hover:text-foreground">Petunjuk Pelaksanaan</Link>
          <Link href="/bantuan" className="text-sm text-muted-foreground hover:text-foreground">Bantuan</Link>
          <span className="text-sm font-medium border-b-2 border-foreground pb-0.5">{pageTitle}</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{pageTitle}</div>
          <h1 className="font-display font-bold text-3xl">
            Temukan {pageTitle} dengan lebih cepat dan terstruktur.
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Pilih departemen untuk melihat daftar SOP yang relevan, cek status pembelajaran, dan buka dokumen.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-foreground text-background rounded-xl p-5">
            <div className="text-sm text-background/60 mb-1">Total Dokumen</div>
            <div className="font-display font-bold text-3xl">{documents.length}</div>
          </div>
          <div className="bg-background border rounded-xl p-5">
            <div className="text-sm text-muted-foreground mb-1">Sedang Dipelajari</div>
            <div className="font-display font-bold text-3xl">
              {myProgress.filter(p => p.status === "dipelajari").length}
            </div>
          </div>
          <div className="bg-background border rounded-xl p-5">
            <div className="text-sm text-muted-foreground mb-1">Selesai</div>
            <div className="font-display font-bold text-3xl text-green-600">
              {myProgress.filter(p => p.status === "selesai").length}
            </div>
          </div>
        </div>

        {/* Document groups */}
        <div className="space-y-8">
          {Object.entries(grouped).map(([groupName, docs]) => (
            <div key={groupName}>
              <h2 className="font-display font-semibold text-lg mb-4 text-muted-foreground uppercase tracking-wide text-sm">
                {groupName}
              </h2>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {docs.map(doc => {
                  const progress = progressMap[doc.id];
                  return (
                    <div key={doc.id} className="bg-background rounded-xl border p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{doc.kode}</span>
                        <StatusPill status={progress?.status} />
                      </div>
                      <div className="font-semibold leading-snug">{doc.judul}</div>
                      {doc.deskripsi && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{doc.deskripsi}</p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {doc.versi} · {doc.tanggalBerlaku?.toLocaleDateString("id-ID", { day:"2-digit",month:"short",year:"numeric" }) ?? "—"}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Link href={`/belajar/${doc.id}`}
                          className="flex-1 text-center text-xs font-medium bg-foreground text-background rounded-lg py-2 hover:bg-foreground/90 transition-colors">
                          📖 Pelajari
                        </Link>
                        <button className="text-xs font-medium border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
                          👁 View
                        </button>
                        <button className="text-xs font-medium border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
                          ⬇
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="bg-background rounded-xl border p-12 text-center text-muted-foreground">
              Belum ada dokumen SOP untuk kategori ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (!status || status === "belum") return null;
  const map: Record<string, string> = {
    dipelajari: "bg-amber-50 text-amber-700 border-amber-200",
    selesai:    "bg-green-50 text-green-700 border-green-200",
  };
  const label: Record<string, string> = { dipelajari: "Sedang dipelajari", selesai: "✓ Selesai" };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${map[status] ?? ""}`}>
      {label[status] ?? status}
    </span>
  );
}

function groupDocuments(docs: any[], kategori: SopKategori) {
  const groups: Record<string, typeof docs> = {};
  docs.forEach(doc => {
    const key = kategori === "sg"
      ? (doc.subcategory?.nama ?? "Umum")
      : (doc.department?.nama ?? "Umum");
    if (!groups[key]) groups[key] = [];
    groups[key].push(doc);
  });
  return groups;
}
