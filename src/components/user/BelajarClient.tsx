"use client";

// src/components/user/BelajarClient.tsx
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Upload,
  Download,
  Archive,
  Lock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Award,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LearningSidebar from "./LearningSidebar";
import PostTestFlow from "./PostTestFlow";
import {
  type LearningGateContext,
  getStepLockInfo,
} from "@/lib/learning-gates";

type Props = {
  doc: any;
  progress: any;
  postTest: any;
  latestAttachment: any;
  myResults: any[];
  userId: string;
  initialNote: string;
};

const NEXT_LABELS = [
  "Lanjut ke Akses Dokumen",
  "Lanjut ke Baca Dokumen",
  "Lanjut ke Lampiran",
  "Lanjut ke Upload Bukti",
  "Lanjut ke Post Test",
  "Lanjut ke Penutup",
  null,
];

const STEP_TITLES = [
  "Petunjuk Pembelajaran",
  "Akses Dokumen SOP",
  "Baca Dokumen SOP",
  "Lampiran Dokumen",
  "Upload Bukti Sosialisasi",
  "Post Test",
  "Penutup",
];

const KATEGORI_THEME: Record<string, { gradient: string; badge: string }> = {
  sr: {
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    badge: "bg-green-100 text-green-700",
  },
  ss: {
    gradient: "from-blue-500 via-cyan-500 to-indigo-500",
    badge: "bg-blue-100 text-blue-700",
  },
  sp: {
    gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
    badge: "bg-purple-100 text-purple-700",
  },
  sg: {
    gradient: "from-amber-500 via-orange-500 to-red-500",
    badge: "bg-amber-100 text-amber-700",
  },
  petunjuk: {
    gradient: "from-slate-500 via-gray-500 to-zinc-500",
    badge: "bg-slate-100 text-slate-700",
  },
};

