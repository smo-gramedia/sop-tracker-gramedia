// src/app/(user)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UserNavbar from "@/components/user/UserNavbar";
import UserFooter from "@/components/user/UserFooter";
import ActiveQuizBanner from "@/components/user/ActiveQuizBanner";
import { allowedKategori } from "@/lib/access";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/sign-in");
  if (session.user.role !== "user") redirect("/dashboard");

  // Ambil tipe akun untuk menentukan kategori SOP yang boleh dibuka.
  const [unreadCount, me] = await Promise.all([
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tipeUser: true },
    }),
  ]);

  const kategoriBoleh = allowedKategori({
    role: session.user.role,
    tipeUser: me?.tipeUser ?? null,
  });

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <UserNavbar
        userName={session.user.name}
        unreadCount={unreadCount}
        allowedKategori={kategoriBoleh}
      />
      {/* ─── Batch 5.2: Banner muncul global kalau ada quiz session aktif ──
         Otomatis hilang saat user sudah di /belajar/{id} yang sesuai */}
      <ActiveQuizBanner />
      <main className="flex-1">{children}</main>
      <UserFooter />
    </div>
  );
}
