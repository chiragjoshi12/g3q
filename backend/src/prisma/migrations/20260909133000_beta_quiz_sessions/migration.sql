-- Add abandoned to production session status (used by leave-midway submits).
ALTER TABLE `quiz_sessions`
  MODIFY COLUMN `status` ENUM('in_progress', 'submitted', 'abandoned', 'expired') NOT NULL DEFAULT 'in_progress';

-- Beta play sessions (isolated from production quiz_sessions).
CREATE TABLE `beta_quiz_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `status` ENUM('in_progress', 'submitted', 'abandoned', 'expired') NOT NULL DEFAULT 'in_progress',
    `question_count` INTEGER NOT NULL,
    `language` VARCHAR(8) NOT NULL DEFAULT 'gu',
    `started_at` DATETIME(3) NOT NULL,
    `expires_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `correct_count` INTEGER NULL,
    `wrong_count` INTEGER NULL,
    `total_time_ms` INTEGER NULL,
    `wall_clock_ms` INTEGER NULL,
    `average_time_ms` INTEGER NULL,
    `percentage` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `beta_quiz_sessions_user_id_status_idx`(`user_id`, `status`),
    INDEX `beta_quiz_sessions_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `beta_quiz_sessions_user_id_status_completed_at_idx`(`user_id`, `status`, `completed_at`),
    INDEX `beta_quiz_sessions_status_completed_at_user_id_idx`(`status`, `completed_at`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `beta_quiz_session_questions` (
    `id` VARCHAR(191) NOT NULL,
    `session_id` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `type` ENUM('single_choice', 'true_false', 'match_following', 'image_choice', 'drag_drop', 'drag_into_blanks') NOT NULL DEFAULT 'single_choice',
    `bank_que_id` VARCHAR(32) NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 1,
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
    `correct_option` CHAR(1) NOT NULL,
    `content` JSON NULL,
    `answer` JSON NULL,
    `selected_option` CHAR(1) NULL,
    `selected_answer` JSON NULL,
    `is_correct` BOOLEAN NULL,
    `time_spent_ms` INTEGER NULL,

    INDEX `beta_quiz_session_questions_bank_que_id_idx`(`bank_que_id`),
    UNIQUE INDEX `beta_quiz_session_questions_session_id_order_key`(`session_id`, `order`),
    UNIQUE INDEX `beta_quiz_session_questions_session_id_bank_que_id_key`(`session_id`, `bank_que_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `beta_user_question_exposures` (
    `user_id` VARCHAR(191) NOT NULL,
    `bank_que_id` VARCHAR(32) NOT NULL,
    `first_seen_at` DATETIME(3) NOT NULL,
    `last_seen_at` DATETIME(3) NOT NULL,
    `times_seen` INTEGER NOT NULL DEFAULT 1,
    `times_correct` INTEGER NOT NULL DEFAULT 0,
    `times_wrong` INTEGER NOT NULL DEFAULT 0,
    `total_time_ms` INTEGER NOT NULL DEFAULT 0,

    INDEX `beta_user_question_exposures_user_id_last_seen_at_idx`(`user_id`, `last_seen_at`),
    INDEX `beta_user_question_exposures_user_id_bank_que_id_idx`(`user_id`, `bank_que_id`),
    PRIMARY KEY (`user_id`, `bank_que_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `beta_quiz_sessions`
  ADD CONSTRAINT `beta_quiz_sessions_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `beta_quiz_session_questions`
  ADD CONSTRAINT `beta_quiz_session_questions_session_id_fkey`
  FOREIGN KEY (`session_id`) REFERENCES `beta_quiz_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `beta_quiz_session_questions`
  ADD CONSTRAINT `beta_quiz_session_questions_bank_que_id_fkey`
  FOREIGN KEY (`bank_que_id`) REFERENCES `bank_questions`(`que_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `beta_user_question_exposures`
  ADD CONSTRAINT `beta_user_question_exposures_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `beta_user_question_exposures`
  ADD CONSTRAINT `beta_user_question_exposures_bank_que_id_fkey`
  FOREIGN KEY (`bank_que_id`) REFERENCES `bank_questions`(`que_id`) ON DELETE CASCADE ON UPDATE CASCADE;
