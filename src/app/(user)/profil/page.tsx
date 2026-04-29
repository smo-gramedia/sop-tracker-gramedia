// src/app/(user)/profil/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatTanggal } from "@/lib/utils";
import { SOP_KATEGORI_LABEL } from "@/lib/constants";

export default async function ProfilPage() {
  const session = await auth();
  const userId  = session!.user.id;

  const [user, progressList, activityLogs, notifications] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.learningProgress.findMany({
      where: { userId },
      orderBy: { lastAccessedAt: "desc" },
      include: {
        sopDocument: { select: { id:true, kode:true, judul:true, kategori:true } },
      },
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { sopDocument: { select: { judul:true } } },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const selesai    = progressList.filter(p => p.status === "selesai").length;
  const dipelajari = progressList.filter(p => p.status === "dipelajari").length;
  const unreadNotif= notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link href="/home" className="flex items-center gap-2 font-display font-bold text-lg">
            <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">G</div>
            Gramedia
          </Link>
          <Link href="/home" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
          <span className="text-sm font-medium">Profil</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Profile header */}
        <div className="bg-background rounded-2xl border p-6 flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center font-display font-bold text-2xl flex-shrink-0">
            {user?.nama.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-2xl">{user?.nama}</h1>
            <div className="text-muted-foreground text-sm mt-0.5">{user?.email}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
              {user?.kodeKaryawan && <span>ID: <strong className="text-foreground">{user.kodeKaryawan}</strong></span>}
              {user?.unit         && <span>Unit: <strong className="text-foreground">{user.unit}</strong></span>}
              {user?.jabatan      && <span>Jabatan: <strong className="text-foreground">{user.jabatan}</strong></span>}
              {user?.section      && <span>Section: <strong className="text-foreground">{user.section}</strong></span>}
              {user?.joinedAt     && <span>Bergabung: {formatTanggal(user.joinedAt)}</span>}
            </div>
          </div>
          <Link href="/profil/settings" className="text-sm text-muted-foreground hover:text-foreground border rounded-lg px-3 py-1.5">
            ⚙ Pengaturan
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Stats */}
          <div className="bg-background rounded-xl border p-5">
            <div className="text-3xl font-display font-bold text-green-600">{selesai}</div>
            <div className="text-sm text-muted-foreground mt-1">SOP Selesai</div>
          </div>
          <div className="bg-background rounded-xl border p-5">
            <div className="text-3xl font-display font-bold text-amber-600">{dipelajari}</div>
            <div className="text-sm text-muted-foreground mt-1">Sedang Dipelajari</div>
          </div>
          <div className="bg-background rounded-xl border p-5 relative">
            {unreadNotif > 0 && (
              <span className="absolute top-4 right-4 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadNotif}</span>
            )}
            <div className="text-3xl font-display font-bold">{notifications.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Notifikasi</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Learning progress */}
          <div className="bg-background rounded-xl border">
            <div className="p-5 border-b font-display font-semibold">Progress Pembelajaran</div>
            <div className="divide-y">
              {progressList.slice(0, 6).map(p => (
                <Link key={p.id} href={`/belajar/${p.sopDocument.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.sopDocument.judul}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {SOP_KATEGORI_LABEL[p.sopDocument.kategori]} · Step {p.stepCurrent}/6
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    p.status==="selesai" ? "bg-green-50 text-green-700 border-green-200" :
                    p.status==="dipelajari" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-muted text-muted-foreground border-border"}`}>
                    {p.status==="selesai" ? "✓ Selesai" : p.status==="dipelajari" ? "Dipelajari" : "Belum"}
                  </span>
                </Link>
              ))}
              {progressList.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Belum ada progress</div>
              )}
            </div>
          </div>

          {/* Activity log */}
          <div className="bg-background rounded-xl border">
            <div className="p-5 border-b font-display font-semibold">Riwayat Aktivitas</div>
            <div className="divide-y">
              {activityLogs.map(log => (
                <div key={log.id} className="px-5 py-3">
                  <div className="text-sm leading-snug">{log.deskripsi}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {log.sopDocument?.judul && <span className="font-medium">{log.sopDocument.judul} · </span>}
                    {formatTanggal(log.createdAt)}
                  </div>
                </div>
              ))}
              {activityLogs.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
