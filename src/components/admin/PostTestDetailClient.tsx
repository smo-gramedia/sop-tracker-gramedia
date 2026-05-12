"use client";

// src/components/admin/PostTestDetailClient.tsx
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileQuestion,
  Search,
  Store,
  Building2,
} from "lucide-react";

type PostTest = {
  id: string;
  passingGrade: number;
  durasiMenit: number;
  jumlahSoal: number;
  sopDocument: {
    id: string;
    kode: string;
    judul: string;
    kategori: string;
    department: { nama: string } | null;
  };
};

type Question = {
  id: string;
  pertanyaan: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
  jawabanBenar: string;
};

type Result = {
  id: string;
  userId: string;
  attemptNumber: number;
  skor: number;
  jumlahBenar: number;
  jumlahSalah: number;
  status: string;
  dikerjakanAt: string;
  selesaiAt: string | null;
  user: {
    id: string;
    kodeUser: string;
    tipeUser: "store" | "department" | null;
    nama: string;
    unit: string | null;
    email: string;
  };
};

type Props = {
  postTest: PostTest;
  questions: Question[];
  results: Result[];
  totalQuestions: number;
  stats: {
    totalResults: number;
    uniqueUsers: number;
    lulusCount: number;
    tidakLulusCount: number;
    avgSkor: number;
  };
};

