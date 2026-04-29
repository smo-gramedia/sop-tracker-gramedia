// src/app/(user)/belajar/[id]/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LEARNING_STEPS } from "@/lib/constants";
import BelajarClient from "@/components/user/BelajarClient";

type Props = { params: { id: string } };

export default async function BelajarPage({ params }: Props) {
  const session = await auth();

  const [doc, progress, postTest] = await Promise.all([
    prisma.sopDocument.findUnique({
      where: { id: params.id },
      include: {
        department:    { select: { nama: true } },
        subcategory:   { select: { nama: true } },
        rawDocuments:  { orderBy: { uploadedAt: "desc" }, take: 1 },
        sopAttachments:{ orderBy: { uploadedAt: "desc" }, take: 5 },
      },
    }),
    prisma.learningProgress.findUnique({
      where: { userId_sopDocumentId: { userId: session!.user.id, sopDocumentId: params.id } },
    }),
    prisma.postTest.findUnique({
      where: { sopDocumentId: params.id },
      include: { questions: { orderBy: { id: "asc" } } },
    }),
  ]);

  if (!doc) notFound();

  // Get latest sosialisasi attachment for this user+sop
  const latestAttachment = await prisma.sosialisasiAttachment.findFirst({
    where: { userId: session!.user.id, sopDocumentId: params.id },
    orderBy: { uploadedAt: "desc" },
  });

  // Get post test results for this user
  const myResults = await prisma.postTestResult.findMany({
    where: { userId: session!.user.id, postTestId: postTest?.id },
    orderBy: { attemptNumber: "asc" },
  });

  return (
    <BelajarClient
      doc={doc}
      progress={progress}
      postTest={postTest}
      latestAttachment={latestAttachment}
      myResults={myResults}
      userId={session!.user.id}
    />
  );
}
