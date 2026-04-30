// src/actions/user-profile.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const ProfileSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  unit: z.string().max(100).optional().nullable(),
  jabatan: z.string().max(100).optional().nullable(),
  section: z.string().max(100).optional().nullable(),
});

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
    confirmPassword: z.string().min(6),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export async function updateMyProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData);
  // Bersihkan empty string → undefined biar tidak overwrite jadi string kosong yang aneh
  const cleaned = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, v === "" ? null : v])
  );
  const parsed = ProfileSchema.parse(cleaned);

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed,
  });

  revalidatePath("/profil");
  revalidatePath("/profil/settings");
  return { success: true };
}

export async function changeMyPassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData);
  const parsed = PasswordSchema.parse(raw);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) throw new Error("User tidak ditemukan");

  const valid = await bcrypt.compare(parsed.currentPassword, user.passwordHash);
  if (!valid) throw new Error("Password lama salah");

  // Cegah set password baru sama dengan yang lama
  const same = await bcrypt.compare(parsed.newPassword, user.passwordHash);
  if (same) throw new Error("Password baru harus berbeda dari yang lama");

  const newHash = await bcrypt.hash(parsed.newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return { success: true };
}
