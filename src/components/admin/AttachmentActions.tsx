"use client";

// src/components/admin/AttachmentActions.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewAttachment } from "@/actions/attachment";
import { Button } from "@/components/ui/button";
import { Check, X, Pause, FileText, AlertCircle } from "lucide-react";

type Props = {
  attachment: {
    id: string;
    status: string;
    filename: string;
    alasanTolak?: string | null;
  };
};

export default function AttachmentActions({ attachment }: Props) {
  const router = useRouter();
  const [tolakOpen, setTolakOpen] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleView() {
    // Buka file di tab baru via API endpoint
    window.open(
      `/api/files/sosialisasi/${attachment.filename}`,
      "_blank"
    );
  }

  async function handle(decision: "disetujui" | "ditolak" | "pending") {
    setLoading(true);
    setErrorMsg(null);
    try {
      await reviewAttachment(
        attachment.id,
        decision,
        decision === "ditolak" ? alasan.trim() : undefined
      );
      setTolakOpen(false);
      setAlasan("");
      router.refresh();
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : "Gagal memproses attachment"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2.5 text-xs gap-1"
        onClick={handleView}
      >
        <FileText size={12} /> View
      </Button>

      {attachment.status === "menunggu" && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => handle("disetujui")}
            disabled={loading}
          >
            <Check size={12} /> Setuju
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setTolakOpen(true)}
            disabled={loading}
          >
            <X size={12} /> Tolak
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => handle("pending")}
            disabled={loading}
            title="Tandai sebagai pending"
          >
            <Pause size={12} />
          </Button>
        </>
      )}

      {/* Tolak modal */}
      {tolakOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) =>
            e.target === e.currentTarget && !loading && setTolakOpen(false)
          }
        >
          <div className="bg-background rounded-2xl border w-full max-w-md overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={18} className="text-destructive" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">
                    Tolak Bukti Sosialisasi
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Berikan alasan agar user tahu apa yang perlu diperbaiki
                    dan upload ulang.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Alasan Penolakan{" "}
                  <span className="text-destructive">*</span>
                </label>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Contoh: Foto tidak terbaca jelas, file korup, bukti kegiatan tidak relevan dengan SOP..."
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  Alasan ini akan dikirim sebagai notifikasi ke user.
                </p>
              </div>

              {errorMsg && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTolakOpen(false);
                    setAlasan("");
                    setErrorMsg(null);
                  }}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handle("ditolak")}
                  disabled={!alasan.trim() || loading}
                >
                  {loading
                    ? "Memproses..."
                    : "Tolak & Kirim Notifikasi"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
