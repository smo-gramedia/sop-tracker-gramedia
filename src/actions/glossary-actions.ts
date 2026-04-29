// src/actions/glossary.ts
"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createGlossaryEntry(kata: string, deskripsi: string) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  await prisma.glossaryEntry.create({
    data: { kata: kata.trim(), deskripsi: deskripsi.trim(), createdById: session.user.id },
  });
  revalidatePath("/glosarium");
}

export async function updateGlossaryEntry(id: string, kata: string, deskripsi: string) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  await prisma.glossaryEntry.update({
    where: { id },
    data: { kata: kata.trim(), deskripsi: deskripsi.trim() },
  });
  revalidatePath("/glosarium");
}

export async function deleteGlossaryEntry(id: string) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  await prisma.glossaryEntry.delete({ where: { id } });
  revalidatePath("/glosarium");
}

export async function createFaqEntry(pertanyaan: string, jawaban: string) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  const count = await prisma.faqEntry.count();
  await prisma.faqEntry.create({
    data: { pertanyaan, jawaban, urutan: count + 1, createdById: session.user.id },
  });
  revalidatePath("/faq");
}

export async function updateFaqEntry(id: string, pertanyaan: string, jawaban: string) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  await prisma.faqEntry.update({ where: { id }, data: { pertanyaan, jawaban } });
  revalidatePath("/faq");
}

export async function deleteFaqEntry(id: string) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  await prisma.faqEntry.delete({ where: { id } });
  revalidatePath("/faq");
}
