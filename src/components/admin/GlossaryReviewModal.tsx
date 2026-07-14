"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Sparkles, Loader2, Info } from "lucide-react";
import {
  extractGlossaryFromSop,
  saveExtractedGlossary,
  type ExtractGlossaryResult,
} from "@/actions/glossary-import";

const WARN: Record<string, string> = {
  no_pdf:
    "Dokumen ini belum memiliki PDF utama, atau file utamanya bukan PDF. Ekstraksi otomatis memerlukan PDF (file .doc lama tidak didukung) — silakan unggah versi PDF.",
  no_text:
    "Ekstraksi glosarium otomatis tidak dapat dijalankan karena teks pada PDF ini tidak terbaca (kemungkinan hasil pindai/gambar). Silakan unggah PDF yang memuat teks, atau tambahkan istilah glosarium secara manual.",
  no_definisi:
    "Bagian 'DEFINISI' tidak ditemukan pada dokumen. Pastikan dokumen memuat sub-bab DEFINISI dengan format '<Istilah> adalah <penjelasan>', atau tambahkan istilah glosarium secara manual.",
};

export default function GlossaryReviewModal({
  open,
  onClose,
  sopId,
  sopKode,
}: {
  open: boolean;
  onClose: () => void;
  sopId: string | null;
  sopKode?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractGlossaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedBaru, setCheckedBaru] = useState<Set<string>>(new Set());
  const [checkedBeda, setCheckedBeda] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !sopId) return;
    let active = true;
    setLoading(true);
    setResult(null);
    setError(null);
    setSavedMsg(null);
    setCheckedBeda(new Set());
    extractGlossaryFromSop(sopId)
      .then((r) => {
        if (!active) return;
        setResult(r);
        if (r.status === "ok") {
          setCheckedBaru(new Set(r.baru.map((t) => t.istilah.toLowerCase())));
        }
      })
      .catch(() => active && setError("Gagal mengekstrak istilah dari dokumen."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, sopId]);

  if (!open) return null;

  const ok = result && result.status === "ok" ? result : null;
  const toggle = (setter: typeof setCheckedBaru, key: string) =>
    setter((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const selectedCount = checkedBaru.size + checkedBeda.size;

  async function handleSave() {
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      const entries: {
        istilah: string;
        definisi: string;
        updateId?: string;
      }[] = [];
      for (const t of ok.baru) {
        if (checkedBaru.has(t.istilah.toLowerCase()))
          entries.push({ istilah: t.istilah, definisi: t.definisi });
      }
      for (const t of ok.beda) {
        if (checkedBeda.has(t.istilah.toLowerCase()))
          entries.push({
            istilah: t.istilah,
            definisi: t.definisi,
            updateId: t.existingId,
          });
      }
      if (entries.length === 0) {
        setSaving(false);
        return;
      }
      const r = await saveExtractedGlossary(entries);
      setSavedMsg(
        `Berhasil disimpan — ${r.created} istilah baru, ${r.updated} diperbarui.`
      );
      setCheckedBaru(new Set());
      setCheckedBeda(new Set());
    } catch {
      setError("Gagal menyimpan ke glosarium.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-background rounded-2xl border w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> Tinjau Istilah
              Glosarium
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Istilah diambil dari sub-bab DEFINISI
              {sopKode ? ` • ${sopKode}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
              <Loader2 size={18} className="animate-spin" /> Membaca dokumen…
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && result && result.status !== "ok" && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex items-start gap-2.5">
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{WARN[result.status]}</span>
            </div>
          )}

          {savedMsg && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
              {savedMsg}
            </div>
          )}

          {ok && (
            <>
              {/* BARU */}
              <section>
                <h3 className="text-sm font-semibold mb-2">
                  Istilah baru ({ok.baru.length})
                </h3>
                {ok.baru.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada istilah baru.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ok.baru.map((t) => {
                      const k = t.istilah.toLowerCase();
                      return (
                        <label
                          key={k}
                          className="flex gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            checked={checkedBaru.has(k)}
                            onChange={() => toggle(setCheckedBaru, k)}
                            className="mt-1"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-sm">
                              {t.istilah}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t.definisi}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* BEDA */}
              {ok.beda.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-2 text-amber-700 flex items-center gap-1.5">
                    <AlertTriangle size={15} /> Sudah ada, tapi definisi berbeda
                    ({ok.beda.length})
                  </h3>
                  <div className="space-y-2">
                    {ok.beda.map((t) => {
                      const k = t.istilah.toLowerCase();
                      return (
                        <div
                          key={k}
                          className="p-3 rounded-lg border border-amber-200 bg-amber-50/50"
                        >
                          <div className="font-medium text-sm mb-1.5">
                            {t.istilah}
                          </div>
                          <div className="text-xs mb-1">
                            <span className="text-muted-foreground">
                              Di dokumen:{" "}
                            </span>
                            <span className="text-foreground">
                              {t.definisi}
                            </span>
                          </div>
                          <div className="text-xs mb-2">
                            <span className="text-muted-foreground">
                              Di glosarium:{" "}
                            </span>
                            <span className="text-foreground">
                              {t.existingDeskripsi}
                            </span>
                          </div>
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checkedBeda.has(k)}
                              onChange={() => toggle(setCheckedBeda, k)}
                            />
                            Perbarui definisi di glosarium dengan versi dokumen
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* SAMA */}
              {ok.sama.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-1.5">
                    <Info size={15} /> Sudah ada &amp; sama ({ok.sama.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {ok.sama.map((t) => (
                      <span
                        key={t.istilah}
                        className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                      >
                        {t.istilah}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {ok && (
          <div className="flex items-center justify-between gap-2 p-4 border-t">
            <span className="text-xs text-muted-foreground">
              {selectedCount} istilah dipilih
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Tutup
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || selectedCount === 0}
              >
                {saving ? "Menyimpan…" : "Simpan ke Glosarium"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
