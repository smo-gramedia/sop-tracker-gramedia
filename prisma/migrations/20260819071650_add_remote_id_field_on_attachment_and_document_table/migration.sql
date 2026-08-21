/*
  Warnings:

  - Added the required column `remote_id` to the `raw_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remote_id` to the `sop_attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remote_id` to the `sosialisasi_attachments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `raw_documents` ADD COLUMN `remote_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `sop_attachments` ADD COLUMN `remote_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `sosialisasi_attachments` ADD COLUMN `remote_id` VARCHAR(191) NOT NULL;
