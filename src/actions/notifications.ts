// src/actions/notifications.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markNotificationAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Pastikan notif milik user yang login
  const notif = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  });
  if (!notif || notif.userId !== session.user.id) {
    throw new Error("Forbidden");
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  revalidatePath("/notifikasi");
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/notifikasi");
  return { success: true };
}
