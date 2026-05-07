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

  // Split sopAttachments per tipe
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
    setResults((prev) => [...prev, result]);
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_286px] gap-7 items-start">
        {/* MAIN CONTENT */}
        <div>
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
            <>
              <button
                type="button"
                onClick={() =>
                  currentStep === 0 ? window.history.back() : goBack()
                }
                className="w-10 h-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors mb-5"
                aria-label="Kembali"
              >
                <ArrowLeft size={16} />
              </button>

              {currentStep === 0 && <Step0 />}
              {currentStep === 1 && <Step1 />}
              {currentStep === 2 && (
                <Step2
                  doc={doc}
                  pdfUtama={pdfUtama}
                  highestStep={highestStep}
                />
              )}
              {currentStep === 3 && <Step3 lampiran={lampiran} />}
              {currentStep === 4 && (
                <Step4
                  docId={doc.id}
                  latestAttachment={latestAttachment}
                />
              )}
              {currentStep === 6 && <Step6 doc={doc} />}

              {currentStep < 6 && nextLockInfo.locked && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
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
                onNext={goNext}
              />
            </>
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
  onNext,
}: {
  currentStep: number;
  nextLockInfo: { locked: boolean; reason: string | null };
  submitting: boolean;
  onNext: () => void;
}) {
  if (currentStep === 6) {
    return (
      <div className="flex justify-end mt-6">
        <Link href="/home">
          <Button>Selesai & Kembali</Button>
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
      <Button onClick={onNext} disabled={disabled} className="gap-1.5">
        {buttonText}
        {!disabled && <ArrowRight size={14} />}
      </Button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// STEP 0 — Petunjuk Pembelajaran
// ═════════════════════════════════════════════════════════════════════
function Step0() {
  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-3">
        Petunjuk Pembelajaran
      </h1>
      <p className="text-muted-foreground leading-relaxed mb-5">
        Selamat datang di proses pembelajaran SOP. Ikuti langkah-langkah berikut
        untuk menyelesaikan sosialisasi SOP dengan benar. Pastikan Anda membaca
        setiap materi dengan seksama sebelum melanjutkan ke tahap berikutnya.
      </p>
      <div className="bg-muted/40 rounded-xl border p-5 text-sm text-muted-foreground leading-relaxed">
        Proses pembelajaran ini terdiri dari beberapa tahapan yang harus
        diselesaikan secara berurutan. Anda perlu membaca dokumen SOP terlebih
        dahulu, kemudian mengunggah bukti bahwa Anda telah mengikuti
        sosialisasi, dan terakhir mengerjakan post-test untuk mengukur
        pemahaman Anda.
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
      <h1 className="font-display font-bold text-3xl mb-3">
        Akses Dokumen SOP
      </h1>
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
// STEP 2 — Baca Dokumen SOP (pakai SopAttachment utama)
// ═════════════════════════════════════════════════════════════════════
function Step2({
  doc,
  pdfUtama,
  highestStep,
}: {
  doc: any;
  pdfUtama: any | null;
  highestStep: number;
}) {
  const fileUrl = pdfUtama
    ? `/api/files/sop-attachments/${pdfUtama.filename}`
    : null;
  const canDownload = highestStep >= 2;

  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-2">Baca Dokumen SOP</h1>
      <p className="text-muted-foreground text-sm mb-5">
        Baca dan pelajari dokumen SOP berikut dengan seksama. Dokumen dapat
        diunduh setelah Anda menyelesaikan tahap pembelajaran ini.
      </p>

      {fileUrl && pdfUtama ? (
        <div className="border rounded-xl overflow-hidden bg-background">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-foreground text-background">
            <FileText size={16} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {doc.judul}.pdf
              </div>
              <div className="text-[11px] opacity-60">
                Preview dokumen pembelajaran
              </div>
            </div>
            <a
              href={canDownload ? fileUrl : undefined}
              download={canDownload ? `${doc.kode}.pdf` : undefined}
              onClick={(e) => !canDownload && e.preventDefault()}
              className={`text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                canDownload
                  ? "bg-background text-foreground hover:bg-background/90 cursor-pointer"
                  : "bg-background/20 text-background/50 cursor-not-allowed"
              }`}
              title={
                canDownload
                  ? "Download dokumen"
                  : "Selesaikan langkah ini untuk dapat mengunduh"
              }
            >
              <Download size={12} /> Download
            </a>
          </div>
          <iframe
            src={fileUrl}
            className="w-full h-[600px] bg-muted"
            title={doc.judul}
          />
          <div className="px-4 py-2 bg-muted/40 text-[11px] text-muted-foreground border-t">
            Jika preview tidak tampil,{" "}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              buka di tab baru
            </a>
            .
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
// STEP 3 — Lampiran SOP (filter lampiran only, exclude utama)
// ═════════════════════════════════════════════════════════════════════
function Step3({ lampiran }: { lampiran: any[] }) {
  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-2">
        Lampiran Dokumen SOP
      </h1>
      <p className="text-muted-foreground text-sm mb-5">
        Unduh lampiran pendukung dokumen SOP berikut sebelum melanjutkan ke
        tahap upload bukti sosialisasi.
      </p>
      {lampiran.length > 0 ? (
        <div className="space-y-2.5">
          {lampiran.map((a: any) => {
            const filename = a.filename.split("/").pop() || "lampiran";
            return (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 px-4 py-3 border rounded-xl bg-background"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Archive
                    size={20}
                    className="text-muted-foreground flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {filename}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {(a.ukuranKb / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <a
                  href={`/api/files/sop-attachments/${a.filename}`}
                  download
                  className="flex-shrink-0"
                >
                  <Button size="sm" className="gap-1.5">
                    <Download size={12} /> Download
                  </Button>
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-muted/40 rounded-xl border p-8 text-center text-sm text-muted-foreground">
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
        bg: "bg-amber-50 border-amber-200",
        badge: { text: "Menunggu", color: "bg-amber-100 text-amber-700" },
      },
      disetujui: {
        icon: "✓",
        title: "Bukti Disetujui",
        sub: "Anda dapat melanjutkan ke Post Test.",
        color: "text-green-700",
        bg: "bg-green-50 border-green-200",
        badge: { text: "Disetujui", color: "bg-green-100 text-green-700" },
      },
      ditolak: {
        icon: "✗",
        title: "Bukti Ditolak",
        sub:
          latestAttachment.alasanTolak ||
          "Silakan upload ulang dengan bukti yang sesuai.",
        color: "text-destructive",
        bg: "bg-red-50 border-red-200",
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
      <h1 className="font-display font-bold text-3xl mb-2">
        Upload Bukti Sosialisasi
      </h1>
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
            <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
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
// STEP 6 — Penutup
// ═════════════════════════════════════════════════════════════════════
function Step6({ doc }: { doc: any }) {
  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-3">Penutup</h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Selamat! Anda telah menyelesaikan seluruh proses pembelajaran SOP{" "}
        <strong>{doc.judul}</strong> dengan baik. Anda telah memahami isi
        dokumen, menyelesaikan upload bukti sosialisasi, dan melewati Post Test
        dengan hasil yang memuaskan.
      </p>
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
        <div className="text-3xl flex-shrink-0">🎉</div>
        <div>
          <div className="font-bold text-green-700">Pembelajaran Selesai!</div>
          <div className="text-sm text-green-600/85 mt-0.5">
            Anda telah menyelesaikan semua tahapan sosialisasi SOP dengan
            berhasil.
          </div>
        </div>
      </div>
    </div>
  );
}
