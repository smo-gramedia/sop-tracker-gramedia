// src/lib/glossary-extract.ts
import { PDFParse } from "pdf-parse";

export type ExtractedTerm = { istilah: string; definisi: string };
export type ExtractResult =
  | { ok: true; terms: ExtractedTerm[] }
  | { ok: false; reason: "no_text" | "no_definisi" };

// Baris "sampah" template Gramedia yang tersisip saat pindah halaman:
// penanda halaman, kop tabel, dan judul (huruf kapital penuh).
function isNoise(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (/^--\s*\d+\s*of\s*\d+\s*--$/i.test(t)) return true; // penanda halaman pdf-parse
  if (/^MANUAL\s+PROSEDUR/i.test(t)) return true;
  if (/^(Nomor|Versi|Halaman)\b/i.test(t)) return true;
  if (/^Tgl\.?\s*Berlaku/i.test(t)) return true;
  // baris huruf kapital penuh (IT SUPPORT, DEPARTMENT, judul dokumen) — tanpa huruf kecil
  if (/[A-Z]/.test(t) && !/[a-z]/.test(t)) return true;
  return false;
}

/**
 * Ekstrak pasangan (istilah, definisi) dari sub-bab DEFINISI sebuah PDF SOP.
 * Pola sumber: "<Istilah> adalah <penjelasan>", berhenti di heading REFERENSI.
 */
export async function extractDefinitionsFromPdf(
  bytes: Uint8Array
): Promise<ExtractResult> {
  const parser = new PDFParse({ data: bytes });
  let text = "";
  try {
    const res = await parser.getText();
    text = res.text || "";
  } finally {
    await (parser as { destroy?: () => Promise<void> }).destroy?.();
  }

  const lines = text
    .split("\n")
    .map((l) => l.replace(/\t/g, " ").replace(/\s{2,}/g, " ").trim());

  // teks kosong / hampir kosong → kemungkinan PDF hasil scan (tanpa layer teks)
  if (lines.filter(Boolean).join("").length < 30) {
    return { ok: false, reason: "no_text" };
  }

  const start = lines.findIndex((l) => /^(?:\d+\.0\.\s*)?DEFINISI\b/i.test(l));
  if (start < 0) return { ok: false, reason: "no_definisi" };

  const items: string[] = [];
  let num: string | null = null;
  let buf: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^(?:\d+\.0\.\s*)?REFERENSI\b/i.test(l)) break; // akhir section DEFINISI
    const m = l.match(/^(\d+\.\d+)\.\s*(.*)$/); // "4.1. ..."
    if (m) {
      if (num !== null) items.push(buf.join(" "));
      num = m[1];
      buf = m[2] ? [m[2]] : [];
    } else if (num !== null) {
      if (!isNoise(l)) buf.push(l); // buang kop, simpan lanjutan definisi
    }
  }
  if (num !== null) items.push(buf.join(" "));

  const terms: ExtractedTerm[] = [];
  for (const raw of items) {
    const parts = raw.split(/\s+adalah\s+/i); // pisah pada "adalah" PERTAMA
    if (parts.length < 2) continue;
    const istilah = parts[0].replace(/\s{2,}/g, " ").trim();
    const definisi = parts
      .slice(1)
      .join(" adalah ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .replace(/\.$/, "");
    if (istilah && definisi) terms.push({ istilah, definisi });
  }

  if (terms.length === 0) return { ok: false, reason: "no_definisi" };
  return { ok: true, terms };
}

/** Normalisasi untuk perbandingan "beda sedikit pun ditandai". */
export function normalizeForCompare(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/\.$/, "");
}
