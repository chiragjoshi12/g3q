-- CreateTable
CREATE TABLE `admin_work_quotas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL,
    `daily_quota` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `notes` VARCHAR(500) NULL,
    `created_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_work_quotas_admin_id_key`(`admin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_question_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL,
    `que_id` VARCHAR(32) NOT NULL,
    `assignment_date` DATE NOT NULL,
    `assigned_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_question_assignments_que_id_key`(`que_id`),
    INDEX `admin_question_assignments_admin_id_assignment_date_idx`(`admin_id`, `assignment_date`),
    INDEX `admin_question_assignments_assignment_date_idx`(`assignment_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_work_quotas` ADD CONSTRAINT `admin_work_quotas_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_work_quotas` ADD CONSTRAINT `admin_work_quotas_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_question_assignments` ADD CONSTRAINT `admin_question_assignments_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_question_assignments` ADD CONSTRAINT `admin_question_assignments_assigned_by_id_fkey` FOREIGN KEY (`assigned_by_id`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_question_assignments` ADD CONSTRAINT `admin_question_assignments_que_id_fkey` FOREIGN KEY (`que_id`) REFERENCES `bank_questions`(`que_id`) ON DELETE CASCADE ON UPDATE CASCADE;
