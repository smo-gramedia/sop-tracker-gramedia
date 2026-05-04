// src/components/user/NotifikasiClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, FileText, ClipboardList, Info, Inbox } from "lucide-react";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/actions/notifications";

type Notification = {
  id: string;
  tipe: "attachment" | "post_test" | "info";
  judul: string;
  pesan: string;
  isRead: boolean;
  createdAt: string;
  sopDocument: { id: string; kode: string; judul: string } | null;
};

type Props = { notifications: Notification[] };

const TIPE_ICON = {
  attachment: FileText,
  post_test: ClipboardList,
  info: Info,
};

const TIPE_COLOR = {
  attachment: "bg-blue-50 text-blue-600 border-blue-200",
  post_test: "bg-purple-50 text-purple-600 border-purple-200",
  info: "bg-gray-50 text-gray-600 border-gray-200",
};

const TIPE_LABEL = {
  attachment: "Bukti Sosialisasi",
  post_test: "Post Test",
  info: "Info",
};

export default function NotifikasiClient({ notifications }: Props) {
  const router = useRouter();
  const [markingAll, setMarkingAll] = useState(false);

  const hasUnread = notifications.some((n) => !n.isRead);

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal");
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleMarkOne(id: string) {
    try {
      await markNotificationAsRead(id);
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-background rounded-2xl border p-12 text-center">
        <Inbox
          size={48}
          className="mx-auto text-muted-foreground/40 mb-3"
        />
        <p className="text-muted-foreground">Belum ada notifikasi</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={markingAll}
            className="gap-1.5"
          >
            <Check size={14} />
            {markingAll ? "Memproses..." : "Tandai semua sudah dibaca"}
          </Button>
        </div>
      )}

      <div className="bg-background rounded-2xl border divide-y overflow-hidden">
        {notifications.map((n) => {
          const Icon = TIPE_ICON[n.tipe] ?? Info;
          return (
            <div
              key={n.id}
              className={`p-5 transition-colors ${
                n.isRead ? "" : "bg-blue-50/30"
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${
                    TIPE_COLOR[n.tipe] ?? TIPE_COLOR.info
                  }`}
                >
                  <Icon size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {n.judul}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {TIPE_LABEL[n.tipe] ?? n.tipe} ·{" "}
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkOne(n.id)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {n.pesan}
                  </p>

                  {n.sopDocument && (
                    <Link
                      href={`/belajar/${n.sopDocument.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline mt-3"
                    >
                      <span className="font-mono text-muted-foreground">
                        {n.sopDocument.kode}
                      </span>
                      · {n.sopDocument.judul} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Helper: format relatif (mis: "5 menit yang lalu")
// ─────────────────────────────────────────────
function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  if (diffDay < 7) return `${diffDay} hari yang lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
