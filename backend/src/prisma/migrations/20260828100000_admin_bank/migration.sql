-- CreateTable
CREATE TABLE `admin_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(64) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('master', 'admin') NOT NULL DEFAULT 'admin',
    `full_name` VARCHAR(128) NULL,
    `university` VARCHAR(255) NULL,
    `mobile_number` VARCHAR(20) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `que_id` VARCHAR(32) NOT NULL,
    `department_gu` VARCHAR(255) NULL,
    `department_en` VARCHAR(255) NULL,
    `question_gu` TEXT NULL,
    `question_en` TEXT NULL,
    `option_a_gu` TEXT NULL,
    `option_b_gu` TEXT NULL,
    `option_c_gu` TEXT NULL,
    `option_d_gu` TEXT NULL,
    `option_a_en` TEXT NULL,
    `option_b_en` TEXT NULL,
    `option_c_en` TEXT NULL,
    `option_d_en` TEXT NULL,
    `correct_option` CHAR(1) NULL,
    `scope` VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
    `district` VARCHAR(128) NULL,
    `caste_category` VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
    `review_status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewed_by_id` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,
    `last_edited_by_id` INTEGER NULL,
    `last_edited_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bank_questions_que_id_key`(`que_id`),
    INDEX `bank_questions_correct_option_idx`(`correct_option`),
    INDEX `bank_questions_scope_idx`(`scope`),
    INDEX `bank_questions_district_idx`(`district`),
    INDEX `bank_questions_caste_category_idx`(`caste_category`),
    INDEX `bank_questions_review_status_idx`(`review_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_question_comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `que_id` VARCHAR(32) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `body` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bank_question_comments_que_id_idx`(`que_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_question_activities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `que_id` VARCHAR(32) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `action` VARCHAR(32) NOT NULL,
    `detail` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bank_question_activities_que_id_idx`(`que_id`),
    INDEX `bank_question_activities_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bank_questions` ADD CONSTRAINT `bank_questions_reviewed_by_id_fkey` FOREIGN KEY (`reviewed_by_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_questions` ADD CONSTRAINT `bank_questions_last_edited_by_id_fkey` FOREIGN KEY (`last_edited_by_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_question_comments` ADD CONSTRAINT `bank_question_comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_question_comments` ADD CONSTRAINT `bank_question_comments_que_id_fkey` FOREIGN KEY (`que_id`) REFERENCES `bank_questions`(`que_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_question_activities` ADD CONSTRAINT `bank_question_activities_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_question_activities` ADD CONSTRAINT `bank_question_activities_que_id_fkey` FOREIGN KEY (`que_id`) REFERENCES `bank_questions`(`que_id`) ON DELETE CASCADE ON UPDATE CASCADE;
