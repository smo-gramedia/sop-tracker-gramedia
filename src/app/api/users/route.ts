// src/app/api/users/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  kodeKaryawan: z.string().min(1),
  nama:         z.string().min(1),
  email:        z.string().email(),
  password:     z.string().min(8),
  role:         z.enum(["user","admin","superadmin"]).default("user"),
  unit:         z.string().optional(),
  jabatan:      z.string().optional(),
  section:      z.string().optional(),
  joinedAt:     z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role === "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await prisma.user.findMany({
    where: { role: "user" },
    select: { id:true, kodeKaryawan:true, nama:true, email:true, unit:true, jabatan:true, status:true, joinedAt:true, createdAt:true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body   = await req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  // Check duplicate email/kode
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: parsed.data.email }, { kodeKaryawan: parsed.data.kodeKaryawan }] },
  });
  if (existing) {
    return NextResponse.json({ error: "Email atau kode karyawan sudah terdaftar." }, { status: 409 });
  }
  const hash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      kodeKaryawan: parsed.data.kodeKaryawan,
      nama:         parsed.data.nama,
      email:        parsed.data.email,
      passwordHash: hash,
      role:         parsed.data.role,
      unit:         parsed.data.unit,
      jabatan:      parsed.data.jabatan,
      section:      parsed.data.section,
      joinedAt:     parsed.data.joinedAt ? new Date(parsed.data.joinedAt) : null,
      status:       "aktif",
    },
  });
  return NextResponse.json({ id: user.id }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, status } = await req.json();
  await prisma.user.update({
    where: { id },
    data:  { status },
  });
  return NextResponse.json({ success: true });
}
