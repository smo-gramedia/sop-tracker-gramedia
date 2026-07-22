// src/components/user/RankingPanel.tsx
"use client";
import { useState } from "react";
import { Trophy, Award, Store, Building2 } from "lucide-react";
import type { RankingEntry } from "@/lib/ranking";
import { TIPE_LEADERBOARD, TIPE_USER_LABEL } from "@/lib/access";

export type PanelData = {
  top: RankingEntry[];
  me: RankingEntry | null;
  isInTop: boolean;
  totalRanked: number;
};

type Props = {
  /** Data leaderboard per tipe akun: store / supporting / publishing. */
  rankings: Record<string, PanelData>;
  /** Tipe akun user saat ini — dipakai sebagai tab yang terbuka pertama. */
  myTipe: string | null;
  currentUserId: string;
};

const KOSONG: PanelData = {
  top: [],
  me: null,
  isInTop: false,
  totalRanked: 0,
};

export default function RankingPanel({
  rankings,
  myTipe,
  currentUserId,
}: Props) {
  // Leaderboard dipisah per tipe akun karena jumlah SOP wajib tiap tipe
  // berbeda. Tab yang terbuka pertama = tipe akun user sendiri.
  const tabAwal =
    myTipe && (TIPE_LEADERBOARD as readonly string[]).includes(myTipe)
      ? myTipe
      : TIPE_LEADERBOARD[0];
  const [tab, setTab] = useState<string>(tabAwal);
  const { top, me, isInTop, totalRanked } = rankings[tab] ?? KOSONG;
  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 rounded-2xl border border-amber-100 p-6 hover-lift">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <Trophy size={16} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-base">Top Learners</div>
            <div className="text-[10px] text-muted-foreground">
              {totalRanked} unit kerja aktif
            </div>
          </div>
        </div>
      </div>

      {/* Tab per tipe akun */}
      <div className="flex gap-1 mb-4 bg-white/70 rounded-xl p-1">
        {TIPE_LEADERBOARD.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 text-[11px] sm:text-xs px-2 py-1.5 rounded-lg transition-all ${
              tab === t
                ? "bg-white shadow-sm font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {TIPE_USER_LABEL[t] ?? t}
          </button>
        ))}
      </div>

      {/* List */}
      {top.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center bg-white/60 rounded-xl">
          <Trophy size={20} className="mx-auto text-muted-foreground/40 mb-2" />
          <p>Belum ada unit kerja yang menyelesaikan SOP.</p>
          <p className="font-semibold mt-1">Jadilah yang pertama! 🚀</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {top.map((entry) => (
            <RankingRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === currentUserId}
            />
          ))}
        </div>
      )}

      {/* Posisi user sendiri (kalau bukan top 10) */}
      {me && !isInTop && (
        <>
          <div className="border-t border-amber-200/60 my-4" />
          <div className="flex items-center gap-1.5 mb-2">
            <Award size={11} className="text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              Posisi Anda
            </span>
          </div>
          <RankingRow entry={me} isCurrentUser />
        </>
      )}

      {/* Empty state untuk user yang belum punya progress */}
      {!me && top.length > 0 && (
        <>
          <div className="border-t border-amber-200/60 my-4" />
          <div className="bg-white/60 rounded-xl p-3 text-center">
            <p className="text-xs text-foreground font-medium">
              Selesaikan SOP pertama Anda
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function RankingRow({
  entry,
  isCurrentUser,
}: {
  entry: RankingEntry;
  isCurrentUser: boolean;
}) {
  const isTop3 = entry.rank <= 3;
  const medal =
    entry.rank === 1
      ? "🥇"
      : entry.rank === 2
      ? "🥈"
      : entry.rank === 3
      ? "🥉"
      : null;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl p-2 transition-all ${
        isCurrentUser
          ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-primary/30 shadow-sm"
          : isTop3
          ? "bg-white/70 hover:bg-white"
          : "hover:bg-white/50"
      }`}
    >
      {/* Rank / Medal */}
      <div className="w-7 flex-shrink-0 flex items-center justify-center">
        {medal ? (
          <span className="text-lg leading-none">{medal}</span>
        ) : (
          <span
            className={`text-[11px] font-bold ${
              isCurrentUser ? "text-primary" : "text-muted-foreground"
            }`}
          >
            #{entry.rank}
          </span>
        )}
      </div>

      {/* Tipe icon */}
      <TipeIcon tipe={entry.tipeUser} />

      {/* Name & unit */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-xs font-semibold truncate ${
            isCurrentUser ? "text-primary" : ""
          }`}
        >
          {entry.nama}
          {isCurrentUser && (
            <span className="ml-1.5 text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold">
              ANDA
            </span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground truncate font-mono">
          {entry.kodeUser}
          {entry.unit && (
            <>
              {" · "}
              <span className="font-sans">{entry.unit}</span>
            </>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="flex-shrink-0 text-right bg-white/80 rounded-lg px-2 py-1">
        <div className="text-xs font-bold text-green-600 leading-none">
          {entry.selesaiCount}
        </div>
        <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">
          SOP
        </div>
      </div>
    </div>
  );
}

// ─── Tipe Icon mini ───────────────────────────────────────────────────
function TipeIcon({ tipe }: { tipe: "store" | "department" | null }) {
  if (tipe === "store") {
    return (
      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
        <Store size={9} />
      </div>
    );
  }
  if (tipe === "department") {
    return (
      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
        <Building2 size={9} />
      </div>
    );
  }
  return null;
}
