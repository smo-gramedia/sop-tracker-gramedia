// src/actions/attachment.ts
'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Verifikasi bukti sosialisasi user oleh admin.
 * Jika disetujui → buka step 5 (post test) di learning_progress.
 */
export async function verifyAttachment(
  attachmentId: string,
  decision: 'disetujui' | 'ditolak',
  alasanTolak?: string,
) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  if (!['admin', 'superadmin'].includes(session.user.role)) {
    throw new Error('Forbidden')
  }

  if (decision === 'ditolak' && !alasanTolak?.trim()) {
    throw new Error('Alasan tolak wajib diisi')
  }

  const att = await prisma.sosialisasi_attachments.update({
    where: { id: attachmentId },
    data: {
      status: decision,
      alasanTolak: decision === 'ditolak' ? alasanTolak ?? null : null,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  })

  // Jika disetujui → buka step 5 (post test)
  if (decision === 'disetujui') {
    await prisma.learning_progress.upsert({
      where: {
        userId_sopDocumentId: {
          userId: att.userId,
          sopDocumentId: att.sopDocumentId,
        },
      },
      update: { stepCurrent: 5 },
      create: {
        userId: att.userId,
        sopDocumentId: att.sopDocumentId,
        stepCurrent: 5,
        status: 'dipelajari',
        startedAt: new Date(),
      },
    })
  }

  // Notifikasi ke user
  await prisma.notifications.create({
    data: {
      userId: att.userId,
      sopDocumentId: att.sopDocumentId,
      tipe: 'attachment',
      judul: decision === 'disetujui' ? 'Bukti Disetujui' : 'Bukti Ditolak',
      pesan:
        decision === 'disetujui'
          ? 'Bukti sosialisasi Anda disetujui. Silakan lanjut ke Post Test.'
          : `Bukti sosialisasi ditolak. Alasan: ${alasanTolak ?? '-'}`,
    },
  })

  // Activity log
  await prisma.activity_logs.create({
    data: {
      userId: session.user.id,
      sopDocumentId: att.sopDocumentId,
      action: `attachment_${decision}`,
      deskripsi: `${decision === 'disetujui' ? 'Setujui' : 'Tolak'} bukti sosialisasi attachment ${attachmentId}`,
    },
  })

  revalidatePath('/(admin)/attachment')
  return { success: true }
}

/** Hapus attachment (untuk cleanup admin). */
export async function deleteAttachment(attachmentId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  if (session.user.role !== 'superadmin') {
    throw new Error('Hanya superadmin yang boleh menghapus attachment')
  }

  await prisma.sosialisasi_attachments.delete({
    where: { id: attachmentId },
  })

  revalidatePath('/(admin)/attachment')
  return { success: true }
}
