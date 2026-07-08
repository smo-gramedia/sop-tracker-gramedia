// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Mengembalikan identitas unit kerja untuk ditampilkan pada dialog konfirmasi unduh.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kodeUser: true, nama: true },
  });
  return NextResponse.json({
    kodeUser: user?.kodeUser ?? "",
    namaToko: user?.nama ?? session.user.name ?? "",
  });
}
