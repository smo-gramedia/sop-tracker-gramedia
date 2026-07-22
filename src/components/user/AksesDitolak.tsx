// src/components/user/AksesDitolak.tsx
import Link from "next/link";
import { ShieldAlert, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Tampilan saat user membuka halaman yang tidak sesuai tipe akunnya.
 * Sengaja memberi penjelasan (bukan halaman kosong atau 404) supaya user
 * tahu harus berbuat apa dan tidak mengira aplikasi sedang bermasalah.
 */
export default function AksesDitolak({
  judul,
  pesan,
}: {
  judul: string;
  pesan: string;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="bg-background border rounded-2xl p-8 sm:p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 mx-auto mb-5 flex items-center justify-center">
          <ShieldAlert size={24} className="text-amber-600" />
        </div>
        <h1 className="font-display font-bold text-xl sm:text-2xl mb-3">
          {judul}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-7 max-w-md mx-auto">
          {pesan}
        </p>
        <Link href="/home">
          <Button className="gap-2">
            <Home size={15} /> Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
}
