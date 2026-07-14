// src/actions/glossary-import.ts
"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { BUCKETS, downloadFileBytes } from "@/lib/storage";
import {
  extractDefinitionsFromPdf,
  normalizeForCompare,
  type ExtractedTerm,
} from "@/lib/glossary-extract";

export type BedaTerm = ExtractedTerm & {
  existingId: string;
  existingDeskripsi: string;
};

export type ExtractGlossaryResult =
  | {
      status: "ok";
      baru: ExtractedTerm[];
      sama: ExtractedTerm[];
      beda: BedaTerm[];
    }
  | { status: "no_pdf" | "no_text" | "no_definisi" };

/**
 * Ekstrak istilah dari sub-bab DEFINISI pada PDF utama sebuah SOP, lalu
 * bandingkan dengan glosarium: baru / sama / beda (definisi berbeda).
 */
export async function extractGlossaryFromSop(
  sopId: string
): Promise<ExtractGlossaryResult> {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  // 1) cari PDF utama
  const utama = await prisma.sopAttachment.findFirst({
    where: { sopDocumentId: sopId, tipe: "utama" },
    select: { filename: true, mimeType: true },
    orderBy: { uploadedAt: "desc" },
  });
  const isPdf =
    !!utama &&
    (utama.mimeType === "application/pdf" ||
      utama.filename.toLowerCase().endsWith(".pdf"));
  if (!isPdf) return { status: "no_pdf" };

  // 2) unduh & ekstrak
  const bytes = await downloadFileBytes({
    bucket: BUCKETS.ATTACHMENTS,
    path: utama!.filename,
  });
  const res = await extractDefinitionsFromPdf(bytes);
  if (!res.ok) return { status: res.reason };

  // 3) bandingkan dengan glosarium (cocok berdasarkan kata, case-insensitive)
  const existing = await prisma.glossaryEntry.findMany({
    select: { id: true, kata: true, deskripsi: true },
  });
  const byKata = new Map(
    existing.map((e) => [e.kata.trim().toLowerCase(), e])
  );

  const baru: ExtractedTerm[] = [];
  const sama: ExtractedTerm[] = [];
  const beda: BedaTerm[] = [];
  const seen = new Set<string>();

  for (const t of res.terms) {
    const key = t.istilah.trim().toLowerCase();
    if (seen.has(key)) continue; // hindari duplikat dalam satu dokumen
    seen.add(key);

    const match = byKata.get(key);
    if (!match) {
      baru.push(t);
    } else if (
      normalizeForCompare(match.deskripsi) === normalizeForCompare(t.definisi)
    ) {
      sama.push(t);
    } else {
      beda.push({
        ...t,
        existingId: match.id,
        existingDeskripsi: match.deskripsi,
      });
    }
  }

  return { status: "ok", baru, sama, beda };
}

/**
 * Simpan istilah terpilih ke glosarium.
 * - tanpa updateId → buat baru (upsert agar aman bila kata sudah ada)
 * - dengan updateId → perbarui definisi istilah yang sudah ada
 */
export async function saveExtractedGlossary(
  entries: { istilah: string; definisi: string; updateId?: string }[]
): Promise<{ created: number; updated: number }> {
  const session = await auth();
  if (!session || session.user.role === "user") throw new Error("Unauthorized");

  let created = 0;
  let updated = 0;
  for (const e of entries) {
    const kata = e.istilah.trim();
    const deskripsi = e.definisi.trim();
    if (!kata || !deskripsi) continue;
    if (e.updateId) {
      await prisma.glossaryEntry.update({
        where: { id: e.updateId },
        data: { kata, deskripsi },
      });
      updated++;
    } else {
      await prisma.glossaryEntry.upsert({
        where: { kata },
        update: { deskripsi },
        create: { kata, deskripsi, createdById: session.user.id },
      });
      created++;
    }
  }
  revalidatePath("/glosarium");
  return { created, updated };
}
