"use client";

// src/components/user/PdfPreviewModal.tsx
import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string; // /api/files/sop-attachments/<path>
};

export default function PdfPreviewModal({
  open,
  onClose,
  title,
  fileUrl,
}: Props) {
  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Click backdrop to close
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-background rounded-2xl border w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b bg-background">
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-base truncate">
              {title}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Preview Dokumen SOP
            </p>
          </div>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
          >
            <ExternalLink size={12} /> Buka di Tab Baru
          </a>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Tutup preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* PDF iframe */}
        <div className="flex-1 bg-muted/30">
          <iframe
            src={fileUrl}
            className="w-full h-full"
            title={title}
          />
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2 border-t bg-muted/40 text-[11px] text-muted-foreground text-center">
          Tekan ESC atau klik di luar modal untuk menutup
        </div>
      </div>
    </div>
  );
}
