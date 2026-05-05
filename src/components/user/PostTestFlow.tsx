// src/components/user/PostTestFlow.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Lock,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────
type Question = {
  id: string;
  pertanyaan: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
};

type PostTest = {
  id: string;
  passingGrade: number;
  durasiMenit: number;
  jumlahSoal: number;
  questions: Question[];
};

type ResultData = {
  resultId: string;
  attemptNumber: number;
  skor: number;
  status: "lulus" | "tidak_lulus";
  jumlahBenar: number;
  jumlahSalah: number;
  passingGrade: number;
  jumlahSoal: number;
  selesaiAt: string;
  review: {
    id: string;
    pertanyaan: string;
    opsiA: string;
    opsiB: string;
    opsiC: string;
    opsiD: string;
    jawabanBenar: "a" | "b" | "c" | "d";
    jawabanUser: "a" | "b" | "c" | "d" | null;
  }[];
};

type HistoryItem = {
  id: string;
  attemptNumber: number;
  skor: number;
  status: "lulus" | "tidak_lulus";
  selesaiAt: string;
};

type Props = {
  postTest: PostTest | null;
  attachmentOk: boolean;
  myResults: HistoryItem[];
  sopJudul: string;
  onCompleted: () => void; // dipanggil saat lulus (untuk push ke step 6)
};

type Screen = "entry" | "quiz" | "result";

const OPT_LABELS = ["A", "B", "C", "D"] as const;
const OPT_KEYS = ["a", "b", "c", "d"] as const;