export default function BelajarClient({
  doc,
  progress,
  postTest,
  latestAttachment,
  myResults,
  userId,
  initialNote,
}: Props) {
  const initialStep = progress?.stepCurrent ?? 0;
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [highestStep, setHighestStep] = useState<number>(initialStep);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any[]>(myResults);

  const theme =
    KATEGORI_THEME[doc.kategori] ?? KATEGORI_THEME.petunjuk;

  const { pdfUtama, lampiran } = useMemo(() => {
    const all = doc.sopAttachments ?? [];
    return {
      pdfUtama: all.find((a: any) => a.tipe === "utama") ?? null,
      lampiran: all.filter((a: any) => a.tipe === "lampiran"),
    };
  }, [doc.sopAttachments]);

  const hasPassedPostTest = results.some((r) => r.status === "lulus");
  const gateContext: LearningGateContext = {
    attachmentStatus: latestAttachment?.status ?? null,
    hasPassedPostTest,
  };

  async function persistStep(newStep: number) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/learning", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sopDocumentId: doc.id, step: newStep }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Persist step rejected:", data.error);
      }
    } catch (e) {
      console.error("Persist step error:", e);
    } finally {
      setSubmitting(false);
    }
  }

  function goToStep(step: number) {
    if (step < 0 || step > 6) return;
    const lockInfo = getStepLockInfo(step, gateContext);
    if (lockInfo.locked) return;
    if (step > highestStep + 1) return;

    setCurrentStep(step);
    if (step > highestStep) {
      setHighestStep(step);
      persistStep(step);
    }
  }

  function goNext() {
    const nextStep = currentStep + 1;
    const lockInfo = getStepLockInfo(nextStep, gateContext);
    if (lockInfo.locked) return;
    goToStep(nextStep);
  }

  function goBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handlePostTestCompleted(result: any) {
    // ─── Normalisasi: API submit return `resultId`, tabel riwayat butuh `id`
    // Tanpa normalisasi ini, tombol "Lihat Detail" hasil submit terbaru kirim `undefined` ke API
    const normalized = {
      ...result,
      id: result.id ?? result.resultId,
    };
    setResults((prev) => [...prev, normalized]);
    if (result.status === "lulus") {
      setHighestStep(6);
      setCurrentStep(6);
      persistStep(6);
    }
  }

  const nextLockInfo =
    currentStep < 6
      ? getStepLockInfo(currentStep + 1, gateContext)
      : { locked: false, reason: null };

  const persenProgress = Math.round((currentStep / 6) * 100);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Top Header — sleek progress bar + breadcrumb */}
      <div className="bg-background rounded-2xl border p-5 mb-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Link
                href={`/sop/${doc.kategori}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={11} /> Kembali
              </Link>
              <span className="text-muted-foreground/30">·</span>
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}
              >
                {doc.kode}
              </span>
              <span className="text-xs text-muted-foreground">
                {doc.versi}
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl leading-tight">
              {doc.judul}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {doc.department?.nama ?? doc.subcategory?.nama ?? "—"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
              Progress
            </div>
            <div
              className={`text-3xl font-display font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
            >
              {persenProgress}%
            </div>
          </div>
        </div>

        {/* Progress dot indicator */}
        <div className="flex items-center gap-1.5 mt-3">
          {Array.from({ length: 7 }, (_, i) => {
            const isCompleted = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={i} className="flex-1 flex items-center gap-1.5">
                <div
                  className={`h-2 flex-1 rounded-full transition-all ${
                    isCompleted
                      ? `bg-gradient-to-r ${theme.gradient}`
                      : isCurrent
                      ? "bg-primary/30"
                      : "bg-muted"
                  }`}
                />
                {i < 6 && (
                  <span className="text-[10px] text-muted-foreground/40 font-mono">
                    {i + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_286px] gap-6 items-start">
        {/* MAIN CONTENT */}
        <div className="animate-slide-up">
          {currentStep === 5 ? (
            <PostTestFlow
              postTest={postTest}
              attachmentOk={latestAttachment?.status === "disetujui"}
              myResults={results.map((r: any) => ({
                id: r.id,
                attemptNumber: r.attemptNumber,
                skor: r.skor,
                status: r.status,
                selesaiAt:
                  typeof r.selesaiAt === "string"
                    ? r.selesaiAt
                    : r.selesaiAt?.toISOString() ??
                      new Date().toISOString(),
              }))}
              sopJudul={doc.judul}
              hasPassedPostTest={hasPassedPostTest}
              onResultSubmitted={handlePostTestCompleted}
              onContinueToNext={() => goToStep(6)}
              onCancel={() => goToStep(4)}
            />
          ) : (
            <div className="bg-background rounded-2xl border p-7">
              {/* Step indicator badge */}
              <div className="flex items-center gap-2 mb-5">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white font-bold text-sm shadow-md`}
                >
                  {currentStep + 1}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Step {currentStep + 1} of 7
                  </div>
                  <div className="font-display font-bold text-lg leading-tight">
                    {STEP_TITLES[currentStep]}
                  </div>
                </div>
              </div>

              {currentStep === 0 && <Step0 theme={theme} />}
              {currentStep === 1 && <Step1 />}
              {currentStep === 2 && (
                <Step2
                  doc={doc}
                  pdfUtama={pdfUtama}
                  hasPassedPostTest={hasPassedPostTest}
                  theme={theme}
                />
              )}
              {currentStep === 3 && (
                <Step3
                  lampiran={lampiran}
                  hasPassedPostTest={hasPassedPostTest}
                  theme={theme}
                />
              )}
              {currentStep === 4 && (
                <Step4
                  docId={doc.id}
                  latestAttachment={latestAttachment}
                />
              )}
              {currentStep === 6 && <Step6 doc={doc} theme={theme} />}

              {currentStep < 6 && nextLockInfo.locked && (
                <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <Lock
                    size={16}
                    className="text-amber-600 flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-semibold text-amber-800 mb-0.5">
                      Step berikutnya terkunci
                    </div>
                    <div className="text-amber-700 text-xs">
                      {nextLockInfo.reason}
                    </div>
                  </div>
                </div>
              )}

              <NavFooter
                currentStep={currentStep}
                nextLockInfo={nextLockInfo}
                submitting={submitting}
                theme={theme}
                onNext={goNext}
              />
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="hidden lg:block">
          <LearningSidebar
            sopDocumentId={doc.id}
            currentStep={currentStep}
            highestStep={highestStep}
            initialNote={initialNote}
            gateContext={gateContext}
            onStepClick={goToStep}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Navigation footer ────────────────────────────────────────────────
function NavFooter({
  currentStep,
  nextLockInfo,
  submitting,
  theme,
  onNext,
}: {
  currentStep: number;
  nextLockInfo: { locked: boolean; reason: string | null };
  submitting: boolean;
  theme: { gradient: string; badge: string };
  onNext: () => void;
}) {
  if (currentStep === 6) {
    return (
      <div className="flex justify-end mt-6">
        <Link href="/home">
          <Button
            className={`bg-gradient-to-r ${theme.gradient} text-white border-0 hover:opacity-90`}
          >
            <Sparkles size={14} className="mr-1.5" />
            Selesai & Kembali
          </Button>
        </Link>
      </div>
    );
  }

  const disabled = submitting || nextLockInfo.locked;
  const nextLabel = NEXT_LABELS[currentStep];

  let buttonText: string;
  if (currentStep === 4 && nextLockInfo.locked) {
    buttonText = "Menunggu Verifikasi...";
  } else if (currentStep === 5 && nextLockInfo.locked) {
    buttonText = "Lulus Post Test untuk Lanjut";
  } else {
    buttonText = nextLabel ?? "";
  }

  return (
    <div className="flex justify-end mt-6">
      <Button
        onClick={onNext}
        disabled={disabled}
        className={`gap-1.5 ${
          !disabled
            ? `bg-gradient-to-r ${theme.gradient} text-white border-0 hover:opacity-90`
            : ""
        }`}
      >
        {buttonText}
        {!disabled && <ArrowRight size={14} />}
      </Button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// STEP 0 — Petunjuk Pembelajaran
// ═════════════════════════════════════════════════════════════════════
function Step0({ theme }: { theme: { gradient: string } }) {
  const tips = [
    "Baca dokumen SOP secara seksama",
    "Unduh lampiran pendukung yang diperlukan",
    "Upload bukti telah mengikuti sosialisasi",
    "Kerjakan post test untuk verifikasi pemahaman",
  ];
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed mb-5">
        Selamat datang di proses pembelajaran SOP. Ikuti langkah-langkah berikut
        untuk menyelesaikan sosialisasi SOP dengan benar. Pastikan Anda membaca
        setiap materi dengan seksama sebelum melanjutkan ke tahap berikutnya.
      </p>
      <div
        className={`bg-gradient-to-br from-primary/5 to-purple-100/50 rounded-xl border p-5`}
      >
        <div className="font-display font-bold text-sm mb-3">
          Yang akan Anda kerjakan:
        </div>
        <ul className="space-y-2.5">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <div
                className={`w-5 h-5 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5`}
              >
                {i + 1}
              </div>
              <span className="text-foreground/85">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// STEP 1 — Akses Dokumen SOP
// ═════════════════════════════════════════════════════════════════════
function Step1() {
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed mb-5">
        Di halaman ini Anda dapat mengakses dan melihat daftar dokumen SOP yang
        harus dipelajari. Pastikan Anda membaca semua dokumen yang ditugaskan
        kepada Anda sebelum melanjutkan.
      </p>
      <div className="bg-muted/40 rounded-xl border p-5 text-sm text-muted-foreground leading-relaxed">
        Dokumen SOP akan tampil di halaman berikutnya dalam bentuk PDF viewer.
        Anda dapat membaca, men-zoom, dan mengunduh dokumen setelah memenuhi
        durasi pembelajaran minimum. Setelah itu, Anda diminta mengunduh
        lampiran pendukung dan mengupload bukti sosialisasi untuk melanjutkan
        ke Post Test.
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// STEP 2 — Baca Dokumen SOP
// ═════════════════════════════════════════════════════════════════════
function Step2({
  doc,
  pdfUtama,
  hasPassedPostTest,
  theme,
}: {
  doc: any;
  pdfUtama: any | null;
  hasPassedPostTest: boolean;
  theme: { gradient: string };
}) {
  const baseFileUrl = pdfUtama
    ? `/api/files/sop-attachments/${pdfUtama.filename}`
    : null;
  // ─── Gating: hanya boleh download SETELAH lulus post test ───────────
  // (Sebelumnya pakai highestStep >= 2 → user bisa download di Step 2 langsung)
  const canDownload = hasPassedPostTest;

  // ─── PDF viewer URL: tambahkan #toolbar=0&navpanes=0 untuk hide Chrome PDF toolbar
  // sehingga tombol download bawaan browser tidak muncul. Sebagian browser
  // (Firefox, mobile) tetap menampilkan toolbar; pastikan content tidak
  // mengandung URL absolut yang bisa di-share langsung.
  const viewerUrl = baseFileUrl
    ? `${baseFileUrl}#toolbar=0&navpanes=0&scrollbar=1`
    : null;

  return (
    <div>
      <p className="text-muted-foreground text-sm mb-5">
        Baca dan pelajari dokumen SOP berikut dengan seksama.{" "}
        <span className="font-medium">
          Dokumen dapat diunduh setelah Anda menyelesaikan seluruh
          pembelajaran dan lulus post test.
        </span>
      </p>

      {viewerUrl && pdfUtama ? (
        <div className="border rounded-xl overflow-hidden bg-background">
          <div
            className={`flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r ${theme.gradient} text-white`}
          >
            <FileText size={16} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {doc.judul}.pdf
              </div>
              <div className="text-[11px] opacity-80">
                {canDownload
                  ? "Anda dapat mengunduh dokumen ini"
                  : "Preview dokumen pembelajaran"}
              </div>
            </div>
            <a
              href={canDownload ? baseFileUrl! : undefined}
              download={canDownload ? `${doc.kode}.pdf` : undefined}
              onClick={(e) => !canDownload && e.preventDefault()}
              aria-disabled={!canDownload}
              className={`text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                canDownload
                  ? "bg-white text-foreground hover:bg-white/90 cursor-pointer"
                  : "bg-white/20 text-white/60 cursor-not-allowed"
              }`}
              title={
                canDownload
                  ? "Download dokumen"
                  : "Selesaikan dan lulus post test untuk dapat mengunduh"
              }
            >
              {canDownload ? (
                <>
                  <Download size={12} /> Download
                </>
              ) : (
                <>
                  <Lock size={12} /> Terkunci
                </>
              )}
            </a>
          </div>
          <iframe
            src={viewerUrl}
            className="w-full h-[600px] bg-muted"
            title={doc.judul}
          />
          {/* Footer info — tidak menampilkan link "buka di tab baru" supaya tidak bypass gating */}
          <div className="px-4 py-2 bg-muted/40 text-[11px] text-muted-foreground border-t">
            {canDownload
              ? "Anda telah menyelesaikan pembelajaran. Klik tombol Download di atas untuk mengunduh dokumen."
              : "Dokumen tersedia untuk dibaca. Tombol Download akan terbuka setelah Anda lulus post test."}
          </div>
        </div>
      ) : (
        <div className="border rounded-xl bg-muted/30 p-12 text-center text-sm text-muted-foreground">
          <FileText size={36} className="mx-auto mb-3 opacity-40" />
          <p>PDF dokumen SOP belum tersedia.</p>
          <p className="text-xs mt-1">
            Hubungi admin untuk upload PDF utama SOP ini.
          </p>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// STEP 3 — Lampiran SOP
// ═════════════════════════════════════════════════════════════════════
function Step3({
  lampiran,
  hasPassedPostTest,
  theme,
}: {
  lampiran: any[];
  hasPassedPostTest: boolean;
  theme: { gradient: string };
}) {
  // Gating: download lampiran juga hanya boleh setelah lulus post test
  const canDownload = hasPassedPostTest;

  return (
    <div>
      <p className="text-muted-foreground text-sm mb-5">
        Lihat daftar lampiran pendukung dokumen SOP berikut.{" "}
        <span className="font-medium">
          Lampiran dapat diunduh setelah Anda lulus post test.
        </span>
      </p>
      {lampiran.length > 0 ? (
        <div className="space-y-2.5">
          {lampiran.map((a: any) => {
            const filename = a.filename.split("/").pop() || "lampiran";
            return (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 px-4 py-3 border rounded-xl bg-background hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0`}
                  >
                    <Archive size={18} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {filename}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {(a.ukuranKb / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                {canDownload ? (
                  <a
                    href={`/api/files/sop-attachments/${a.filename}`}
                    download
                    className="flex-shrink-0"
                  >
                    <Button size="sm" className="gap-1.5">
                      <Download size={12} /> Download
                    </Button>
                  </a>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="gap-1.5 flex-shrink-0 cursor-not-allowed"
                    title="Selesaikan dan lulus post test untuk dapat mengunduh"
                  >
                    <Lock size={12} /> Terkunci
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-muted/40 rounded-xl border p-8 text-center text-sm text-muted-foreground">
          <Archive size={32} className="mx-auto mb-2 opacity-40" />
          Tidak ada lampiran tambahan untuk SOP ini.
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// STEP 4 — Upload Bukti Sosialisasi
// ═════════════════════════════════════════════════════════════════════
function Step4({
  docId,
  latestAttachment,
}: {
  docId: string;
  latestAttachment: any;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function uploadFile() {
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tipe", "sosialisasi");
    fd.append("bucket", "sosialisasi");
    fd.append("sopDocumentId", docId);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Upload gagal (${res.status})`);
      window.location.reload();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Upload gagal");
      setUploading(false);
    }
  }

  const statusBox = (() => {
    if (!latestAttachment) {
      return {
        icon: "📎",
        title: "Belum ada bukti yang diunggah",
        sub: "Upload bukti di bawah untuk melanjutkan ke Post Test",
        color: "text-foreground",
        bg: "bg-muted/40 border-border",
        badge: null,
      };
    }
    const map: Record<string, any> = {
      menunggu: {
        icon: "⏳",
        title: "Menunggu Verifikasi Admin",
        sub: "Bukti Anda sedang diperiksa. Anda akan menerima notifikasi saat status berubah.",
        color: "text-amber-700",
        bg: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200",
        badge: { text: "Menunggu", color: "bg-amber-100 text-amber-700" },
      },
      disetujui: {
        icon: "✓",
        title: "Bukti Disetujui",
        sub: "Anda dapat melanjutkan ke Post Test.",
        color: "text-green-700",
        bg: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200",
        badge: { text: "Disetujui", color: "bg-green-100 text-green-700" },
      },
      ditolak: {
        icon: "✗",
        title: "Bukti Ditolak",
        sub:
          latestAttachment.alasanTolak ||
          "Silakan upload ulang dengan bukti yang sesuai.",
        color: "text-destructive",
        bg: "bg-gradient-to-br from-red-50 to-pink-50 border-red-200",
        badge: { text: "Ditolak", color: "bg-red-100 text-destructive" },
      },
      pending: {
        icon: "⏸",
        title: "Pending",
        sub: "Hubungi admin untuk informasi lebih lanjut.",
        color: "text-muted-foreground",
        bg: "bg-muted/40 border-border",
        badge: { text: "Pending", color: "bg-muted text-muted-foreground" },
      },
    };
    return map[latestAttachment.status];
  })();

  const canUpload =
    !latestAttachment || latestAttachment.status === "ditolak";

  return (
    <div>
      <p className="text-muted-foreground text-sm mb-5">
        Unggah foto atau dokumen sebagai bukti Anda telah mengikuti sosialisasi
        SOP ini. Admin akan memverifikasi sebelum Post Test terbuka.
      </p>

      <div
        className={`rounded-xl border p-4 mb-5 flex items-center gap-3 ${statusBox.bg}`}
      >
        <div className="text-xl flex-shrink-0">{statusBox.icon}</div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${statusBox.color}`}>
            {statusBox.title}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {statusBox.sub}
          </div>
        </div>
        {statusBox.badge && (
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ${statusBox.badge.color}`}
          >
            {statusBox.badge.text}
          </span>
        )}
      </div>

      {canUpload && (
        <>
          <label
            htmlFor="file-upload"
            className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/20 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <Upload size={20} className="text-primary" />
            </div>
            <div className="font-semibold text-sm mb-1">
              Klik untuk upload atau drag & drop
            </div>
            <div className="text-xs text-muted-foreground">
              JPG, JPEG, PNG, WebP, PDF · Maks 10MB
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setErrorMsg(null);
              }}
            />
          </label>

          {file && (
            <div className="mt-3 flex items-center justify-between gap-3 px-4 py-3 bg-muted/40 rounded-xl border">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base">🖼</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {file.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  Batalkan
                </Button>
                <Button size="sm" onClick={uploadFile} disabled={uploading}>
                  {uploading ? "Mengupload..." : "Unggah & Kirim"}
                </Button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              {errorMsg}
            </div>
          )}
        </>
      )}

      <div className="mt-5 px-4 py-3 bg-muted/40 rounded-xl border text-xs text-muted-foreground leading-relaxed">
        <strong>Catatan:</strong> Setelah upload, admin akan memverifikasi bukti
        Anda. Anda akan mendapat notifikasi email dan in-app saat status
        berubah. Post Test akan terbuka setelah disetujui.
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// STEP 6 — Penutup (Celebration!)
// ═════════════════════════════════════════════════════════════════════
function Step6({
  doc,
  theme,
}: {
  doc: any;
  theme: { gradient: string };
}) {
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Selamat! Anda telah menyelesaikan seluruh proses pembelajaran SOP{" "}
        <strong className="text-foreground">{doc.judul}</strong> dengan baik.
        Anda telah memahami isi dokumen, menyelesaikan upload bukti sosialisasi,
        dan melewati Post Test dengan hasil yang memuaskan.
      </p>

      {/* Celebration card */}
      <div
        className={`relative bg-gradient-to-br ${theme.gradient} rounded-2xl p-7 overflow-hidden`}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/15 blob-decoration" />
        <div className="absolute -bottom-16 -left-12 w-48 h-48 bg-white/10 blob-decoration" />

        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/30">
            <Trophy size={32} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-2xl text-white">
              Pembelajaran Selesai! 🎉
            </div>
            <div className="text-sm text-white/85 mt-1">
              Anda telah menyelesaikan semua tahapan sosialisasi SOP dengan
              berhasil.
            </div>
          </div>
        </div>
      </div>

      {/* Achievement stats */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        <div className="bg-background border rounded-xl p-4 text-center">
          <CheckCircle2 size={20} className="text-green-600 mx-auto mb-2" />
          <div className="font-display font-bold text-xl">7/7</div>
          <div className="text-[11px] text-muted-foreground">Step Selesai</div>
        </div>
        <div className="bg-background border rounded-xl p-4 text-center">
          <Award size={20} className="text-amber-500 mx-auto mb-2" />
          <div className="font-display font-bold text-xl">Lulus</div>
          <div className="text-[11px] text-muted-foreground">Post Test</div>
        </div>
        <div className="bg-background border rounded-xl p-4 text-center">
          <BookOpen size={20} className="text-primary mx-auto mb-2" />
          <div className="font-display font-bold text-xl">100%</div>
          <div className="text-[11px] text-muted-foreground">Pemahaman</div>
        </div>
      </div>
    </div>
  );
}
