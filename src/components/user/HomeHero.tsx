// src/components/user/HomeHero.tsx
import Link from "next/link";
import { Sparkles, BookOpen, ArrowRight, TrendingUp } from "lucide-react";

type Props = {
  userName: string;
  totalSelesai: number;
  totalDipelajari: number;
  totalSop: number;
  continueLearning?: {
    sopId: string;
    sopJudul: string;
    stepCurrent: number;
  } | null;
};

export default function HomeHero({
  userName,
  totalSelesai,
  totalDipelajari,
  totalSop,
  continueLearning,
}: Props) {
  const firstName = userName.split(" ")[0];
  const persenSelesai =
    totalSop > 0 ? Math.round((totalSelesai / totalSop) * 100) : 0;

  return (
    <div className="relative bg-mesh-hero rounded-3xl overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 blob-decoration animate-pulse" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-white/5 blob-decoration" />

      <div className="relative px-8 py-12 md:px-12 md:py-16">
      

        <div className="grid md:grid-cols-[1.5fr_1fr] gap-8 items-center">
          {/* Left: Text */}
          <div>
            {/* Identitas unit — tetap ditampilkan di atas sapaan */}
            <div className="text-white/70 text-xs md:text-sm font-semibold tracking-wide uppercase mb-2">
              {firstName}
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-4">
              Halo, Gramedians!
              <br />
              <span className="bg-gradient-to-r from-pink-200 to-amber-200 bg-clip-text text-transparent">
                Siap upgrade skill hari ini?
              </span>
            </h1>
            <p className="text-white/80 text-base leading-relaxed mb-6 max-w-lg">
              Yuk, pelajari SOP Gramedia dengan cara yang lebih mudah, cepat, dan
              seru. Selesaikan setiap materi, kumpulkan pencapaianmu, dan raih
              posisi teratas di leaderboard!
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              {continueLearning ? (
                <Link
                  href={`/belajar/${continueLearning.sopId}`}
                  className="inline-flex items-center gap-2 bg-white text-foreground rounded-xl px-6 py-3 font-semibold text-sm hover:bg-white/90 hover:scale-105 transition-all shadow-lg"
                >
                  <BookOpen size={16} />
                  Lanjutkan Belajar
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <Link
                  href="/sop/sr"
                  className="inline-flex items-center gap-2 bg-white text-foreground rounded-xl px-6 py-3 font-semibold text-sm hover:bg-white/90 hover:scale-105 transition-all shadow-lg"
                >
                  <BookOpen size={16} />
                  Mulai Belajar
                  <ArrowRight size={14} />
                </Link>
              )}
              <Link
                href="/profil"
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white rounded-xl px-6 py-3 font-semibold text-sm hover:bg-white/25 transition-colors"
              >
                <TrendingUp size={16} />
                Lihat Progress Saya
              </Link>
            </div>

            {/* Continue learning hint */}
            {continueLearning && (
              <p className="text-white/70 text-xs mt-4">
                <span className="font-semibold">Sedang dipelajari:</span>{" "}
                {continueLearning.sopJudul} (Step {continueLearning.stepCurrent}/6)
              </p>
            )}
          </div>

          {/* Right: Stats card */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <div className="text-white/80 text-xs uppercase tracking-wider mb-3 font-semibold">
              Progress Anda
            </div>

            {/* Big circle */}
            <div className="flex items-center gap-4 mb-5">
              <CircularProgress percentage={persenSelesai} />
              <div>
                <div className="text-white text-3xl font-display font-bold">
                  {totalSelesai}
                </div>
                <div className="text-white/70 text-xs">SOP Selesai</div>
                <div className="text-white/50 text-[11px] mt-0.5">
                  dari {totalSop} total
                </div>
              </div>
            </div>

            {/* Sub stats */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/15">
              <div>
                <div className="text-white text-xl font-display font-bold">
                  {totalDipelajari}
                </div>
                <div className="text-white/60 text-[11px]">
                  Sedang dipelajari
                </div>
              </div>
              <div>
                <div className="text-white text-xl font-display font-bold">
                  {persenSelesai}%
                </div>
                <div className="text-white/60 text-[11px]">Tingkat selesai</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-sm">{percentage}%</span>
      </div>
    </div>
  );
}
