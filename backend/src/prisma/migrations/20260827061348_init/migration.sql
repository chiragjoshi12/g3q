-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `role` ENUM('student', 'college') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `institute` VARCHAR(191) NULL,
    `grade` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `udise_code` VARCHAR(191) NULL,
    `abc_id` VARCHAR(191) NULL,
    `joined_on` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_udise_code_key`(`udise_code`),
    UNIQUE INDEX `users_abc_id_key`(`abc_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_requests` (
    `id` VARCHAR(191) NOT NULL,
    `request_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` ENUM('student', 'college') NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `masked_phone` VARCHAR(191) NOT NULL,
    `otp` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `consumed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `otp_requests_request_id_key`(`request_id`),
    INDEX `otp_requests_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quizzes` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `banner` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `level` VARCHAR(191) NULL,
    `total_questions` INTEGER NOT NULL DEFAULT 0,
    `duration_minutes` INTEGER NOT NULL DEFAULT 0,
    `total_points` INTEGER NOT NULL DEFAULT 0,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `tags` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` VARCHAR(191) NOT NULL,
    `quiz_id` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `type` ENUM('single_choice', 'match_following', 'image_choice', 'drag_drop', 'drag_into_blanks') NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 1,
    `prompt` TEXT NOT NULL,
    `placeholder` VARCHAR(191) NULL,
    `options` JSON NULL,
    `left` JSON NULL,
    `right` JSON NULL,
    `items` JSON NULL,
    `segments` JSON NULL,
    `bank` JSON NULL,
    `answer` JSON NOT NULL,
    `acceptable` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `questions_quiz_id_idx`(`quiz_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `explanations` (
    `id` VARCHAR(191) NOT NULL,
    `question_id` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL DEFAULT 'AI',
    `summary` TEXT NULL,
    `body` TEXT NULL,
    `key_points` JSON NULL,

    UNIQUE INDEX `explanations_question_id_key`(`question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attempts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `quiz_id` VARCHAR(191) NOT NULL,
    `quiz_title` VARCHAR(191) NOT NULL,
    `started_at` DATETIME(3) NOT NULL,
    `completed_at` DATETIME(3) NOT NULL,
    `total_questions` INTEGER NOT NULL,
    `correct_count` INTEGER NOT NULL,
    `wrong_count` INTEGER NOT NULL,
    `earned_points` INTEGER NOT NULL,
    `max_points` INTEGER NOT NULL,
    `percentage` INTEGER NOT NULL,
    `total_time_ms` INTEGER NOT NULL,
    `wall_clock_ms` INTEGER NOT NULL,
    `average_time_ms` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attempts_user_id_idx`(`user_id`),
    INDEX `attempts_quiz_id_idx`(`quiz_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attempt_answers` (
    `id` VARCHAR(191) NOT NULL,
    `attempt_id` VARCHAR(191) NOT NULL,
    `question_id` VARCHAR(191) NOT NULL,
    `type` ENUM('single_choice', 'match_following', 'image_choice', 'drag_drop', 'drag_into_blanks') NOT NULL,
    `correct` BOOLEAN NOT NULL,
    `earned_points` INTEGER NOT NULL,
    `max_points` INTEGER NOT NULL,
    `answer` JSON NOT NULL,
    `correct_answer` JSON NOT NULL,
    `time_spent_ms` INTEGER NOT NULL,

    UNIQUE INDEX `attempt_answers_attempt_id_question_id_key`(`attempt_id`, `question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `otp_requests` ADD CONSTRAINT `otp_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_quiz_id_fkey` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `explanations` ADD CONSTRAINT `explanations_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_quiz_id_fkey` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attempt_answers` ADD CONSTRAINT `attempt_answers_attempt_id_fkey` FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attempt_answers` ADD CONSTRAINT `attempt_answers_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
