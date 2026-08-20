"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
};

export default function DocxPreviewModal({
  open,
  onClose,
  title,
  fileUrl,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    const controller = new AbortController();
    const container = containerRef.current;
    let active = true;

    async function renderDocument() {
      setLoading(true);
      setError(null);
      container.replaceChildren();

      try {
        const [response, { renderAsync }] = await Promise.all([
          fetch(fileUrl, { signal: controller.signal }),
          import("docx-preview"),
        ]);

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error || "Gagal mengambil dokumen");
        }

        const documentBlob = await response.blob();
        if (!active) return;

        await renderAsync(documentBlob, container, undefined, {
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderAltChunks: false,
          useBase64URL: true,
        });
      } catch (cause) {
        if (!active || controller.signal.aborted) return;
        setError(
          cause instanceof Error ? cause.message : "Gagal menampilkan dokumen",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void renderDocument();
    return () => {
      active = false;
      controller.abort();
      container.replaceChildren();
    };
  }, [fileUrl, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${title}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border bg-background sm:h-[92vh] sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-base font-bold">
              {title}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Preview raw dokumen
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Tutup preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex-1 overflow-auto bg-neutral-200">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle size={18} className="animate-spin" />
                Memuat dokumen...
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="max-w-md rounded-xl border bg-background p-5 text-center shadow-sm">
                <p className="font-medium">Dokumen tidak dapat ditampilkan</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          )}
          <div ref={containerRef} className="min-h-full py-4 sm:py-6" />
        </div>

        <div className="border-t bg-muted/40 px-5 py-2 text-center text-[11px] text-muted-foreground">
          Tekan ESC atau klik di luar modal untuk menutup
        </div>
      </div>
    </div>
  );
}
