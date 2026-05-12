// src/app/(admin)/post-test/page.tsx
import { prisma } from "@/lib/prisma";
import PostTestAdminClient from "@/components/admin/PostTestAdminClient";

export default async function PostTestAdminPage() {
  const [postTests, sopOptions] = await Promise.all([
    prisma.postTest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        sopDocument: { select: { kode: true, judul: true, kategori: true } },
        _count: { select: { questions: true, results: true } },
      },
    }),
    prisma.sopDocument.findMany({
      where: { status: "aktif" },
      select: { id: true, kode: true, judul: true },
      orderBy: { kode: "asc" },
    }),
  ]);

  return (
    <PostTestAdminClient postTests={postTests} sopOptions={sopOptions} />
  );
}
