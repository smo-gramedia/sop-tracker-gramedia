// src/actions/post-test.ts
"use server";

/**
 * @deprecated File ini tidak dipakai sejak Batch 3 (Post Test NIK).
 *
 * Submit post test sekarang lewat API route langsung dari client:
 *   POST /api/post-test
 *
 * Yang mengirim: src/components/user/PostTestFlow.tsx → handleSubmit()
 * Routenya:      src/app/api/post-test/route.ts
 *
 * Function di file ini sengaja di-kosongkan supaya:
 *   - Tidak break TS build (sebelumnya butuh field nikKaryawan + namaKaryawan)
 *   - Tetap exportable kalau ada code yang import (sebagai safety net)
 *
 * KALAU AMAN, file ini boleh dihapus dari repo:
 *   rm src/actions/post-test.ts
 */

/**
 * @deprecated Pakai POST /api/post-test (lihat src/app/api/post-test/route.ts)
 */
export async function submitPostTest(
  _postTestId: string,
  _answers: Record<string, string>,
  _durasiDetik: number
) {
  throw new Error(
    "submitPostTest() sudah deprecated. Pakai POST /api/post-test dengan NIK dan Nama karyawan."
  );
}
