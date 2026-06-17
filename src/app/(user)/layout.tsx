// src/app/(user)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UserNavbar from "@/components/user/UserNavbar";
import UserFooter from "@/components/user/UserFooter";
import ActiveQuizBanner from "@/components/user/ActiveQuizBanner";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/sign-in");
  if (session.user.role !== "user") redirect("/dashboard");

  // Hitung notifikasi belum dibaca untuk badge di navbar
  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <UserNavbar
        userName={session.user.name}
        unreadCount={unreadCount}
      />
      {/* ─── Batch 5.2: Banner muncul global kalau ada quiz session aktif ──
         Otomatis hilang saat user sudah di /belajar/{id} yang sesuai */}
      <ActiveQuizBanner />
      <main className="flex-1">{children}</main>
      <UserFooter />
    </div>
  );
}
