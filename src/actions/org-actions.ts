// src/actions/org.ts
"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── Directorate ─────────────────────────────────────────────────────────

export async function createDirectorate(data: { kode: string; singkatan?: string; nama: string; companyGroup?: string; deskripsi?: string }) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");
  await prisma.directorate.create({ data });
  revalidatePath("/struktur-organisasi/directorate");
}

export async function updateDirectorate(id: string, data: Partial<{ kode: string; singkatan: string; nama: string; companyGroup: string; deskripsi: string }>) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");
  await prisma.directorate.update({ where: { id }, data });
  revalidatePath("/struktur-organisasi/directorate");
}

export async function deleteDirectorate(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");
  await prisma.directorate.delete({ where: { id } });
  revalidatePath("/struktur-organisasi/directorate");
}

// ─── Division ────────────────────────────────────────────────────────────

export async function createDivision(data: { kode: string; nama: string; deskripsi?: string; directorateId: string }) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");
  await prisma.division.create({ data });
  revalidatePath("/struktur-organisasi/division");
}

export async function updateDivision(id: string, data: Partial<{ kode: string; nama: string; deskripsi: string; directorateId: string }>) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");
  await prisma.division.update({ where: { id }, data });
  revalidatePath("/struktur-organisasi/division");
}

export async function deleteDivision(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");
  await prisma.division.delete({ where: { id } });
  revalidatePath("/struktur-organisasi/division");
}

// ─── Department ──────────────────────────────────────────────────────────

export async function createDepartment(data: { kode: string; nama: string; deskripsi?: string; divisionId: string }) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");
  await prisma.department.create({ data });
  revalidatePath("/struktur-organisasi/department");
}

export async function updateDepartment(id: string, data: Partial<{ kode: string; nama: string; deskripsi: string; divisionId: string }>) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");
  await prisma.department.update({ where: { id }, data });
  revalidatePath("/struktur-organisasi/department");
}

export async function deleteDepartment(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");
  await prisma.department.delete({ where: { id } });
  revalidatePath("/struktur-organisasi/department");
}

// ─── SOP Subcategory ─────────────────────────────────────────────────────

export async function createSopSubcategory(data: { kode: string; nama: string; deskripsi?: string }) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");
  await prisma.sopSubcategory.create({ data });
  revalidatePath("/kategori");
}

export async function updateSopSubcategory(id: string, data: Partial<{ kode: string; nama: string; deskripsi: string }>) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");
  await prisma.sopSubcategory.update({ where: { id }, data });
  revalidatePath("/kategori");
}

export async function deleteSopSubcategory(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") throw new Error("Unauthorized");
  await prisma.sopSubcategory.delete({ where: { id } });
  revalidatePath("/kategori");
}
