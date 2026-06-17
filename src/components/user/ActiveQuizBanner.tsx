// src/components/user/ActiveQuizBanner.tsx
"use client";

/**
 * Banner yang muncul di setiap halaman user kalau ada quiz session aktif
 * di localStorage. Berguna saat user membuka tab baru / navigate ke home
 * sambil quiz masih in-progress — banner menawarkan tombol untuk balik
 * ke halaman quiz.
 *
 * Banner otomatis HILANG saat user sudah di halaman /belajar/{id}
 * (tidak perlu menampilkan call-to-action di halaman tujuan-nya sendiri).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, X, ArrowRight } from "lucide-react";

const STORAGE_PREFIX = "postTest:";

type ActiveSession = {
  postTestId: string;
  sopDocumentId: string;
  sopJudul?: string;
  startedAt: number;
  durasiMenit: number;
  nikKaryawan: string;
  namaKaryawan: string;
  secondsLeft: number; // computed
};

function scanActiveSessions(): ActiveSession[] {
  if (typeof window === "undefined") return [];
  const sessions: ActiveSession[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (
          !parsed.postTestId ||
          !parsed.sopDocumentId ||
          !parsed.startedAt ||
          !parsed.durasiMenit
        ) {
          continue;
        }
        const elapsedSec = Math.floor((Date.now() - parsed.startedAt) / 1000);
        const totalSec = parsed.durasiMenit * 60;
        const secondsLeft = totalSec - elapsedSec;
        if (secondsLeft <= 0) {
          // Expired — cleanup
          window.localStorage.removeItem(key);
          continue;
        }
        sessions.push({
          postTestId: parsed.postTestId,
          sopDocumentId: parsed.sopDocumentId,
          sopJudul: parsed.sopJudul,
          startedAt: parsed.startedAt,
          durasiMenit: parsed.durasiMenit,
          nikKaryawan: parsed.nikKaryawan,
          namaKaryawan: parsed.namaKaryawan,
          secondsLeft,
        });
      } catch {
        /* corrupt — skip */
      }
    }
  } catch {
    /* localStorage access error — return empty */
  }
  return sessions;
}

function formatTimeLeft(sec: number): string {
  if (sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ActiveQuizBanner() {
  const pathname = usePathname();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  // ─── Scan localStorage on mount + setiap 5 detik untuk update timer ──
  useEffect(() => {
    const refresh = () => setSessions(scanActiveSessions());
    refresh();
    const interval = setInterval(refresh, 5000);

    // Listen ke storage event supaya banner update kalau ada perubahan
    // dari tab lain (mis: user submit di tab A → tab B banner-nya hilang)
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith(STORAGE_PREFIX)) {
        refresh();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Filter: jangan tampilkan banner kalau user sudah di halaman belajar
  // yang sesuai (tidak perlu CTA balik kalau sudah di sana).
  const visible = sessions.filter((s) => {
    if (dismissed[s.postTestId]) return false;
    // Kalau user sedang di /belajar/{sopDocumentId} — sembunyikan
    if (pathname?.startsWith(`/belajar/${s.sopDocumentId}`)) return false;
    return true;
  });

  if (visible.length === 0) return null;

  return (
    <div className="sticky top-14 z-20 px-4 pt-3">
      <div className="max-w-6xl mx-auto space-y-2">
        {visible.map((s) => (
          <div
            key={s.postTestId}
            className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm flex items-start sm:items-center gap-3 px-4 py-3"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock size={16} className="text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-amber-900">
                Anda memiliki Post Test yang sedang dikerjakan
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                {s.sopJudul ? `${s.sopJudul} · ` : ""}
                NIK {s.nikKaryawan}
                {s.namaKaryawan ? ` (${s.namaKaryawan})` : ""}
                {" · "}
                Sisa waktu:{" "}
                <span className="font-mono font-semibold">
                  {formatTimeLeft(s.secondsLeft)}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5">
              <Link
                href={`/belajar/${s.sopDocumentId}`}
                className="text-xs font-semibold bg-amber-700 text-white rounded-lg px-3 py-1.5 hover:bg-amber-800 transition-colors flex items-center gap-1"
              >
                Lanjutkan <ArrowRight size={12} />
              </Link>
              <button
                onClick={() =>
                  setDismissed((prev) => ({ ...prev, [s.postTestId]: true }))
                }
                className="p-1 rounded-md hover:bg-amber-100 transition-colors text-amber-700"
                aria-label="Tutup banner"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
