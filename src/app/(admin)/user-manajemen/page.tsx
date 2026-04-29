// src/app/(admin)/user-manajemen/page.tsx  (replace existing)
import { prisma } from "@/lib/prisma";
import UserManajemenClient from "@/components/admin/UserManajemenClient";

export default async function UserManajemenPage() {
  const users = await prisma.user.findMany({
    where: { role: "user" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { learningProgress: true } } },
  });
  return <UserManajemenClient users={users}/>;
}
