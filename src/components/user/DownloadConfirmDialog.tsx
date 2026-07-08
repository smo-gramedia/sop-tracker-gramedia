"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

// Cache identitas unit supaya tidak fetch berulang.
let cachedMe: { kodeUser: string; namaToko: string } | null = null;

export default function DownloadConfirmDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [me, setMe] = useState(cachedMe);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || me) return;
    let active = true;
    setLoading(true);
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (active && d?.kodeUser !== undefined) {
          cachedMe = { kodeUser: d.kodeUser || "", namaToko: d.namaToko || "" };
          setMe(cachedMe);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, me]);

  if (!open) return null;

  const unit =
    me && me.namaToko
      ? `${me.namaToko}${me.kodeUser ? ` (${me.kodeUser})` : ""}`
      : "unit kerja Anda";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-background rounded-2xl border w-full max-w-md overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={18} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">
                Konfirmasi Unduhan
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Dokumen SOP ini bersifat rahasia dan hanya untuk keperluan
                internal. File yang diunduh ditandai serta dicatat atas nama
                unit{" "}
                <span className="font-semibold text-foreground">{unit}</span>,
                dan menjadi tanggung jawab unit yang bersangkutan.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              disabled={loading && !me}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Setuju &amp; Unduh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