// ═════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — orchestrator 3 screen
// ═════════════════════════════════════════════════════════════════════
export default function PostTestFlow({
  postTest,
  attachmentOk,
  myResults,
  sopJudul,
  onCompleted,
}: Props) {
  const [screen, setScreen] = useState<Screen>("entry");
  const [currentResult, setCurrentResult] = useState<ResultData | null>(null);

  // Locked state — bukti sosialisasi belum disetujui
  if (!attachmentOk) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
        <Lock size={32} className="text-muted-foreground" />
        <p className="font-semibold">Post Test Terkunci</p>
        <p className="text-sm text-muted-foreground">
          Selesaikan upload bukti sosialisasi dan tunggu persetujuan admin.
        </p>
      </div>
    );
  }

  // Belum ada post test
  if (!postTest) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Post Test belum tersedia untuk SOP ini.
      </div>
    );
  }

  if (screen === "quiz") {
    return (
      <QuizScreen
        postTest={postTest}
        sopJudul={sopJudul}
        onCancel={() => setScreen("entry")}
        onSubmitted={(result) => {
          setCurrentResult(result);
          setScreen("result");
          if (result.status === "lulus") {
            // Trigger update parent state ke step 6
            onCompleted();
          }
        }}
      />
    );
  }

  if (screen === "result" && currentResult) {
    return (
      <ResultScreen
        result={currentResult}
        onClose={() => setScreen("entry")}
        onRetry={() => setScreen("quiz")}
        onContinue={() => onCompleted()}
      />
    );
  }

  // Default: Entry screen
  return (
    <EntryScreen
      postTest={postTest}
      myResults={myResults}
      onStart={() => setScreen("quiz")}
      onViewResult={async (resultId) => {
        // Fetch detail result lalu show
        try {
          const res = await fetch(`/api/post-test/result/${resultId}`);
          if (!res.ok) throw new Error("Gagal memuat detail");
          const data = (await res.json()) as ResultData;
          setCurrentResult(data);
          setScreen("result");
        } catch (e) {
          alert(e instanceof Error ? e.message : "Gagal memuat detail");
        }
      }}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════
// ENTRY SCREEN — landing dengan tabel riwayat
// ═════════════════════════════════════════════════════════════════════
function EntryScreen({
  postTest,
  myResults,
  onStart,
  onViewResult,
}: {
  postTest: PostTest;
  myResults: HistoryItem[];
  onStart: () => void;
  onViewResult: (resultId: string) => void;
}) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl mb-2">Post Test</h2>
          <p className="text-sm text-muted-foreground">
            Kerjakan evaluasi untuk mengukur pemahaman Anda. Durasi:{" "}
            {postTest.durasiMenit} menit, {postTest.jumlahSoal} soal pilihan
            ganda.
          </p>
        </div>
        <Button onClick={onStart} className="flex-shrink-0">
          Mulai Post Test
        </Button>
      </div>

      {/* Riwayat */}
      <div className="bg-background border rounded-xl overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-display font-semibold">Riwayat</h3>
        </div>

        {myResults.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Belum ada percobaan. Klik "Mulai Post Test" untuk memulai.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Tanggal
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Persentase
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {myResults.map((r) => (
                <tr
                  key={r.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-5 py-3">
                    {new Date(r.selesaiAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 font-semibold">{r.skor}%</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "text-xs px-2.5 py-0.5 rounded-full border font-medium",
                        r.status === "lulus"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {r.status === "lulus" ? "Lulus" : "Tidak Lulus"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1"
                      onClick={() => onViewResult(r.id)}
                    >
                      <Eye size={12} /> Lihat Detail
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// QUIZ SCREEN — full screen dengan timer + sidebar nomor + 1 soal at a time
// ═════════════════════════════════════════════════════════════════════
function QuizScreen({
  postTest,
  sopJudul,
  onCancel,
  onSubmitted,
}: {
  postTest: PostTest;
  sopJudul: string;
  onCancel: () => void;
  onSubmitted: (result: ResultData) => void;
}) {
  const total = postTest.questions.length;
  const [current, setCurrent] = useState(0);
  // answers: { [questionId]: 'a' | 'b' | 'c' | 'd' }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Timer (countdown dari durasiMenit * 60 detik)
  const [secondsLeft, setSecondsLeft] = useState(postTest.durasiMenit * 60);

  useEffect(() => {
    if (submitting) return;
    if (secondsLeft <= 0) {
      // Auto-submit ketika waktu habis
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, submitting]);

  const timerStr = formatTimer(secondsLeft);
  const isUrgent = secondsLeft <= 60; // warna merah saat <= 1 menit

  const q = postTest.questions[current];
  const selectedAnswer = answers[q.id];

  function pick(opt: "a" | "b" | "c" | "d") {
    setAnswers((prev) => ({ ...prev, [q.id]: opt }));
  }

  function goNext() {
    if (current < total - 1) setCurrent(current + 1);
  }
  function goPrev() {
    if (current > 0) setCurrent(current - 1);
  }
  function goTo(i: number) {
    setCurrent(i);
  }

  async function handleSubmit() {
    if (submitting) return;

    const unanswered = postTest.questions.filter((q) => !answers[q.id]).length;
    if (unanswered > 0 && secondsLeft > 0) {
      const confirm = window.confirm(
        `Masih ada ${unanswered} soal yang belum dijawab. Tetap submit?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);
    try {
      const durasiDetik = postTest.durasiMenit * 60 - secondsLeft;
      const res = await fetch("/api/post-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postTestId: postTest.id,
          answers,
          durasiDetik,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal submit");
      onSubmitted(data as ResultData);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal submit");
      setSubmitting(false);
    }
  }

  return (
    // Fixed overlay covering entire viewport (di atas UserNavbar)
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top sticky header */}
      <div className="flex items-center justify-between px-6 h-14 border-b flex-shrink-0">
        <div className="text-sm font-medium text-muted-foreground">
          Soal {current + 1} dari {total}
        </div>
        <div
          className={cn(
            "font-display font-bold text-xl px-4 py-1.5 rounded-lg text-white transition-colors",
            isUrgent ? "bg-destructive animate-pulse" : "bg-foreground"
          )}
        >
          {timerStr}
        </div>
      </div>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nomor soal */}
        <aside className="w-[200px] flex-shrink-0 bg-muted/30 border-r p-4 overflow-y-auto">
          <div className="font-bold text-sm mb-3 leading-snug">{sopJudul}</div>

          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {postTest.questions.map((qq, i) => {
              const isCurrent = i === current;
              const isAnswered = !!answers[qq.id];
              return (
                <button
                  key={qq.id}
                  onClick={() => goTo(i)}
                  className={cn(
                    "h-8 rounded-md border text-xs font-semibold transition-all",
                    isCurrent
                      ? "bg-foreground text-background border-foreground"
                      : isAnswered
                      ? "bg-muted border-border"
                      : "bg-background border-border hover:border-foreground"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="text-[11px] text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-foreground" />
              Soal aktif
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-muted border" />
              Sudah dijawab
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-background border" />
              Belum dijawab
            </div>
          </div>

          {/* Cancel button */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Yakin keluar dari Post Test? Jawaban Anda tidak akan disimpan."
                )
              ) {
                onCancel();
              }
            }}
            className="mt-6 w-full text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1"
          >
            <X size={12} /> Keluar
          </button>
        </aside>

        {/* Main soal */}
        <main className="flex-1 overflow-y-auto px-10 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Question */}
            <div className="text-base leading-relaxed font-medium mb-6">
              {q.pertanyaan}
            </div>

            {/* Options */}
            <div className="space-y-2.5 mb-8">
              {OPT_KEYS.map((opt, i) => {
                const text = q[`opsi${OPT_LABELS[i]}` as `opsiA`];
                const isSelected = selectedAnswer === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => pick(opt)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-lg border-2 text-left text-sm transition-all",
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground/40 hover:bg-muted/40"
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded flex items-center justify-center font-bold text-xs flex-shrink-0",
                        isSelected
                          ? "bg-background/20 text-background"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {OPT_LABELS[i]}
                    </div>
                    <span className="flex-1">{text}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={current === 0}
                className={current === 0 ? "invisible" : ""}
              >
                <ChevronLeft size={16} /> Sebelumnya
              </Button>

              {current === total - 1 ? (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Mengirim..." : "Submit"}
                </Button>
              ) : (
                <Button onClick={goNext}>
                  Next <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// RESULT SCREEN — split panel (stats kiri + review kanan)
// ═════════════════════════════════════════════════════════════════════
function ResultScreen({
  result,
  onClose,
  onRetry,
  onContinue,
}: {
  result: ResultData;
  onClose: () => void;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const isPassed = result.status === "lulus";
  const tanggalStr = new Date(result.selesaiAt).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const waktuStr = new Date(result.selesaiAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top header */}
      <div className="flex items-center justify-between px-6 h-14 border-b flex-shrink-0">
        <h2 className="font-display font-bold text-lg">Hasil Post Test</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>
      </div>

      {/* Split: stats left + review right */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Statistics */}
        <aside className="w-[260px] flex-shrink-0 bg-muted/30 border-r p-6 overflow-y-auto">
          <div className="text-xs font-semibold mb-1">Tanggal Post Test :</div>
          <div className="text-sm">{tanggalStr}</div>
          <div className="text-xs text-muted-foreground mb-6">
            Pukul {waktuStr}
          </div>

          {/* Score */}
          <div className="mb-6">
            <div className="text-xs text-muted-foreground mb-1">Score</div>
            <div className="font-display font-bold text-5xl leading-none">
              {result.skor}%
            </div>
            <div
              className={cn(
                "font-bold text-base mt-1.5",
                isPassed ? "text-green-600" : "text-destructive"
              )}
            >
              {isPassed ? "LULUS" : "TIDAK LULUS"}
            </div>
          </div>

          {/* Stats grid 2x2 */}
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            <StatCard label="Total Soal" value={result.jumlahSoal} />
            <StatCard
              label="Benar"
              value={result.jumlahBenar}
              color="text-green-600"
            />
            <StatCard
              label="Salah"
              value={result.jumlahSalah}
              color="text-destructive"
            />
            <StatCard label="Passing" value={`${result.passingGrade}%`} />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={onRetry}
              className="w-full gap-1.5"
            >
              <RotateCw size={14} /> Ulangi Post Test
            </Button>
            {isPassed && (
              <Button onClick={onContinue} className="w-full">
                Lanjut ke Penutup →
              </Button>
            )}
          </div>
        </aside>

        {/* Right panel: Review semua soal */}
        <main className="flex-1 overflow-y-auto px-9 py-7">
          <div className="max-w-3xl">
            {result.review.map((r, i) => {
              const isCorrect = r.jawabanUser === r.jawabanBenar;
              return (
                <div
                  key={r.id}
                  className="mb-6 pb-6 border-b last:border-0 last:mb-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center font-bold text-xs">
                      {i + 1}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold px-3 py-1 rounded-full",
                        isCorrect
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-destructive"
                      )}
                    >
                      {isCorrect ? "✓ Benar" : "✗ Salah"}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed mb-3">{r.pertanyaan}</p>

                  <div className="space-y-1.5">
                    {OPT_KEYS.map((opt, j) => {
                      const text = r[`opsi${OPT_LABELS[j]}` as `opsiA`];
                      const isUserPick = r.jawabanUser === opt;
                      const isCorrectAns = r.jawabanBenar === opt;

                      return (
                        <div
                          key={opt}
                          className={cn(
                            "flex items-center gap-2.5 px-3.5 py-2.5 rounded-md border-2 text-sm",
                            isCorrectAns
                              ? "border-green-500 bg-green-50 text-green-800"
                              : isUserPick && !isCorrectAns
                              ? "border-destructive bg-red-50 text-destructive"
                              : "border-transparent bg-muted/30 text-foreground"
                          )}
                        >
                          <div
                            className={cn(
                              "w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0",
                              isCorrectAns
                                ? "bg-green-500/20 text-green-700"
                                : isUserPick && !isCorrectAns
                                ? "bg-destructive/20 text-destructive"
                                : "bg-foreground/10 text-foreground"
                            )}
                          >
                            {OPT_LABELS[j]}
                          </div>
                          <span className="flex-1">{text}</span>
                          {isCorrectAns && (
                            <span className="text-[11px] font-semibold flex-shrink-0">
                              (Jawaban Benar)
                            </span>
                          )}
                          {isUserPick && !isCorrectAns && (
                            <span className="text-[11px] font-semibold flex-shrink-0">
                              (Jawaban Anda)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── StatCard kecil di Result panel kiri ────────────────────────────────
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-background border rounded-lg p-3 text-center">
      <div
        className={cn(
          "text-[10px] mb-1",
          color ? color : "text-muted-foreground"
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "font-display font-bold text-2xl leading-none",
          color
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Helper format timer ────────────────────────────────────────────────
function formatTimer(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}
