-- Full cutover: remount play/admin FKs onto question_variants, drop bank_questions.

-- 1) Truncate local play history (non-prod).
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `quiz_session_questions`;
TRUNCATE TABLE `quiz_sessions`;
TRUNCATE TABLE `user_question_exposures`;
SET FOREIGN_KEY_CHECKS = 1;

-- 2) New comment / activity tables keyed by variant_id.
CREATE TABLE `question_variant_comments` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `variant_id` INTEGER NOT NULL,
  `user_id` INTEGER NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `body` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `question_variant_comments_variant_id_idx`(`variant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `question_variant_activities` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `variant_id` INTEGER NOT NULL,
  `user_id` INTEGER NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `action` VARCHAR(32) NOT NULL,
  `detail` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `question_variant_activities_variant_id_idx`(`variant_id`),
  INDEX `question_variant_activities_created_at_idx`(`created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `question_variant_comments`
  ADD CONSTRAINT `question_variant_comments_variant_id_fkey`
  FOREIGN KEY (`variant_id`) REFERENCES `question_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `question_variant_comments`
  ADD CONSTRAINT `question_variant_comments_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `question_variant_activities`
  ADD CONSTRAINT `question_variant_activities_variant_id_fkey`
  FOREIGN KEY (`variant_id`) REFERENCES `question_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `question_variant_activities`
  ADD CONSTRAINT `question_variant_activities_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate any existing comments/activities via bank mirror (usually empty locally).
INSERT INTO `question_variant_comments` (`variant_id`, `user_id`, `username`, `body`, `created_at`)
SELECT b.variant_id, c.user_id, c.username, c.body, c.created_at
FROM `bank_question_comments` c
INNER JOIN `bank_questions` b ON b.que_id = c.que_id
WHERE b.variant_id IS NOT NULL;

INSERT INTO `question_variant_activities` (`variant_id`, `user_id`, `username`, `action`, `detail`, `created_at`)
SELECT b.variant_id, a.user_id, a.username, a.action, a.detail, a.created_at
FROM `bank_question_activities` a
INNER JOIN `bank_questions` b ON b.que_id = a.que_id
WHERE b.variant_id IS NOT NULL;

-- 3) Remount admin assignments onto variant_id.
ALTER TABLE `admin_question_assignments`
  ADD COLUMN `variant_id` INTEGER NULL;

UPDATE `admin_question_assignments` a
INNER JOIN `bank_questions` b ON b.que_id = a.que_id
SET a.variant_id = b.variant_id
WHERE b.variant_id IS NOT NULL;

DELETE FROM `admin_question_assignments` WHERE `variant_id` IS NULL;

ALTER TABLE `admin_question_assignments` DROP FOREIGN KEY `admin_question_assignments_que_id_fkey`;
ALTER TABLE `admin_question_assignments` DROP INDEX `admin_question_assignments_que_id_key`;
ALTER TABLE `admin_question_assignments` DROP COLUMN `que_id`;

ALTER TABLE `admin_question_assignments`
  MODIFY `variant_id` INTEGER NOT NULL;
CREATE UNIQUE INDEX `admin_question_assignments_variant_id_key` ON `admin_question_assignments`(`variant_id`);
ALTER TABLE `admin_question_assignments`
  ADD CONSTRAINT `admin_question_assignments_variant_id_fkey`
  FOREIGN KEY (`variant_id`) REFERENCES `question_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 4) Rebuild quiz_session_questions columns (already truncated).
ALTER TABLE `quiz_session_questions` DROP FOREIGN KEY `quiz_session_questions_bank_que_id_fkey`;
ALTER TABLE `quiz_session_questions` DROP INDEX `quiz_session_questions_session_id_bank_que_id_key`;
ALTER TABLE `quiz_session_questions` DROP INDEX `quiz_session_questions_bank_que_id_idx`;
ALTER TABLE `quiz_session_questions` DROP COLUMN `bank_que_id`;

ALTER TABLE `quiz_session_questions`
  ADD COLUMN `que_id` VARCHAR(32) NOT NULL,
  ADD COLUMN `variant_id` INTEGER NOT NULL;

CREATE UNIQUE INDEX `quiz_session_questions_session_id_variant_id_key`
  ON `quiz_session_questions`(`session_id`, `variant_id`);
CREATE INDEX `quiz_session_questions_variant_id_idx` ON `quiz_session_questions`(`variant_id`);
CREATE INDEX `quiz_session_questions_que_id_idx` ON `quiz_session_questions`(`que_id`);

ALTER TABLE `quiz_session_questions`
  ADD CONSTRAINT `quiz_session_questions_variant_id_fkey`
  FOREIGN KEY (`variant_id`) REFERENCES `question_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5) Rebuild user_question_exposures (already truncated).
ALTER TABLE `user_question_exposures` DROP FOREIGN KEY `user_question_exposures_bank_que_id_fkey`;
ALTER TABLE `user_question_exposures` DROP PRIMARY KEY;
ALTER TABLE `user_question_exposures` DROP INDEX `user_question_exposures_user_id_bank_que_id_idx`;
ALTER TABLE `user_question_exposures` DROP COLUMN `bank_que_id`;

ALTER TABLE `user_question_exposures`
  ADD COLUMN `variant_id` INTEGER NOT NULL,
  ADD COLUMN `root_id` INTEGER NOT NULL;

ALTER TABLE `user_question_exposures`
  ADD PRIMARY KEY (`user_id`, `variant_id`);
CREATE INDEX `user_question_exposures_user_id_root_id_idx` ON `user_question_exposures`(`user_id`, `root_id`);
CREATE INDEX `user_question_exposures_root_id_idx` ON `user_question_exposures`(`root_id`);

ALTER TABLE `user_question_exposures`
  ADD CONSTRAINT `user_question_exposures_variant_id_fkey`
  FOREIGN KEY (`variant_id`) REFERENCES `question_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_question_exposures`
  ADD CONSTRAINT `user_question_exposures_root_id_fkey`
  FOREIGN KEY (`root_id`) REFERENCES `question_roots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 6) Require legacy_que_id on variants (all rows already populated from backfill).
UPDATE `question_variants` SET `legacy_que_id` = CONCAT('MISSING_', `id`) WHERE `legacy_que_id` IS NULL;
ALTER TABLE `question_variants` MODIFY `legacy_que_id` VARCHAR(32) NOT NULL;

-- 7) Drop bank mirror + old comment/activity tables.
DROP TABLE IF EXISTS `bank_question_comments`;
DROP TABLE IF EXISTS `bank_question_activities`;

ALTER TABLE `bank_questions` DROP FOREIGN KEY `bank_questions_root_id_fkey`;
ALTER TABLE `bank_questions` DROP FOREIGN KEY `bank_questions_variant_id_fkey`;
ALTER TABLE `bank_questions` DROP FOREIGN KEY `bank_questions_reviewed_by_id_fkey`;
ALTER TABLE `bank_questions` DROP FOREIGN KEY `bank_questions_last_edited_by_id_fkey`;
ALTER TABLE `bank_questions` DROP FOREIGN KEY `bank_questions_department_id_fkey`;
ALTER TABLE `bank_questions` DROP FOREIGN KEY `bank_questions_beta_department_id_fkey`;
ALTER TABLE `bank_questions` DROP FOREIGN KEY `bank_questions_district_id_fkey`;

DROP TABLE `bank_questions`;
