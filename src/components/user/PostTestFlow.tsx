"use client";

// src/components/user/PostTestFlow.tsx
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
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
  id?: string; // alias dari API (sama dengan resultId)
  attemptNumber: number;
  // ─── Item 8: NIK & Nama karyawan ─────────────
  nikKaryawan?: string;
  namaKaryawan?: string;
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
  // ─── NIK & Nama (optional supaya backward-compatible dengan data lama) ──
  nikKaryawan?: string | null;
  namaKaryawan?: string | null;
  skor: number;
  status: "lulus" | "tidak_lulus";
  selesaiAt: string;
};

type Props = {
  postTest: PostTest | null;
  attachmentOk: boolean;
  myResults: HistoryItem[];
  sopJudul: string;
  // ─── Batch 5.2: untuk persist di localStorage supaya banner global
  // bisa kembalikan user ke halaman ini
  sopDocumentId: string;
  hasPassedPostTest: boolean;
  onResultSubmitted: (result: ResultData) => void;
  onContinueToNext: () => void; // Lanjut ke step 6
  onCancel: () => void; // Kembali ke step 4
};

// ─── Item 8: Screen flow sekarang ada 4 tahap ─────────────
// entry → nik (modal NIK + Nama) → quiz → result
type Screen = "entry" | "nik" | "quiz" | "result";

const OPT_LABELS = ["A", "B", "C", "D"] as const;
const OPT_KEYS = ["a", "b", "c", "d"] as const;

// ─── Item perubahan 1 (Batch 5): Persistence helpers ───────────────────
// Quiz state di-persist ke localStorage supaya kalau user refresh / buka
// tab baru / browser crash, quiz bisa dilanjut dari titik terakhir.
const QUIZ_STORAGE_PREFIX = "postTest:";

type PersistedQuizState = {
  nikKaryawan: string;
  namaKaryawan: string;
  answers: Record<string, string>;
  current: number;
  startedAt: number; // timestamp millis saat quiz dimulai
  durasiMenit: number;
  postTestId: string;
  // ─── Batch 5.2: simpan juga sopDocumentId supaya banner di halaman
  // lain bisa navigate balik ke /belajar/{sopDocumentId}
  sopDocumentId: string;
  // Optional: judul SOP untuk display di banner
  sopJudul?: string;
};

function loadQuizState(postTestId: string): PersistedQuizState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(QUIZ_STORAGE_PREFIX + postTestId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedQuizState;
    // Validasi: harus match postTestId yang sekarang
    if (parsed.postTestId !== postTestId) return null;
    // Validasi: kalau startedAt sudah terlalu lama (lebih dari durasi),
    // anggap quiz sudah expired
    const elapsedMs = Date.now() - parsed.startedAt;
    const totalMs = parsed.durasiMenit * 60 * 1000;
    if (elapsedMs >= totalMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveQuizState(state: PersistedQuizState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      QUIZ_STORAGE_PREFIX + state.postTestId,
      JSON.stringify(state)
    );
  } catch {
    /* quota / SSR — ignore */
  }
}

function clearQuizState(postTestId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(QUIZ_STORAGE_PREFIX + postTestId);
  } catch {
    /* ignore */
  }
}

