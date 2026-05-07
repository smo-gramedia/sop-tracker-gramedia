// src/app/(user)/belajar/[id]/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BelajarClient from "@/components/user/BelajarClient";

type Props = { params: { id: string } };

export default async function BelajarPage({ params }: Props) {
  const session = await auth();

  const [doc, progress, postTest, latestAttachment, note] = await Promise.all([
    prisma.sopDocument.findUnique({
      where: { id: params.id },
      include: {
        department: { select: { nama: true } },
        subcategory: { select: { nama: true } },
        rawDocuments: { orderBy: { uploadedAt: "desc" }, take: 1 },
        // Fetch ALL sopAttachments (akan di-split per tipe di client)
        sopAttachments: {
          orderBy: { uploadedAt: "asc" },
          select: {
            id: true,
            filename: true,
            mimeType: true,
            ukuranKb: true,
            tipe: true,
            uploadedAt: true,
          },
        },
      },
    }),
    prisma.learningProgress.findUnique({
      where: {
        userId_sopDocumentId: {
          userId: session!.user.id,
          sopDocumentId: params.id,
        },
      },
    }),
    prisma.postTest.findUnique({
      where: { sopDocumentId: params.id },
      include: { questions: { orderBy: { id: "asc" } } },
    }),
    prisma.sosialisasiAttachment.findFirst({
      where: { userId: session!.user.id, sopDocumentId: params.id },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.learningNote.findUnique({
      where: {
        userId_sopDocumentId: {
          userId: session!.user.id,
          sopDocumentId: params.id,
        },
      },
    }),
  ]);

  if (!doc) notFound();

  // Get post test results
  const myResults = postTest
    ? await prisma.postTestResult.findMany({
        where: { userId: session!.user.id, postTestId: postTest.id },
        orderBy: { attemptNumber: "asc" },
      })
    : [];

  return (
    <BelajarClient
      doc={doc}
      progress={progress}
      postTest={postTest}
      latestAttachment={latestAttachment}
      myResults={myResults}
      userId={session!.user.id}
      initialNote={note?.konten ?? ""}
    />
  );
}
