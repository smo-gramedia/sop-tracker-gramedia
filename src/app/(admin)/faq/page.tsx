// src/app/(admin)/faq/page.tsx
import { prisma } from "@/lib/prisma";
import FaqClient from "@/components/admin/FaqClient";

export default async function FaqAdminPage() {
  const faqs = await prisma.faqEntry.findMany({
    orderBy: { urutan: "asc" },
  });

  return <FaqClient faqs={faqs} />;
}
