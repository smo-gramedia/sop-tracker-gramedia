// src/app/(user)/notifikasi/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Bell, CheckCheck, FileText, Award, Info } from "lucide-react";
import { formatTanggal } from "@/lib/utils";
import { markAllNotifsAsRead } from "@/actions/notification-actions";
import NotifMarkReadButton from "@/components/user/NotifMarkReadButton";

export default async function NotifikasiPage() {
  const session = await auth();

  const notifications = await prisma.notification.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sopDocument: { select: { id: true, kode: true, judul: true } },
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Aktivitas</p>
          <h1 className="font-display font-bold text-3xl mt-1">Notifikasi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} notifikasi belum dibaca`
              : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        {unreadCount > 0 && <NotifMarkReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-background rounded-xl border p-12 text-center">
          <Bell
            size={32}
            className="mx-auto text-muted-foreground/40 mb-3"
          />
          <p className="text-muted-foreground">Belum ada notifikasi.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const linkHref = n.sopDocument?.id
              ? `/belajar/${n.sopDocument.id}`
              : "/home";
            return (
              <Link
                key={n.id}
                href={linkHref}
                className={`block bg-background rounded-xl border p-4 hover:shadow-sm transition-all ${
                  !n.isRead
                    ? "border-primary/30 bg-primary/5"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <NotifIcon tipe={n.tipe} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{n.judul}</h3>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {n.pesan}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{formatTanggal(n.createdAt)}</span>
                      {n.sopDocument && (
                        <span className="font-mono">
                          {n.sopDocument.kode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotifIcon({ tipe }: { tipe: string }) {
  const map: Record<
    string,
    { icon: React.ElementType; color: string; bg: string }
  > = {
    attachment: {
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    post_test: { icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
    info: { icon: Info, color: "text-gray-600", bg: "bg-gray-100" },
  };
  const cfg = map[tipe] ?? map.info;
  const Icon = cfg.icon;
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
    >
      <Icon size={16} className={cfg.color} />
    </div>
  );
}
