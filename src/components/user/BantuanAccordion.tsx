"use client";

// src/components/user/BantuanAccordion.tsx
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Faq = {
  id: string;
  pertanyaan: string;
  jawaban: string;
};

export default function BantuanAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div
            key={faq.id}
            className="bg-background rounded-xl border overflow-hidden"
          >
            <button
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="font-semibold text-sm flex-1">
                {faq.pertanyaan}
              </span>
              <ChevronDown
                size={16}
                className={`text-muted-foreground transition-transform flex-shrink-0 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t bg-muted/20">
                {faq.jawaban}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
