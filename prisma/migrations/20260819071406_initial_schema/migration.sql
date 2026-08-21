-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `kode_user` VARCHAR(191) NOT NULL,
    `tipe_user` ENUM('store', 'department', 'supporting', 'publishing', 'audit') NULL,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NULL,
    `role` ENUM('user', 'admin', 'superadmin') NOT NULL DEFAULT 'user',
    `status` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
    `joined_at` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_kode_user_key`(`kode_user`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_status_idx`(`role`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `directorates` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `singkatan` VARCHAR(191) NULL,
    `nama` VARCHAR(191) NOT NULL,
    `company_group` VARCHAR(191) NULL,
    `deskripsi` VARCHAR(191) NULL,

    UNIQUE INDEX `directorates_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `divisions` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NULL,
    `directorate_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `divisions_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NULL,
    `division_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `departments_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sop_subcategories` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NULL,

    UNIQUE INDEX `sop_subcategories_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sop_documents` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NULL,
    `kategori` ENUM('sr', 'ss', 'sp', 'sg', 'petunjuk') NOT NULL,
    `tipe` ENUM('MP', 'PS', 'IK', 'petunjuk') NOT NULL,
    `permitted_access` VARCHAR(191) NULL,
    `juklak_kategori` ENUM('store', 'business_unit_non_store', 'supporting_unit') NULL,
    `subcategory_id` VARCHAR(191) NULL,
    `department_id` VARCHAR(191) NULL,
    `versi` VARCHAR(191) NOT NULL DEFAULT 'Original',
    `tanggal_berlaku` DATE NULL,
    `status` ENUM('aktif', 'draft', 'obsolete') NOT NULL DEFAULT 'draft',
    `uploaded_by` VARCHAR(191) NOT NULL,
    `updated_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `sop_documents_kode_idx`(`kode`),
    INDEX `sop_documents_status_idx`(`status`),
    INDEX `sop_documents_department_id_idx`(`department_id`),
    INDEX `sop_documents_kategori_idx`(`kategori`),
    UNIQUE INDEX `sop_documents_kode_versi_key`(`kode`, `versi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `raw_documents` (
    `id` VARCHAR(191) NOT NULL,
    `sop_document_id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `ukuran_kb` INTEGER NOT NULL,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `raw_documents_sop_document_id_idx`(`sop_document_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sop_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `sop_document_id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `ukuran_kb` INTEGER NOT NULL,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipe` VARCHAR(191) NOT NULL DEFAULT 'lampiran',

    INDEX `sop_attachments_sop_document_id_idx`(`sop_document_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `glossary` (
    `id` VARCHAR(191) NOT NULL,
    `kata` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NOT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `glossary_kata_key`(`kata`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faqs` (
    `id` VARCHAR(191) NOT NULL,
    `pertanyaan` VARCHAR(191) NOT NULL,
    `jawaban` VARCHAR(191) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `created_by` VARCHAR(191) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stores` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `wilayah` VARCHAR(191) NULL,
    `kota` VARCHAR(191) NULL,
    `departemen` VARCHAR(191) NULL,
    `status` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',

    UNIQUE INDEX `stores_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `store_rankings` (
    `id` VARCHAR(191) NOT NULL,
    `store_id` VARCHAR(191) NOT NULL,
    `periode` VARCHAR(191) NOT NULL,
    `sop_selesai` INTEGER NOT NULL,
    `total_sop` INTEGER NOT NULL,
    `persen_kepatuhan` DECIMAL(5, 2) NOT NULL,
    `trend_direction` ENUM('naik', 'turun', 'tetap') NOT NULL DEFAULT 'tetap',
    `trend_delta` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `label` ENUM('sangat_baik', 'baik', 'cukup', 'perlu_perhatian') NOT NULL DEFAULT 'cukup',
    `calculated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `store_rankings_store_id_periode_key`(`store_id`, `periode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_progress` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `sop_document_id` VARCHAR(191) NOT NULL,
    `step_current` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('belum', 'dipelajari', 'selesai') NOT NULL DEFAULT 'belum',
    `last_accessed_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,

    INDEX `learning_progress_sop_document_id_idx`(`sop_document_id`),
    UNIQUE INDEX `learning_progress_user_id_sop_document_id_key`(`user_id`, `sop_document_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_notes` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `sop_document_id` VARCHAR(191) NOT NULL,
    `konten` VARCHAR(191) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `learning_notes_user_id_sop_document_id_key`(`user_id`, `sop_document_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `sop_document_id` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_sop_document_id_idx`(`sop_document_id`),
    INDEX `activity_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sosialisasi_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `sop_document_id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `ukuran_kb` INTEGER NOT NULL,
    `upload_ke` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('menunggu', 'disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'menunggu',
    `alasan_tolak` VARCHAR(191) NULL,
    `reviewed_by` VARCHAR(191) NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewed_at` DATETIME(3) NULL,

    INDEX `sosialisasi_attachments_sop_document_id_idx`(`sop_document_id`),
    INDEX `sosialisasi_attachments_status_idx`(`status`),
    INDEX `sosialisasi_attachments_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_tests` (
    `id` VARCHAR(191) NOT NULL,
    `sop_document_id` VARCHAR(191) NOT NULL,
    `passing_grade` INTEGER NOT NULL DEFAULT 70,
    `durasi_menit` INTEGER NOT NULL DEFAULT 10,
    `jumlah_soal` INTEGER NOT NULL DEFAULT 10,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `post_tests_sop_document_id_key`(`sop_document_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_test_questions` (
    `id` VARCHAR(191) NOT NULL,
    `post_test_id` VARCHAR(191) NOT NULL,
    `pertanyaan` VARCHAR(191) NOT NULL,
    `opsi_a` VARCHAR(191) NOT NULL,
    `opsi_b` VARCHAR(191) NOT NULL,
    `opsi_c` VARCHAR(191) NOT NULL,
    `opsi_d` VARCHAR(191) NOT NULL,
    `jawaban_benar` VARCHAR(191) NOT NULL,

    INDEX `post_test_questions_post_test_id_idx`(`post_test_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_test_results` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `post_test_id` VARCHAR(191) NOT NULL,
    `attempt_number` INTEGER NOT NULL DEFAULT 1,
    `nik_karyawan` VARCHAR(191) NOT NULL,
    `nama_karyawan` VARCHAR(191) NOT NULL,
    `skor` INTEGER NOT NULL,
    `jumlah_benar` INTEGER NOT NULL,
    `jumlah_salah` INTEGER NOT NULL,
    `status` ENUM('lulus', 'tidak_lulus') NOT NULL,
    `jawaban` JSON NOT NULL,
    `dikerjakan_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `selesai_at` DATETIME(3) NULL,

    INDEX `post_test_results_user_id_post_test_id_idx`(`user_id`, `post_test_id`),
    INDEX `post_test_results_nik_karyawan_idx`(`nik_karyawan`),
    UNIQUE INDEX `post_test_results_post_test_id_nik_karyawan_key`(`post_test_id`, `nik_karyawan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `sop_document_id` VARCHAR(191) NULL,
    `tipe` ENUM('attachment', 'post_test', 'info') NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `pesan` VARCHAR(191) NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_is_read_idx`(`user_id`, `is_read`),
    INDEX `notifications_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `divisions` ADD CONSTRAINT `divisions_directorate_id_fkey` FOREIGN KEY (`directorate_id`) REFERENCES `directorates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_division_id_fkey` FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sop_documents` ADD CONSTRAINT `sop_documents_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sop_documents` ADD CONSTRAINT `sop_documents_subcategory_id_fkey` FOREIGN KEY (`subcategory_id`) REFERENCES `sop_subcategories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sop_documents` ADD CONSTRAINT `sop_documents_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sop_documents` ADD CONSTRAINT `sop_documents_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `raw_documents` ADD CONSTRAINT `raw_documents_sop_document_id_fkey` FOREIGN KEY (`sop_document_id`) REFERENCES `sop_documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `raw_documents` ADD CONSTRAINT `raw_documents_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sop_attachments` ADD CONSTRAINT `sop_attachments_sop_document_id_fkey` FOREIGN KEY (`sop_document_id`) REFERENCES `sop_documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sop_attachments` ADD CONSTRAINT `sop_attachments_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `glossary` ADD CONSTRAINT `glossary_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faqs` ADD CONSTRAINT `faqs_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `store_rankings` ADD CONSTRAINT `store_rankings_store_id_fkey` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_progress` ADD CONSTRAINT `learning_progress_sop_document_id_fkey` FOREIGN KEY (`sop_document_id`) REFERENCES `sop_documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_progress` ADD CONSTRAINT `learning_progress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_notes` ADD CONSTRAINT `learning_notes_sop_document_id_fkey` FOREIGN KEY (`sop_document_id`) REFERENCES `sop_documents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_notes` ADD CONSTRAINT `learning_notes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_sop_document_id_fkey` FOREIGN KEY (`sop_document_id`) REFERENCES `sop_documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sosialisasi_attachments` ADD CONSTRAINT `sosialisasi_attachments_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sosialisasi_attachments` ADD CONSTRAINT `sosialisasi_attachments_sop_document_id_fkey` FOREIGN KEY (`sop_document_id`) REFERENCES `sop_documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sosialisasi_attachments` ADD CONSTRAINT `sosialisasi_attachments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_tests` ADD CONSTRAINT `post_tests_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_tests` ADD CONSTRAINT `post_tests_sop_document_id_fkey` FOREIGN KEY (`sop_document_id`) REFERENCES `sop_documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_test_questions` ADD CONSTRAINT `post_test_questions_post_test_id_fkey` FOREIGN KEY (`post_test_id`) REFERENCES `post_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_test_results` ADD CONSTRAINT `post_test_results_post_test_id_fkey` FOREIGN KEY (`post_test_id`) REFERENCES `post_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_test_results` ADD CONSTRAINT `post_test_results_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_sop_document_id_fkey` FOREIGN KEY (`sop_document_id`) REFERENCES `sop_documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
