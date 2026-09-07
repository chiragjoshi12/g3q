-- CreateTable
CREATE TABLE `admin_work_batches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL,
    `assigned_by_id` INTEGER NOT NULL,
    `assignment_date` DATE NOT NULL,
    `allocated` INTEGER NOT NULL,
    `released` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_work_batches_admin_id_created_at_idx`(`admin_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `admin_question_assignments` ADD COLUMN `batch_id` INTEGER NULL;

-- Backfill one batch per reviewer calendar day for existing rows.
INSERT INTO `admin_work_batches` (`admin_id`, `assigned_by_id`, `assignment_date`, `allocated`, `released`, `created_at`)
SELECT `admin_id`, MIN(`assigned_by_id`), `assignment_date`, COUNT(*), 0, MIN(`created_at`)
FROM `admin_question_assignments`
GROUP BY `admin_id`, `assignment_date`;

UPDATE `admin_question_assignments` AS `a`
INNER JOIN `admin_work_batches` AS `b`
  ON `a`.`admin_id` = `b`.`admin_id`
 AND `a`.`assignment_date` = `b`.`assignment_date`
SET `a`.`batch_id` = `b`.`id`;

ALTER TABLE `admin_question_assignments`
    MODIFY `batch_id` INTEGER NOT NULL;

CREATE INDEX `admin_question_assignments_batch_id_idx` ON `admin_question_assignments`(`batch_id`);

-- AddForeignKey
ALTER TABLE `admin_work_batches` ADD CONSTRAINT `admin_work_batches_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `admin_work_batches` ADD CONSTRAINT `admin_work_batches_assigned_by_id_fkey` FOREIGN KEY (`assigned_by_id`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `admin_question_assignments` ADD CONSTRAINT `admin_question_assignments_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `admin_work_batches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
