// src/app/(admin)/faq/page.tsx
import { prisma } from "@/lib/prisma";
import FaqAdminClient from "@/components/admin/FaqAdminClient";

export default async function FaqAdminPage() {
  const faqs = await prisma.faqEntry.findMany({
    orderBy: { urutan: "asc" },
    select: {
      id: true,
      pertanyaan: true,
      jawaban: true,
      urutan: true,
      updatedAt: true,
    },
  });

  return (
    <FaqAdminClient
      faqs={faqs.map((f) => ({
        ...f,
        updatedAt: f.updatedAt.toISOString(),
      }))}
    />
  );
}
