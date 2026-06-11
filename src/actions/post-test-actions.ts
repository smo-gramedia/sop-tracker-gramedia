// src/actions/post-test-actions.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Delete post test beserta semua child records:
 * - PostTestQuestion (cascade via schema)
 * - PostTestResult (cascade via schema)
 *
 * Hanya admin/superadmin yang boleh hapus.
 */
export async function deletePostTest(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (!["admin", "superadmin"].includes(session.user.role)) {
    throw new Error("Forbidden — hanya admin yang boleh hapus post test");
  }

  // Cek post test ada
  const postTest = await prisma.postTest.findUnique({
    where: { id },
    select: { id: true, sopDocument: { select: { judul: true } } },
  });
  if (!postTest) {
    throw new Error("Post test tidak ditemukan");
  }

  // Delete — questions & results auto-cascade via schema
  await prisma.postTest.delete({ where: { id } });

  // Refresh halaman admin
  revalidatePath("/post-test");

  return {
    success: true,
    message: `Post test "${postTest.sopDocument.judul}" berhasil dihapus`,
  };
}
