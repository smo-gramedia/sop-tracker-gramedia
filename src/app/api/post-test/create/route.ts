// src/app/api/post-test/create/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  sopDocumentId: z.string(),
  passingGrade:  z.number().min(1).max(100).default(70),
  durasiMenit:   z.number().min(1).default(10),
  questions: z.array(z.object({
    pertanyaan:   z.string().min(1),
    opsiA:        z.string().min(1),
    opsiB:        z.string().min(1),
    opsiC:        z.string().min(1),
    opsiD:        z.string().min(1),
    jawabanBenar: z.enum(["a","b","c","d"]),
  })).length(10),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role === "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  // Check not already exists
  const existing = await prisma.postTest.findUnique({
    where: { sopDocumentId: parsed.data.sopDocumentId },
  });
  if (existing) {
    return NextResponse.json({ error: "Post Test untuk SOP ini sudah ada." }, { status: 409 });
  }
  const postTest = await prisma.postTest.create({
    data: {
      sopDocumentId: parsed.data.sopDocumentId,
      passingGrade:  parsed.data.passingGrade,
      durasiMenit:   parsed.data.durasiMenit,
      jumlahSoal:    10,
      createdById:   session.user.id,
      questions: {
        create: parsed.data.questions.map(q => ({
          pertanyaan:   q.pertanyaan,
          opsiA:        q.opsiA,
          opsiB:        q.opsiB,
          opsiC:        q.opsiC,
          opsiD:        q.opsiD,
          jawabanBenar: q.jawabanBenar,
        })),
      },
    },
  });
  return NextResponse.json({ id: postTest.id }, { status: 201 });
}