// ═════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════
export default function PostTestFlow({
  postTest,
  attachmentOk,
  myResults,
  sopJudul,
  sopDocumentId,
  hasPassedPostTest,
  onResultSubmitted,
  onContinueToNext,
  onCancel,
}: Props) {
  const [screen, setScreen] = useState<Screen>("entry");
  const [currentResult, setCurrentResult] = useState<ResultData | null>(null);
  // ─── Item 8: NIK & Nama state, di-set dari modal sebelum mulai quiz ──
  const [nikKaryawan, setNikKaryawan] = useState("");
  const [namaKaryawan, setNamaKaryawan] = useState("");

  // ─── Batch 5: Auto-restore quiz state kalau ada session yang belum selesai ──
  // Dijalankan sekali saat mount. Kalau ada persisted state untuk postTestId
  // ini, langsung skip ke screen "quiz" (NIK & Nama di-restore dari storage).
  useEffect(() => {
    if (!postTest) return;
    const persisted = loadQuizState(postTest.id);
    if (persisted) {
      setNikKaryawan(persisted.nikKaryawan);
      setNamaKaryawan(persisted.namaKaryawan);
      setScreen("quiz");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postTest?.id]);

  // Gate: attachment belum disetujui
  if (!attachmentOk) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Lock size={28} className="text-muted-foreground" />
        </div>
        <p className="font-semibold text-lg">Post Test Terkunci</p>
        <p className="text-sm text-muted-foreground">
          Selesaikan upload bukti sosialisasi dan tunggu persetujuan admin
          untuk membuka Post Test.
        </p>
        <Button variant="outline" onClick={onCancel} className="mt-2">
          ← Kembali ke Upload Bukti
        </Button>
      </div>
    );
  }

  if (!postTest) {
    return (
      <div className="text-center text-muted-foreground py-16">
        <p>Post Test belum tersedia untuk SOP ini.</p>
        <Button variant="outline" onClick={onCancel} className="mt-4">
          ← Kembali
        </Button>
      </div>
    );
  }

  // ─── NIK Modal (sebelum mulai quiz) ───────────────────────────────
  if (screen === "nik") {
    return (
      <NikModal
        myResults={myResults}
        onCancel={() => setScreen("entry")}
        onConfirm={(nik, nama) => {
          setNikKaryawan(nik);
          setNamaKaryawan(nama);
          setScreen("quiz");
        }}
      />
    );
  }

  if (screen === "quiz") {
    return (
      <QuizScreen
        postTest={postTest}
        sopJudul={sopJudul}
        sopDocumentId={sopDocumentId}
        nikKaryawan={nikKaryawan}
        namaKaryawan={namaKaryawan}
        onCancelQuiz={() => setScreen("entry")}
        onSubmitted={(result) => {
          setCurrentResult(result);
          setScreen("result");
          onResultSubmitted(result);
        }}
      />
    );
  }

  if (screen === "result" && currentResult) {
    return (
      <ResultScreen
        result={currentResult}
        onClose={() => setScreen("entry")}
        onContinueToNext={onContinueToNext}
      />
    );
  }

  return (
    <EntryScreen
      postTest={postTest}
      myResults={myResults}
      hasPassedPostTest={hasPassedPostTest}
      onStart={() => setScreen("nik")}
      onContinueToNext={onContinueToNext}
      onViewResult={async (resultId) => {
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
  hasPassedPostTest,
  onStart,
  onContinueToNext,
  onViewResult,
}: {
  postTest: PostTest;
  myResults: HistoryItem[];
  hasPassedPostTest: boolean;
  onStart: () => void;
  onContinueToNext: () => void;
  onViewResult: (resultId: string) => void;
}) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2">
            Post Test
          </h2>
          <p className="text-sm text-muted-foreground">
            Setiap karyawan unit kerja ini wajib mengerjakan Post Test
            menggunakan NIK masing-masing. Durasi: {postTest.durasiMenit}{" "}
            menit, {postTest.jumlahSoal} soal pilihan ganda. Passing grade:{" "}
            {postTest.passingGrade}%.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>Catatan:</strong> 1 NIK hanya boleh 1x attempt per SOP.
          </p>
        </div>
        <Button onClick={onStart} className="flex-shrink-0">
          {myResults.length > 0
            ? "Mulai Post Test (Karyawan Baru)"
            : "Mulai Post Test"}
        </Button>
      </div>

      {/* Riwayat */}
      <div className="bg-background border rounded-xl overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-display font-semibold">Riwayat Percobaan</h3>
        </div>

        {myResults.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Belum ada percobaan. Klik "Mulai Post Test" untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    NIK
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Nama Karyawan
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Tanggal
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Skor
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
                    <td className="px-5 py-3 font-mono text-xs">
                      {r.nikKaryawan ?? "—"}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {r.namaKaryawan ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {new Date(r.selesaiAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
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
          </div>
        )}
      </div>

      {/* "Lanjut ke Penutup" hanya muncul kalau hasPassedPostTest */}
      {hasPassedPostTest && (
        <div className="flex justify-end">
          <Button onClick={onContinueToNext} className="gap-1.5">
            Lanjut ke Penutup <ChevronRight size={14} />
          </Button>
        </div>
      )}

      {/* Reminder kalau belum lulus */}
      {!hasPassedPostTest && myResults.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Lock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-amber-800 mb-0.5">
              Belum lulus Post Test
            </div>
            <div className="text-amber-700 text-xs">
              Anda harus mendapatkan skor minimal {postTest.passingGrade}% untuk
              membuka halaman Penutup. Silakan coba lagi.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// QUIZ SCREEN
// ═════════════════════════════════════════════════════════════════════
function QuizScreen({
  postTest,
  sopJudul,
  sopDocumentId,
  nikKaryawan,
  namaKaryawan,
  onCancelQuiz,
  onSubmitted,
}: {
  postTest: PostTest;
  sopJudul: string;
  sopDocumentId: string;
  nikKaryawan: string;
  namaKaryawan: string;
  onCancelQuiz: () => void;
  onSubmitted: (result: ResultData) => void;
}) {
  const total = postTest.questions.length;

  // ─── Batch 5: Init quiz state dari localStorage kalau ada ──────────
  // Kalau ada persisted state, restore: answers + current soal + sisa timer.
  // Sisa timer dihitung dari (durasiMenit*60 - elapsedSeconds).
  const initialState = (() => {
    if (typeof window === "undefined") return null;
    return loadQuizState(postTest.id);
  })();

  const [current, setCurrent] = useState<number>(
    initialState?.current ?? 0
  );
  const [answers, setAnswers] = useState<Record<string, string>>(
    initialState?.answers ?? {}
  );
  const [submitting, setSubmitting] = useState(false);

  // Timer: kalau ada initialState, hitung sisa dari startedAt
  // Kalau belum ada, mulai sesi baru dengan durasi penuh
  const [startedAt] = useState<number>(
    initialState?.startedAt ?? Date.now()
  );
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (initialState) {
      const elapsedSec = Math.floor(
        (Date.now() - initialState.startedAt) / 1000
      );
      return Math.max(0, postTest.durasiMenit * 60 - elapsedSec);
    }
    return postTest.durasiMenit * 60;
  });

  // ─── Persist quiz state setiap kali answers / current berubah ───────
  useEffect(() => {
    // Jangan persist kalau sedang submit (state akan di-clear setelah submit)
    if (submitting) return;
    saveQuizState({
      postTestId: postTest.id,
      sopDocumentId,
      sopJudul,
      nikKaryawan,
      namaKaryawan,
      answers,
      current,
      startedAt,
      durasiMenit: postTest.durasiMenit,
    });
  }, [
    answers,
    current,
    nikKaryawan,
    namaKaryawan,
    postTest.id,
    postTest.durasiMenit,
    sopDocumentId,
    sopJudul,
    startedAt,
    submitting,
  ]);

  useEffect(() => {
    if (submitting) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, submitting]);

  const timerStr = formatTimer(secondsLeft);
  const isUrgent = secondsLeft <= 60;
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
          // ─── Item 8: kirim NIK & Nama ──
          nikKaryawan,
          namaKaryawan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // ─── Batch 5: Kalau server reject (mis: dedup NIK), clear state
        // supaya user tidak stuck di quiz screen yang sama. NIK ini sudah
        // pernah submit jadi sesi quiz-nya invalid.
        if (res.status === 409) {
          clearQuizState(postTest.id);
        }
        throw new Error(data.error || "Gagal submit");
      }
      // ─── Batch 5: Clear persisted state setelah submit berhasil
      clearQuizState(postTest.id);
      onSubmitted(data as ResultData);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal submit");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
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

      <div className="flex flex-1 overflow-hidden">
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
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Yakin keluar dari Post Test? Jawaban Anda tidak akan disimpan."
                )
              ) {
                // ─── Batch 5: Clear persisted state saat user keluar
                clearQuizState(postTest.id);
                onCancelQuiz();
              }
            }}
            className="mt-6 w-full text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1"
          >
            <X size={12} /> Keluar
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto px-10 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-base leading-relaxed font-medium mb-6">
              {q.pertanyaan}
            </div>
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
// RESULT SCREEN — split panel
// ═════════════════════════════════════════════════════════════════════
function ResultScreen({
  result,
  onClose,
  onContinueToNext,
}: {
  result: ResultData;
  onClose: () => void;
  onContinueToNext: () => void;
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

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[260px] flex-shrink-0 bg-muted/30 border-r p-6 overflow-y-auto">
          <div className="text-xs font-semibold mb-1">Tanggal Post Test :</div>
          <div className="text-sm">{tanggalStr}</div>
          <div className="text-xs text-muted-foreground mb-6">
            Pukul {waktuStr}
          </div>

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

          <div className="flex flex-col gap-2">
            {/* ─── Batch 5: Tombol "Ulangi Post Test" dihapus ──────────
               1 NIK 1 attempt per SOP, jadi user tidak boleh ulangi
               post test dengan NIK yang sama. Karyawan lain bisa
               mengerjakan dari Step 5 → klik "Mulai Post Test
               (Karyawan Baru)" untuk input NIK berbeda. */}
            {isPassed ? (
              <Button onClick={onContinueToNext} className="w-full gap-1.5">
                Lanjut ke Penutup <ChevronRight size={14} />
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full gap-1.5"
                >
                  Tutup
                </Button>
                <p className="text-xs text-muted-foreground text-center leading-relaxed mt-1">
                  Setiap NIK hanya boleh 1x attempt per SOP. Karyawan lain
                  dapat mengerjakan dari halaman Post Test dengan NIK
                  masing-masing.
                </p>
              </>
            )}
          </div>

          {/* Pesan kalau tidak lulus */}
          {!isPassed && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                <Lock size={11} /> Penutup Terkunci
              </div>
              Anda perlu mendapat skor minimal {result.passingGrade}% untuk
              membuka halaman Penutup. Silakan coba lagi.
            </div>
          )}
        </aside>

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
                      // ─── Item 1: HIDE kunci jawaban ────────────────────
                      // Hanya highlight pilihan USER:
                      //   - hijau kalau user benar
                      //   - merah kalau user salah
                      // Opsi lain (termasuk jawaban benar) ditampilkan netral
                      // tanpa mengungkap mana yang sebenarnya benar.
                      const highlight = isUserPick
                        ? isCorrect
                          ? "correct"
                          : "wrong"
                        : "neutral";
                      return (
                        <div
                          key={opt}
                          className={cn(
                            "flex items-center gap-2.5 px-3.5 py-2.5 rounded-md border-2 text-sm",
                            highlight === "correct" &&
                              "border-green-500 bg-green-50 text-green-800",
                            highlight === "wrong" &&
                              "border-destructive bg-red-50 text-destructive",
                            highlight === "neutral" &&
                              "border-transparent bg-muted/30 text-foreground"
                          )}
                        >
                          <div
                            className={cn(
                              "w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0",
                              highlight === "correct" &&
                                "bg-green-500/20 text-green-700",
                              highlight === "wrong" &&
                                "bg-destructive/20 text-destructive",
                              highlight === "neutral" &&
                                "bg-foreground/10 text-foreground"
                            )}
                          >
                            {OPT_LABELS[j]}
                          </div>
                          <span className="flex-1">{text}</span>
                          {isUserPick && (
                            <span className="text-[11px] font-semibold flex-shrink-0">
                              (Jawaban Anda)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {!isCorrect && (
                    <p className="text-xs text-muted-foreground mt-3 italic">
                      Pelajari kembali dokumen SOP untuk memahami jawaban yang
                      tepat.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

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
        className={cn("font-display font-bold text-2xl leading-none", color)}
      >
        {value}
      </div>
    </div>
  );
}

function formatTimer(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

// ═════════════════════════════════════════════════════════════════════
// Item 8: NIK MODAL — wajib diisi sebelum mulai test
// 1 NIK 1 attempt per SOP — validasi di client (UX) + server (security)
// ═════════════════════════════════════════════════════════════════════
function NikModal({
  myResults,
  onCancel,
  onConfirm,
}: {
  myResults: HistoryItem[];
  onCancel: () => void;
  onConfirm: (nik: string, nama: string) => void;
}) {
  const [nik, setNik] = useState("");
  const [nama, setNama] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validasi NIK: 6 digit angka
    if (!/^\d{6}$/.test(nik)) {
      setError("NIK harus berupa 6 digit angka.");
      return;
    }

    // Validasi Nama: minimal 2 karakter
    if (nama.trim().length < 2) {
      setError("Nama wajib diisi (minimal 2 karakter).");
      return;
    }

    // Cek client-side: NIK sudah pernah submit di sesi ini?
    const existing = myResults.find((r) => r.nikKaryawan === nik);
    if (existing) {
      setError(
        `NIK ${nik} (${existing.namaKaryawan ?? "—"}) sudah pernah mengerjakan Post Test ini dengan skor ${existing.skor}. Setiap NIK hanya boleh 1x attempt per SOP.`
      );
      return;
    }

    onConfirm(nik, nama.trim());
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl border shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto animate-slide-up">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b">
            <h2 className="font-display font-bold text-2xl">Identitas Karyawan</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Masukkan NIK dan nama Anda sebelum mengerjakan Post Test.
              Pastikan data benar — tidak dapat diubah setelah submit.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="nik"
                className="block text-sm font-medium mb-1.5"
              >
                NIK Karyawan <span className="text-destructive">*</span>
              </label>
              <input
                id="nik"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={nik}
                onChange={(e) => {
                  // Auto-strip non-digit
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setNik(v);
                }}
                placeholder="6 digit angka"
                className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {nik.length}/6 digit
              </p>
            </div>

            <div>
              <label
                htmlFor="nama"
                className="block text-sm font-medium mb-1.5"
              >
                Nama Lengkap <span className="text-destructive">*</span>
              </label>
              <input
                id="nama"
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Info box */}
            <div className="bg-muted/40 border rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p>
                <strong className="text-foreground">Catatan penting:</strong>
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>1 NIK hanya boleh 1x attempt per SOP</li>
                <li>NIK & Nama akan tercatat di riwayat hasil</li>
                <li>Pastikan data sesuai NIK karyawan Bapak/Ibu</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-6 border-t bg-muted/20 rounded-b-2xl">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={nik.length !== 6 || nama.trim().length < 2}>
              Mulai Post Test
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
