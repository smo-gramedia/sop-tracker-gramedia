// src/app/api/users/[id]/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ─── Validation: Update user (nama, email, unit, status, optional password) ──
const UpdateUserSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").optional(),
  email: z.string().email("Format email tidak valid").optional(),
  unit: z.string().nullable().optional(),
  status: z.enum(["aktif", "nonaktif"]).optional(),
  // Memindahkan tipe akun (mis. "department" lama → "supporting"/"publishing").
  // Hanya untuk akun non-admin; admin tetap dibedakan lewat role.
  tipeUser: z
    .enum(["store", "supporting", "publishing", "audit"])
    .nullable()
    .optional(),
  joinedAt: z.string().nullable().optional(),
  // Password baru opsional — kalau kosong/null/undefined, tidak diubah
  newPassword: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .optional()
    .or(z.literal("")),
});

// ═════════════════════════════════════════════════════════════════════
// GET — Detail user untuk Modal "Lihat Detail"
// ═════════════════════════════════════════════════════════════════════
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      kodeUser: true,
      tipeUser: true,
      nama: true,
      email: true,
      unit: true,
      status: true,
      role: true,
      joinedAt: true,
      createdAt: true,
      _count: {
        select: {
          learningProgress: true,
          sosialisasiAttachments: true,
          postTestResults: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// ═════════════════════════════════════════════════════════════════════
// PUT — Update user (Edit modal)
// ═════════════════════════════════════════════════════════════════════
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json(
      { error: "Hanya superadmin yang boleh edit user" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Pastikan user ada
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  // Cek duplicate email kalau email diubah
  if (data.email && data.email !== existing.email) {
    const duplicate = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: `Email ${data.email} sudah dipakai user lain` },
        { status: 409 }
      );
    }
  }

  // Build update payload
  const updateData: Record<string, unknown> = {};
  if (data.nama !== undefined) updateData.nama = data.nama;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.joinedAt !== undefined) {
    updateData.joinedAt = data.joinedAt ? new Date(data.joinedAt) : null;
  }
  // Reset password kalau ada newPassword (non-empty)
  if (data.newPassword && data.newPassword.length >= 8) {
    updateData.passwordHash = await bcrypt.hash(data.newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      kodeUser: true,
      nama: true,
      email: true,
      unit: true,
      status: true,
    },
  });

  return NextResponse.json(updated);
}

// ═════════════════════════════════════════════════════════════════════
// DELETE — Hapus user (soft-disable disarankan via PATCH status, tapi DELETE tersedia)
// ═════════════════════════════════════════════════════════════════════
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json(
      { error: "Hanya superadmin yang boleh hapus user" },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Jangan biarkan superadmin hapus diri sendiri
  if (session.user.id === id) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus akun Anda sendiri" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Foreign key constraint (user punya learning progress, dll)
    if (err?.code === "P2003" || err?.code === "P2014") {
      return NextResponse.json(
        {
          error:
            "User tidak bisa dihapus karena masih ada data terkait (progress belajar, post test, dll). Gunakan tombol Nonaktifkan.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menghapus user" },
      { status: 500 }
    );
  }
}