export default function PostTestDetailClient({
  postTest,
  questions,
  results,
  totalQuestions,
  stats,
}: Props) {
  const [tab, setTab] = useState<"all" | "latest">("latest");
  const [searchResult, setSearchResult] = useState("");
  const [exporting, setExporting] = useState(false);

  // ─── "Latest per User" — group results by userId, take latest ───────
  const latestResults = useMemo(() => {
    const byUser: Record<string, Result> = {};
    results.forEach((r) => {
      const existing = byUser[r.userId];
      if (!existing || r.attemptNumber > existing.attemptNumber) {
        byUser[r.userId] = r;
      }
    });
    return Object.values(byUser).sort(
      (a, b) =>
        new Date(b.dikerjakanAt).getTime() - new Date(a.dikerjakanAt).getTime()
    );
  }, [results]);

  // ─── Apply search filter ────────────────────────────────────────────
  const displayResults = useMemo(() => {
    const source = tab === "all" ? results : latestResults;
    if (!searchResult.trim()) return source;
    const q = searchResult.toLowerCase();
    return source.filter(
      (r) =>
        r.user.nama.toLowerCase().includes(q) ||
        r.user.kodeUser.toLowerCase().includes(q) ||
        (r.user.unit?.toLowerCase().includes(q) ?? false)
    );
  }, [tab, results, latestResults, searchResult]);

  // ─── Export Excel ───────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/post-test/${postTest.id}/export`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Export gagal (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeKode = postTest.sopDocument.kode.replace(/\//g, "-");
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `post-test-${safeKode}-${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal export");
    } finally {
      setExporting(false);
    }
  }

  const opsiKeys = ["A", "B", "C", "D"] as const;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/post-test"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft size={11} /> Kembali ke daftar Post Test
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Detail Post Test</p>
            <h1 className="font-display font-bold text-3xl mt-1">
              {postTest.sopDocument.judul}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground">
                {postTest.sopDocument.kode}
              </span>
              {postTest.sopDocument.department?.nama && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-xs text-muted-foreground">
                    {postTest.sopDocument.department.nama}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || results.length === 0}
            className="bg-foreground text-background rounded-xl px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title={
              results.length === 0
                ? "Belum ada pengerjaan untuk di-export"
                : "Export hasil ke Excel (multi-sheet per attempt)"
            }
          >
            <Download size={14} />
            {exporting ? "Meng-export..." : "Export Excel"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard
          icon={FileQuestion}
          iconBg="bg-foreground/5"
          iconColor="text-foreground"
          label="Total Soal"
          value={totalQuestions}
        />
        <StatCard
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Unique User"
          value={stats.uniqueUsers}
        />
        <StatCard
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          label="Lulus"
          value={stats.lulusCount}
        />
        <StatCard
          icon={XCircle}
          iconBg="bg-red-50"
          iconColor="text-destructive"
          label="Tidak Lulus"
          value={stats.tidakLulusCount}
        />
        <StatCard
          icon={TrendingUp}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Rata-rata Skor"
          value={stats.avgSkor}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
        {/* ═══ Section: Daftar Soal & Jawaban ═══ */}
        <div className="bg-background rounded-xl border">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm flex items-center gap-2">
              <FileQuestion size={14} />
              Daftar Soal & Jawaban
            </h2>
            <span className="text-xs text-muted-foreground">
              {questions.length} soal · Passing {postTest.passingGrade} ·{" "}
              {postTest.durasiMenit}m
            </span>
          </div>
          <div className="max-h-[600px] overflow-y-auto p-5 space-y-4">
            {questions.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Belum ada soal
              </div>
            ) : (
              questions.map((q, i) => (
                <div key={q.id} className="text-sm">
                  <div className="font-medium mb-2 flex gap-2">
                    <span className="text-muted-foreground font-mono flex-shrink-0">
                      {i + 1}.
                    </span>
                    <span>{q.pertanyaan}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6">
                    {opsiKeys.map((opt) => {
                      const isCorrect = q.jawabanBenar === opt.toLowerCase();
                      const value = q[`opsi${opt}` as keyof typeof q] as string;
                      return (
                        <div
                          key={opt}
                          className={`flex items-start gap-1.5 text-xs px-2 py-1.5 rounded-md ${
                            isCorrect
                              ? "bg-green-100 text-green-800 font-medium border border-green-200"
                              : "text-muted-foreground bg-muted/30"
                          }`}
                        >
                          <span className="font-mono w-4 flex-shrink-0">
                            {opt}.
                          </span>
                          <span className="flex-1">{value}</span>
                          {isCorrect && (
                            <CheckCircle2
                              size={12}
                              className="flex-shrink-0 mt-0.5"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══ Section: Hasil Pengerjaan User ═══ */}
        <div className="bg-background rounded-xl border">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-3">
              <Users size={14} />
              Hasil Pengerjaan Unit Kerja
            </h2>

            {/* Tabs */}
            <div className="flex gap-1 mb-3">
              <TabButton
                active={tab === "latest"}
                onClick={() => setTab("latest")}
              >
                Per Unit (Latest) · {latestResults.length}
              </TabButton>
              <TabButton active={tab === "all"} onClick={() => setTab("all")}>
                Semua Attempt · {results.length}
              </TabButton>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1.5">
              <Search size={12} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama unit, kode user, atau unit..."
                value={searchResult}
                onChange={(e) => setSearchResult(e.target.value)}
                className="flex-1 text-xs bg-transparent border-none outline-none"
              />
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {displayResults.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-12">
                {results.length === 0
                  ? "Belum ada unit kerja yang mengerjakan."
                  : "Tidak ada hasil yang sesuai pencarian."}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/40 z-10">
                  <tr className="border-b">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">
                      Unit Kerja
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">
                      Attempt
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">
                      Hasil
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayResults.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <TipeIcon tipe={r.user.tipeUser} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium">
                              {r.user.nama}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {r.user.kodeUser} · {r.user.unit ?? "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-mono bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                          #{r.attemptNumber}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <ResultDisplay
                          status={r.status}
                          skor={r.skor}
                          jumlahBenar={r.jumlahBenar}
                          totalQuestions={totalQuestions}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-muted-foreground">
                        {new Date(r.dikerjakanAt).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {displayResults.length > 0 && (
            <div className="px-5 py-2.5 border-t bg-muted/20 text-[11px] text-muted-foreground text-right">
              Menampilkan {displayResults.length} dari{" "}
              {tab === "all" ? results.length : latestResults.length}{" "}
              {tab === "all" ? "pengerjaan" : "unit kerja"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
        active
          ? "bg-foreground text-background"
          : "bg-background border text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-background rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}
        >
          <Icon size={14} className={iconColor} />
        </div>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className="font-display font-bold text-2xl">{value}</div>
    </div>
  );
}

// Display: "Lulus, 85, 17/20"
function ResultDisplay({
  status,
  skor,
  jumlahBenar,
  totalQuestions,
}: {
  status: string;
  skor: number;
  jumlahBenar: number;
  totalQuestions: number;
}) {
  const isLulus = status === "lulus";
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${
          isLulus
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}
      >
        {isLulus ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
        {isLulus ? "Lulus" : "Tidak Lulus"}
      </span>
      <span className="text-sm font-bold">{skor}</span>
      <span className="text-[11px] text-muted-foreground">
        ({jumlahBenar}/{totalQuestions} benar)
      </span>
    </div>
  );
}

// Tipe Icon
function TipeIcon({ tipe }: { tipe: "store" | "department" | null }) {
  if (tipe === "store") {
    return (
      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
        <Store size={10} />
      </div>
    );
  }
  if (tipe === "department") {
    return (
      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
        <Building2 size={10} />
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0 text-[10px]">
      —
    </div>
  );
}
