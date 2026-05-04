// src/components/user/BelajarClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { LEARNING_STEPS } from "@/lib/constants";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  FileText,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  doc: any;
  progress: any;
  postTest: any;
  latestAttachment: any;
  myResults: any[];
  userId: string;
};

export default function BelajarClient({
  doc,
  progress,
  postTest,
  latestAttachment,
  myResults,
  userId,
}: Props) {
  const [currentStep, setCurrentStep] = useState(progress?.stepCurrent ?? 0);
  const [submittingStep, setSubmittingStep] = useState(false);

  async function goToStep(step: number) {
    if (step < 0 || step > 6) return;
    setSubmittingStep(true);
    await fetch("/api/learning", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sopDocumentId: doc.id, step }),
    });
    setCurrentStep(step);
    setSubmittingStep(false);
  }

  const stepDone = (s: number) => (progress?.stepCurrent ?? 0) >= s;
  const attachmentOk = latestAttachment?.status === "disetujui";

  return (
    <>
      {/* Sub-navbar / breadcrumb (di bawah UserNavbar global dari layout) */}
      <div className="bg-background border-b sticky top-14 z-20">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center gap-4">
          <Link
            href="/home"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} /> Kembali
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="font-semibold text-sm truncate">{doc.judul}</span>
          <span className="font-mono text-xs text-muted-foreground ml-auto">
            {doc.kode}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Step progress bar */}
        <div className="bg-background rounded-xl border p-5 mb-6">
          <div className="flex items-center justify-between">
            {LEARNING_STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all
                    ${
                      currentStep === i
                        ? "border-foreground bg-foreground text-background"
                        : stepDone(i)
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {stepDone(i) && currentStep !== i ? (
                      <Check size={14} />
                    ) : (
                      i
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center w-16 leading-tight">
                    {step.label}
                  </span>
                </div>
                {i < 6 && (
                  <div
                    className={`flex-1 h-0.5 mb-5 mx-1 ${
                      stepDone(i) ? "bg-green-500" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-background rounded-xl border p-8 mb-6 min-h-[400px]">
          {currentStep === 0 && <Step0 doc={doc} />}
          {currentStep === 1 && <Step1 doc={doc} />}
          {currentStep === 2 && <Step2 doc={doc} />}
          {currentStep === 3 && <Step3 doc={doc} />}
          {currentStep === 4 && (
            <Step4
              docId={doc.id}
              userId={userId}
              latestAttachment={latestAttachment}
            />
          )}
          {currentStep === 5 && (
            <Step5
              postTest={postTest}
              myResults={myResults}
              attachmentOk={attachmentOk}
              docId={doc.id}
              userId={userId}
            />
          )}
          {currentStep === 6 && <Step6 doc={doc} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 0 || submittingStep}
          >
            <ChevronLeft size={16} /> Sebelumnya
          </Button>
          {currentStep < 6 && (
            <Button
              onClick={() => goToStep(currentStep + 1)}
              disabled={
                submittingStep ||
                (currentStep === 4 && !attachmentOk) ||
                (currentStep === 5 &&
                  myResults.every((r) => r.status !== "lulus"))
              }
            >
              {currentStep === 5 ? "Selesai" : "Selanjutnya"}{" "}
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Step Components ─────────────────────────────────────────────────

function Step0({ doc }: { doc: any }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="font-display font-bold text-2xl">Petunjuk Pembelajaran</h2>
      <p className="text-muted-foreground">
        Sebelum memulai, pastikan Anda memahami alur pembelajaran berikut:
      </p>
      <ol className="space-y-3">
        {[
          "Baca petunjuk pembelajaran ini dengan seksama",
          "Akses dan unduh dokumen SOP yang tersedia",
          "Baca dan pahami isi dokumen SOP minimal 20 menit",
          "Pelajari lampiran SOP jika tersedia",
          "Upload foto/dokumen sebagai bukti sosialisasi",
          "Kerjakan Post Test untuk menguji pemahaman",
          "Selesai! Progress akan tersimpan otomatis",
        ].map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Step1({ doc }: { doc: any }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="font-display font-bold text-2xl">Akses Dokumen</h2>
      <p className="text-muted-foreground text-sm">
        Berikut dokumen SOP yang perlu Anda pelajari:
      </p>
      <div className="border rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
          <FileText size={24} className="text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">{doc.judul}</div>
          <div className="text-sm text-muted-foreground">
            {doc.kode} · {doc.versi} · PDF
          </div>
        </div>
        <Button variant="outline" size="sm">
          ⬇ Download PDF
        </Button>
      </div>
      {doc.rawDocuments?.[0] && (
        <div className="border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <FileText size={24} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Raw Dokumen</div>
            <div className="text-sm text-muted-foreground">
              {doc.rawDocuments[0].filename} · .docx
            </div>
          </div>
          <Button variant="outline" size="sm">
            ⬇ Download .docx
          </Button>
        </div>
      )}
    </div>
  );
}

function Step2({ doc }: { doc: any }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="font-display font-bold text-2xl">Baca Dokumen</h2>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        ⏱ Dokumen dapat diunduh setelah <strong>20 menit</strong> pembelajaran.
        Pastikan Anda membaca dengan seksama.
      </div>
      <div className="bg-muted rounded-xl p-8 text-center text-muted-foreground">
        <FileText size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Preview PDF akan tampil di sini</p>
        <p className="text-xs mt-1">{doc.judul}</p>
      </div>
    </div>
  );
}

function Step3({ doc }: { doc: any }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="font-display font-bold text-2xl">Lampiran SOP</h2>
      {doc.sopAttachments?.length > 0 ? (
        <div className="space-y-3">
          {doc.sopAttachments.map((a: any) => (
            <div
              key={a.id}
              className="border rounded-xl p-4 flex items-center gap-3"
            >
              <FileText size={20} className="text-muted-foreground" />
              <div className="flex-1 text-sm">{a.filename}</div>
              <Button variant="outline" size="sm">
                ⬇ Download
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-muted rounded-xl p-8 text-center text-muted-foreground text-sm">
          Tidak ada lampiran untuk SOP ini.
        </div>
      )}
    </div>
  );
}

function Step4({
  docId,
  userId,
  latestAttachment,
}: {
  docId: string;
  userId: string;
  latestAttachment: any;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(!!latestAttachment);

  async function uploadFile() {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "sosialisasi");
    fd.append("sopDocumentId", docId);
    await fetch("/api/upload", { method: "POST", body: fd });
    setDone(true);
    setUploading(false);
  }

  const statusMap: Record<
    string,
    { color: string; label: string; icon: string }
  > = {
    menunggu: {
      color: "text-amber-600",
      label: "Menunggu Verifikasi Admin",
      icon: "⏳",
    },
    disetujui: {
      color: "text-green-600",
      label: "Disetujui — Post Test terbuka",
      icon: "✓",
    },
    ditolak: {
      color: "text-destructive",
      label: "Ditolak — Upload ulang",
      icon: "✗",
    },
    pending: {
      color: "text-muted-foreground",
      label: "Pending",
      icon: "⏸",
    },
  };
  const st = latestAttachment ? statusMap[latestAttachment.status] : null;

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="font-display font-bold text-2xl">
        Upload Bukti Sosialisasi
      </h2>
      <p className="text-muted-foreground text-sm">
        Upload foto atau dokumen sebagai bukti Anda telah mengikuti sosialisasi
        SOP ini.
      </p>

      {st && (
        <div className="border rounded-xl p-4 flex items-center gap-3">
          <span className="text-xl">{st.icon}</span>
          <div>
            <div className={`font-medium text-sm ${st.color}`}>{st.label}</div>
            {latestAttachment.alasanTolak && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Alasan: {latestAttachment.alasanTolak}
              </div>
            )}
          </div>
        </div>
      )}

      {(!latestAttachment || latestAttachment.status === "ditolak") && (
        <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-3">
          <Upload size={32} className="mx-auto text-muted-foreground" />
          <div>
            <label className="cursor-pointer">
              <span className="text-sm font-medium">Klik untuk pilih file</span>
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, JPEG, PDF · Maks 5MB
            </p>
          </div>
          {file && (
            <div className="bg-muted rounded-lg px-4 py-2 text-sm text-left flex items-center justify-between">
              <span>{file.name}</span>
              <Button size="sm" onClick={uploadFile} disabled={uploading}>
                {uploading ? "Mengupload..." : "Unggah & Kirim"}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
        <strong>Catatan:</strong> Setelah upload, admin akan memverifikasi
        bukti Anda. Notifikasi akan dikirim via email dan in-app. Post Test
        akan terbuka setelah disetujui.
      </div>
    </div>
  );
}

function Step5({ postTest, myResults, attachmentOk, docId, userId }: any) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmit] = useState(false);
  const startTime = useState(Date.now())[0];
  const bestResult =
    myResults.find((r: any) => r.status === "lulus") ??
    myResults[myResults.length - 1];

  async function submitTest() {
    if (!postTest) return;
    setSubmit(true);
    const res = await fetch("/api/post-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postTestId: postTest.id,
        answers,
        durasiDetik: Math.round((Date.now() - startTime) / 1000),
      }),
    });
    const data = await res.json();
    setResult(data);
    setSubmit(false);
  }

  if (!attachmentOk)
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
        <Lock size={32} className="text-muted-foreground" />
        <p className="font-semibold">Post Test Terkunci</p>
        <p className="text-sm text-muted-foreground">
          Selesaikan upload bukti sosialisasi dan tunggu persetujuan admin.
        </p>
      </div>
    );

  if (!postTest)
    return (
      <div className="text-center text-muted-foreground py-12">
        Post Test belum tersedia untuk SOP ini.
      </div>
    );

  if (result)
    return (
      <div className="text-center space-y-4 py-8">
        <div
          className={`text-6xl font-display font-bold ${
            result.status === "lulus" ? "text-green-600" : "text-destructive"
          }`}
        >
          {result.skor}
        </div>
        <div className="text-lg font-semibold">
          {result.status === "lulus" ? "🎉 Lulus!" : "Belum Lulus"}
        </div>
        <div className="text-sm text-muted-foreground">
          Benar: {result.jumlahBenar} · Salah: {result.jumlahSalah}
        </div>
        {result.status !== "lulus" && (
          <Button
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
          >
            Coba Lagi
          </Button>
        )}
      </div>
    );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-2xl">Post Test</h2>
        {bestResult && (
          <span className="text-sm text-muted-foreground">
            Percobaan ke-{myResults.length + 1} · Terbaik: {bestResult.skor}
          </span>
        )}
      </div>
      {postTest.questions.map((q: any, i: number) => (
        <div key={q.id} className="space-y-2">
          <p className="font-medium text-sm">
            {i + 1}. {q.pertanyaan}
          </p>
          <div className="space-y-1.5">
            {(["a", "b", "c", "d"] as const).map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors
                ${
                  answers[q.id] === opt
                    ? "border-foreground bg-foreground/5"
                    : "hover:bg-muted"
                }`}
              >
                <input
                  type="radio"
                  name={q.id}
                  value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() =>
                    setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                  }
                  className="accent-foreground"
                />
                <span className="text-sm">
                  {q[`opsi${opt.toUpperCase()}`]}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <Button
        onClick={submitTest}
        disabled={
          submitting ||
          Object.keys(answers).length < postTest.questions.length
        }
        className="w-full"
      >
        {submitting ? "Mengirim..." : "Kumpulkan Jawaban"}
      </Button>
    </div>
  );
}

function Step6({ doc }: { doc: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
      <div className="text-6xl">🎉</div>
      <h2 className="font-display font-bold text-3xl">
        Pembelajaran Selesai!
      </h2>
      <p className="text-muted-foreground max-w-md">
        Selamat! Anda telah menyelesaikan pembelajaran SOP{" "}
        <strong>{doc.judul}</strong>. Progress Anda telah tersimpan.
      </p>
      <div className="flex gap-3 pt-2">
        <Link href="/home">
          <Button variant="outline">← Kembali ke Home</Button>
        </Link>
        <Link href="/profil">
          <Button>Lihat Progress Saya</Button>
        </Link>
      </div>
    </div>
  );
}
