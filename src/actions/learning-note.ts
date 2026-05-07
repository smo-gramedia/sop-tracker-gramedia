"use server";

// src/actions/learning-note.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────
// SANITIZER — Allow-list HTML tags & attributes for note content
// ─────────────────────────────────────────────────────────────────
// Karena DOMPurify adalah dependency tambahan, kita pakai sanitize sederhana
// dengan whitelist. Hanya tag/atribut aman yang dipertahankan.
// Cukup untuk catatan internal (hanya user sendiri yang baca catatannya).

const ALLOWED_TAGS = new Set([
  "p", "br", "div", "span",
  "b", "strong", "i", "em", "u",
  "h3", "h4",
  "ul", "ol", "li",
  "blockquote",
  "mark",
  "hr",
]);

const ALLOWED_ATTRS = new Set(["style"]);
// Hanya izinkan inline style yang aman: background-color (untuk highlight)
const SAFE_STYLE_REGEX = /^background-color:\s*(#[a-fA-F0-9]{3,6}|rgb\([^)]+\)|yellow|#fef08a)\s*;?\s*$/i;

function sanitizeHtml(html: string): string {
  // Strip script/iframe/object/embed/style/link entirely (dengan content-nya)
  let s = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, "")
    // Strip event handlers
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    // Strip javascript: URLs
    .replace(/javascript:/gi, "")
    // Strip data: URLs (potential XSS via <img src="data:...">)
    .replace(/data:(?!image\/(png|jpeg|jpg|gif|webp))/gi, "");

  // Filter tags: hanya yang ada di ALLOWED_TAGS
  s = s.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    const tagLower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(tagLower)) {
      // Strip seluruh tag (tapi pertahankan content-nya)
      return "";
    }
    // Untuk tag yang diizinkan, filter atribut-nya
    return match.replace(/\s([a-z\-]+)=("[^"]*"|'[^']*')/gi, (m, attr, val) => {
      const attrLower = attr.toLowerCase();
      if (!ALLOWED_ATTRS.has(attrLower)) return "";
      // Khusus style: validasi isinya
      if (attrLower === "style") {
        const cleanVal = val.slice(1, -1); // strip kutip
        return SAFE_STYLE_REGEX.test(cleanVal) ? ` style=${val}` : "";
      }
      return m;
    });
  });

  return s;
}

// ─────────────────────────────────────────────────────────────────
// GET — Ambil catatan user untuk SOP tertentu
// ─────────────────────────────────────────────────────────────────
export async function getNote(sopDocumentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const note = await prisma.learningNote.findUnique({
    where: {
      userId_sopDocumentId: {
        userId: session.user.id,
        sopDocumentId,
      },
    },
  });

  return note ? { konten: note.konten, updatedAt: note.updatedAt } : null;
}

// ─────────────────────────────────────────────────────────────────
// SAVE — Upsert catatan user
// ─────────────────────────────────────────────────────────────────
export async function saveNote(sopDocumentId: string, kontenHtml: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Sanitize HTML sebelum simpan
  const cleanHtml = sanitizeHtml(kontenHtml);

  // Validasi panjang (DB column TEXT bisa sangat panjang, tapi reasonable limit 50KB)
  if (cleanHtml.length > 50_000) {
    throw new Error("Catatan terlalu panjang (maks 50.000 karakter)");
  }

  const note = await prisma.learningNote.upsert({
    where: {
      userId_sopDocumentId: {
        userId: session.user.id,
        sopDocumentId,
      },
    },
    update: { konten: cleanHtml },
    create: {
      userId: session.user.id,
      sopDocumentId,
      konten: cleanHtml,
    },
  });

  return { ok: true, updatedAt: note.updatedAt };
}
