// src/lib/pdf-watermark.ts
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

// Rotasi vektor (derajat) untuk menempatkan pita diagonal.
function rot(vx: number, vy: number, deg: number): [number, number] {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [vx * c - vy * s, vx * s + vy * c];
}

/**
 * Tempelkan watermark identitas (Opsi F) ke SETIAP halaman PDF:
 *  - pita "RAHASIA" di pojok kanan atas
 *  - baris identitas di footer (kode user + tanggal + peringatan)
 *
 * Dipakai HANYA saat download (view tetap PDF asli tanpa watermark).
 * Menerima & mengembalikan bytes PDF.
 */
export async function watermarkPdf(
  input: Uint8Array,
  opts: { kodeUser: string; tanggal: string }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(input);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);

  const navy = rgb(40 / 255, 63 / 255, 122 / 255);
  const gray = rgb(0.55, 0.55, 0.55);
  const white = rgb(1, 1, 1);

  const footText = `Diakses oleh ${opts.kodeUser}  \u2022  ${opts.tanggal}  \u2022  Dilarang menyebarluaskan`;

  for (const page of doc.getPages()) {
    const { width: w, height: h } = page.getSize();

    // ─── Pita "RAHASIA" di pojok kanan atas ───────────────────────────
    const theta = -45;
    const L = 175;
    const bandH = 22;
    const Cx = w - 40;
    const Cy = h - 40;
    const [ox, oy] = rot(-L / 2, -bandH / 2, theta);
    page.drawRectangle({
      x: Cx + ox,
      y: Cy + oy,
      width: L,
      height: bandH,
      rotate: degrees(theta),
      color: navy,
    });
    const label = "RAHASIA";
    const ts = 11;
    const tw = bold.widthOfTextAtSize(label, ts);
    const [tx, ty] = rot(-tw / 2, -ts * 0.35, theta);
    page.drawText(label, {
      x: Cx + tx,
      y: Cy + ty,
      size: ts,
      font: bold,
      color: white,
      rotate: degrees(theta),
    });

    // ─── Footer identitas ─────────────────────────────────────────────
    const fsz = 8;
    const fw = reg.widthOfTextAtSize(footText, fsz);
    page.drawText(footText, {
      x: Math.max(20, (w - fw) / 2),
      y: 18,
      size: fsz,
      font: reg,
      color: gray,
    });
  }

  return doc.save();
}
