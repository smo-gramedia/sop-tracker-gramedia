// src/app/(user)/notifikasi/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Bell } from "lucide-react";
import NotifikasiClient from "@/components/user/NotifikasiClient";

export default async function NotifikasiPage() {
  const session = await auth();

  const notifications = await prisma.notification.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sopDocument: {
        select: { id: true, kode: true, judul: true },
      },
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Notifikasi</p>
          <h1 className="font-display font-bold text-3xl mt-1 flex items-center gap-3">
            <Bell size={28} /> Notifikasi
            {unreadCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({unreadCount} belum dibaca)
              </span>
            )}
          </h1>
        </div>
      </div>

      <NotifikasiClient
        notifications={notifications.map((n) => ({
          id: n.id,
          tipe: n.tipe,
          judul: n.judul,
          pesan: n.pesan,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
          sopDocument: n.sopDocument
            ? {
                id: n.sopDocument.id,
                kode: n.sopDocument.kode,
                judul: n.sopDocument.judul,
              }
            : null,
        }))}
      />
    </div>
  );
}
