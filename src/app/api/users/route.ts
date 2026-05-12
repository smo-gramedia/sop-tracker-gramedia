// src/app/api/users/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ─── Validation Schemas ───────────────────────────────────────────────
// Untuk user "store": butuh kodeStore (5 digit) + nama, kode di-generate auto
// Untuk user "department": butuh singkatan dept (2-5 huruf) + nama, kode di-generate auto
// Untuk user "admin/superadmin": butuh kodeUser manual (mis: ADMIN-001)

const CreateUserSchema = z
  .object({
    tipeUser: z.enum(["store", "department", "admin"]),
    nama: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    unit: z.string().optional(),
    joinedAt: z.string().optional(),

    // Conditional fields
    role: z.enum(["user", "admin", "superadmin"]).default("user"),
    kodeStore: z.string().optional(), // 5 digit untuk tipe store
    singkatanDept: z.string().optional(), // 2-5 huruf untuk tipe department
    kodeUserManual: z.string().optional(), // untuk admin manual
  })
  .refine(
    (data) => {
      if (data.tipeUser === "store") {
        return /^\d{5}$/.test(data.kodeStore ?? "");
      }
      if (data.tipeUser === "department") {
        return /^[A-Z]{2,5}$/.test(data.singkatanDept ?? "");
      }
      if (data.tipeUser === "admin") {
        return (data.kodeUserManual ?? "").length > 0;
      }
      return true;
    },
    {
      message:
        "Kode harus sesuai format: Store 5 digit angka, Department 2-5 huruf uppercase",
    }
  );

// ─── Helper: Auto-generate kodeUser ───────────────────────────────────
async function generateKodeUser(
  tipeUser: "store" | "department",
  subCode: string
): Promise<string> {
  const prefix = tipeUser === "store" ? "STR" : "DEPT";
  const partialPrefix = `${prefix}-${subCode}-`;

  // Cari semua kode existing dengan prefix sama
  const existing = await prisma.user.findMany({
    where: {
      kodeUser: { startsWith: partialPrefix },
    },
    select: { kodeUser: true },
  });

  // Extract counter dari kode existing, cari max
  let maxCounter = 0;
  for (const u of existing) {
    const parts = u.kodeUser.split("-");
    const counter = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(counter) && counter > maxCounter) {
      maxCounter = counter;
    }
  }

  const nextCounter = maxCounter + 1;
  return `${partialPrefix}${nextCounter.toString().padStart(3, "0")}`;
}

// ═════════════════════════════════════════════════════════════════════
// GET — List users
// ═════════════════════════════════════════════════════════════════════
export async function GET() {
  const session = await auth();
  if (!session || session.user.role === "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await prisma.user.findMany({
    where: { role: "user" },
    select: {
      id: true,
      kodeUser: true,
      tipeUser: true,
      nama: true,
      email: true,
      unit: true,
      status: true,
      joinedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

// ═════════════════════════════════════════════════════════════════════
// POST — Create user dengan auto-generate kode
// ═════════════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // ─── Generate kodeUser ───────────────────────────────────────────
  let kodeUser: string;
  let tipeUserField: "store" | "department" | null = null;
  let roleField: "user" | "admin" | "superadmin" = "user";

  if (data.tipeUser === "store") {
    kodeUser = await generateKodeUser("store", data.kodeStore!);
    tipeUserField = "store";
    roleField = "user";
  } else if (data.tipeUser === "department") {
    kodeUser = await generateKodeUser("department", data.singkatanDept!);
    tipeUserField = "department";
    roleField = "user";
  } else {
    // Admin manual
    kodeUser = data.kodeUserManual!;
    tipeUserField = null;
    roleField = data.role; // bisa "admin" atau "superadmin"
  }

  // ─── Check duplicate ─────────────────────────────────────────────
  const existingEmail = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingEmail) {
    return NextResponse.json(
      { error: `Email ${data.email} sudah terdaftar.` },
      { status: 409 }
    );
  }

  const existingKode = await prisma.user.findUnique({
    where: { kodeUser },
  });
  if (existingKode) {
    return NextResponse.json(
      { error: `Kode user ${kodeUser} sudah terdaftar.` },
      { status: 409 }
    );
  }

  // ─── Create user ─────────────────────────────────────────────────
  const hash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      kodeUser,
      tipeUser: tipeUserField,
      nama: data.nama,
      email: data.email,
      passwordHash: hash,
      role: roleField,
      unit: data.unit ?? null,
      joinedAt: data.joinedAt ? new Date(data.joinedAt) : null,
      status: "aktif",
    },
  });

  return NextResponse.json(
    { id: user.id, kodeUser: user.kodeUser },
    { status: 201 }
  );
}

// ═════════════════════════════════════════════════════════════════════
// PATCH — Toggle status aktif/nonaktif
// ═════════════════════════════════════════════════════════════════════
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, status } = await req.json();
  await prisma.user.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json({ success: true });
}
