"use client";

// src/components/user/LearningSidebar.tsx
import { useState } from "react";
import {
  ClipboardList,
  NotebookPen,
  Check,
  ChevronDown,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NoteEditor from "./NoteEditor";
import {
  type LearningGateContext,
  getStepLockInfo,
  calculateProgress,
} from "@/lib/learning-gates";

// ─── Step structure (sesuai prototype) ──────────────────────────────────
const STEPS = [
  { id: 0, label: "Petunjuk Pembelajaran" },
  { id: 1, label: "Akses Dokumen SOP" },
  { id: 2, label: "Baca Dokumen SOP" },
  { id: 3, label: "Lampiran SOP" },
  { id: 4, label: "Upload Bukti Sosialisasi" },
  { id: 5, label: "Post Test" },
  { id: 6, label: "Penutup" },
];

const SECTIONS = [
  { name: "Persiapan Belajar", stepIds: [0, 1] },
  { name: "Pembelajaran SOP", stepIds: [2, 3, 4, 5] },
  { name: "Penyelesaian", stepIds: [6] },
];

type Props = {
  sopDocumentId: string;
  currentStep: number;
  highestStep: number;
  initialNote: string;
  gateContext: LearningGateContext;
  onStepClick: (step: number) => void;
};

export default function LearningSidebar({
  sopDocumentId,
  currentStep,
  highestStep,
  initialNote,
  gateContext,
  onStepClick,
}: Props) {
  const [tab, setTab] = useState<"progress" | "catatan">("progress");
  const [openSections, setOpenSections] = useState<Set<number>>(() => {
    const s = new Set<number>();
    SECTIONS.forEach((sec, i) => {
      if (sec.stepIds.some((id) => id <= currentStep)) s.add(i);
    });
    return s;
  });

  const percentage = calculateProgress(highestStep, gateContext);

  function toggleSection(i: number) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <aside className="bg-background border rounded-xl overflow-hidden sticky top-20">
      {/* Tabs */}
      <div className="grid grid-cols-2 border-b">
        <TabButton
          active={tab === "progress"}
          onClick={() => setTab("progress")}
          icon={ClipboardList}
        >
          Progress
        </TabButton>
        <TabButton
          active={tab === "catatan"}
          onClick={() => setTab("catatan")}
          icon={NotebookPen}
        >
          Catatan
        </TabButton>
      </div>

      {/* Content */}
      {tab === "progress" ? (
        <div>
          {/* Header progress */}
          <div className="px-4 py-3 border-b">
            <div className="text-xs font-semibold mb-1.5">
              {percentage}% Selesai
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Sections */}
          <div className="max-h-[500px] overflow-y-auto">
            {SECTIONS.map((sec, i) => {
              const isOpen = openSections.has(i);
              // Section dianggap "all done" kalau setiap step di dalamnya sudah dilewati
              // DAN tidak ada yang locked
              const allDone = sec.stepIds.every((id) => {
                const lock = getStepLockInfo(id, gateContext);
                return id < highestStep && !lock.locked;
              });

              return (
                <div key={sec.name} className="border-b last:border-0">
                  {/* Section header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(i)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      {allDone && (
                        <Check size={12} className="text-green-600" />
                      )}
                      {sec.name}
                    </span>
                    <ChevronDown
                      size={11}
                      className={cn(
                        "text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Section items */}
                  {isOpen && (
                    <div className="pb-2">
                      {sec.stepIds.map((stepId) => {
                        const step = STEPS[stepId];
                        const lockInfo = getStepLockInfo(stepId, gateContext);
                        const isLocked = lockInfo.locked;
                        const isDone = stepId < highestStep && !isLocked;
                        const isCurrent = stepId === currentStep;

                        // Tidak boleh klik kalau locked
                        const canClick = !isLocked;

                        return (
                          <button
                            key={stepId}
                            type="button"
                            disabled={!canClick}
                            onClick={() => canClick && onStepClick(stepId)}
                            title={lockInfo.reason ?? ""}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-4 py-1.5 text-xs transition-colors text-left",
                              canClick
                                ? "hover:bg-muted/30 cursor-pointer"
                                : "cursor-not-allowed opacity-60",
                              isCurrent && !isLocked && "bg-primary/5 font-medium",
                              isDone && !isCurrent && "text-green-700"
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
                                isLocked
                                  ? "bg-muted/50 border-border text-muted-foreground"
                                  : isDone
                                  ? "bg-green-500 border-green-500 text-white"
                                  : isCurrent
                                  ? "bg-foreground border-foreground text-background"
                                  : "bg-muted/40 border-border text-muted-foreground"
                              )}
                            >
                              {isLocked ? (
                                <Lock size={9} />
                              ) : isDone ? (
                                "✓"
                              ) : isCurrent ? (
                                "→"
                              ) : (
                                ""
                              )}
                            </div>
                            <span
                              className={cn(
                                "flex-1",
                                isLocked && "text-muted-foreground"
                              )}
                            >
                              {step.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <NoteEditor
          sopDocumentId={sopDocumentId}
          initialContent={initialNote}
        />
      )}
    </aside>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border-r last:border-r-0",
        active
          ? "bg-foreground text-background"
          : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon size={13} />
      {children}
    </button>
  );
}
