// src/app/(admin)/user-manajemen/page.tsx
import { prisma } from "@/lib/prisma";
import UserManajemenClient from "@/components/admin/UserManajemenClient";

export default async function UserManajemenPage() {
  const users = await prisma.user.findMany({
    where: { role: "user" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      kodeUser: true,
      tipeUser: true,
      nama: true,
      email: true,
      unit: true,
      status: true,
      joinedAt: true,
      createdAt: true,
      _count: { select: { learningProgress: true } },
    },
  });

  return <UserManajemenClient users={users as any} />;
}
