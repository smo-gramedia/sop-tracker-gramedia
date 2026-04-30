// src/actions/faq.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const FaqSchema = z.object({
  pertanyaan: z.string().min(1, "Pertanyaan wajib diisi"),
  jawaban: z.string().min(1, "Jawaban wajib diisi"),
  urutan: z.coerce.number().int().min(0).default(0),
});

export async function createFaq(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData);
  const parsed = FaqSchema.parse(raw);

  await prisma.faqEntry.create({
    data: {
      ...parsed,
      createdById: session.user.id,
    },
  });

  revalidatePath("/faq");
  revalidatePath("/bantuan");
  return { success: true };
}

export async function updateFaq(id: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  const raw = Object.fromEntries(formData);
  const parsed = FaqSchema.partial().parse(raw);

  await prisma.faqEntry.update({
    where: { id },
    data: parsed,
  });

  revalidatePath("/faq");
  revalidatePath("/bantuan");
  return { success: true };
}

export async function deleteFaq(id: string) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  await prisma.faqEntry.delete({ where: { id } });
  revalidatePath("/faq");
  revalidatePath("/bantuan");
  return { success: true };
}

/** Reorder FAQ — admin drag & drop */
export async function reorderFaqs(orderedIds: string[]) {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.faqEntry.update({
        where: { id },
        data: { urutan: idx },
      })
    )
  );

  revalidatePath("/faq");
  revalidatePath("/bantuan");
  return { success: true };
}
