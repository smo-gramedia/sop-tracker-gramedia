// src/actions/notification-actions.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markNotifAsRead(notifId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.notification.update({
    where: { id: notifId, userId: session.user.id },
    data: { isRead: true },
  });
  revalidatePath("/notifikasi");
}

export async function markAllNotifsAsRead() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/notifikasi");
}
