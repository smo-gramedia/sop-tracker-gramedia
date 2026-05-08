// src/app/(user)/bantuan/page.tsx
import { prisma } from "@/lib/prisma";
import { HelpCircle, Mail } from "lucide-react";
import BantuanAccordion from "@/components/user/BantuanAccordion";

export default async function BantuanPage() {
  const faqs = await prisma.faqEntry.findMany({
    orderBy: { urutan: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Pusat Bantuan</p>
        <h1 className="font-display font-bold text-3xl mt-1">
          Bantuan & FAQ
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Temukan jawaban atas pertanyaan yang sering diajukan terkait
          penggunaan SOP Tracker. Kalau pertanyaan Anda belum terjawab,
          silakan hubungi admin SMO.
        </p>
      </div>

      {/* FAQ list */}
      {faqs.length === 0 ? (
        <div className="bg-background rounded-xl border p-12 text-center">
          <HelpCircle
            size={32}
            className="mx-auto text-muted-foreground/40 mb-3"
          />
          <p className="text-muted-foreground">Belum ada FAQ tersedia.</p>
        </div>
      ) : (
        <BantuanAccordion faqs={faqs} />
      )}

      {/* Contact admin card */}
      <div className="bg-background rounded-xl border p-6 mt-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Mail size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base">
              Butuh Bantuan Lebih Lanjut?
            </h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Pertanyaan Anda tidak terjawab di atas? Hubungi tim Strategic
              Management Office (SMO) untuk bantuan langsung.
            </p>
            <p className="text-sm mt-3">
              Email:{" "}
              <a
                href="mailto:smo@gramedia.co.id"
                className="text-primary hover:underline font-medium"
              >
                smo@gramedia.co.id
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
