"use client";
import { useState } from "react";
import { reviewAttachment } from "@/actions/attachment";
import { Button } from "@/components/ui/button";
import { Check, X, Pause, FileText } from "lucide-react";

type Props = {
  attachment: {
    id: string;
    status: string;
    filename: string;
    alasanTolak?: string | null;
  };
};

export default function AttachmentActions({ attachment }: Props) {
  const [tolakOpen, setTolakOpen] = useState(false);
  const [alasan,    setAlasan]    = useState("");
  const [loading,   setLoading]   = useState(false);

  async function handle(decision: "disetujui" | "ditolak" | "pending") {
    setLoading(true);
    await reviewAttachment(attachment.id, decision, decision === "ditolak" ? alasan : undefined);
    setLoading(false);
    setTolakOpen(false);
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1">
        <FileText size={12} /> View
      </Button>

      {attachment.status === "menunggu" && (
        <>
          <Button
            variant="outline" size="sm"
            className="h-7 px-2.5 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => handle("disetujui")} disabled={loading}
          >
            <Check size={12} /> Setuju
          </Button>
          <Button
            variant="outline" size="sm"
            className="h-7 px-2.5 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setTolakOpen(true)}
          >
            <X size={12} /> Tolak
          </Button>
          <Button
            variant="outline" size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => handle("pending")} disabled={loading}
          >
            <Pause size={12} />
          </Button>
        </>
      )}

      {/* Tolak modal */}
      {tolakOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl border w-full max-w-md p-6 space-y-4">
            <h2 className="font-display font-bold text-xl">Tolak Attachment</h2>
            <p className="text-sm text-muted-foreground">
              Berikan alasan agar user tahu apa yang perlu diperbaiki.
            </p>
            <textarea
              className="w-full border rounded-lg p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Contoh: Foto tidak terbaca, file korup..."
              value={alasan}
              onChange={e => setAlasan(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTolakOpen(false)}>Batal</Button>
              <Button
                variant="destructive"
                onClick={() => handle("ditolak")}
                disabled={!alasan.trim() || loading}
              >
                Tolak & Kirim Notifikasi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
