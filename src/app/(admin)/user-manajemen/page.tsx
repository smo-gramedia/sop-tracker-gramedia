// src/app/(admin)/user-manajemen/page.tsx
import { prisma } from "@/lib/prisma";
import UserManajemenClient from "@/components/admin/UserManajemenClient";

export default async function UserManajemenPage() {
  // ─── Ambil SEMUA user, termasuk admin & superadmin ──────────────────
  // (Sebelumnya filter `role: "user"` → admin tidak muncul)
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      kodeUser: true,
      tipeUser: true,
      nama: true,
      email: true,
      unit: true,
      status: true,
      role: true,
      joinedAt: true,
      createdAt: true,
      _count: { select: { learningProgress: true } },
    },
  });

  return <UserManajemenClient users={users as any} />;
}
