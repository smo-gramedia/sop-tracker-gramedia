// src/actions/profile-actions.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateMyProfile(input: {
  nama: string;
  unit?: string;
  jabatan?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!input.nama.trim()) throw new Error("Nama wajib diisi");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      nama: input.nama.trim(),
      unit: input.unit?.trim() || null,
      jabatan: input.jabatan?.trim() || null,
    },
  });

  revalidatePath("/profil");
  revalidatePath("/profil/settings");
}

export async function changeMyPassword(input: {
  oldPassword: string;
  newPassword: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (input.newPassword.length < 8)
    throw new Error("Password baru minimal 8 karakter");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) throw new Error("User tidak ditemukan");

  const valid = await bcrypt.compare(input.oldPassword, user.passwordHash);
  if (!valid) throw new Error("Password saat ini salah");

  const newHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });
}
