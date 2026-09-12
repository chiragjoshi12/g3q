-- Rebuild users with schema field order; replace udise/abc/phone with cts/appar/mobile(+hash).
-- otp_requests.phone → mobile.

SET FOREIGN_KEY_CHECKS = 0;

-- Drop child FKs that point at users (idempotent-ish for re-run after partial failure).
SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'quiz_sessions'
        AND CONSTRAINT_NAME = 'quiz_sessions_user_id_fkey'
    ),
    'ALTER TABLE `quiz_sessions` DROP FOREIGN KEY `quiz_sessions_user_id_fkey`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'user_question_exposures'
        AND CONSTRAINT_NAME = 'user_question_exposures_user_id_fkey'
    ),
    'ALTER TABLE `user_question_exposures` DROP FOREIGN KEY `user_question_exposures_user_id_fkey`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'analytics_visitors'
        AND CONSTRAINT_NAME = 'analytics_visitors_user_id_fkey'
    ),
    'ALTER TABLE `analytics_visitors` DROP FOREIGN KEY `analytics_visitors_user_id_fkey`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'leaderboard_aggregates'
        AND CONSTRAINT_NAME = 'leaderboard_aggregates_user_id_fkey'
    ),
    'ALTER TABLE `leaderboard_aggregates` DROP FOREIGN KEY `leaderboard_aggregates_user_id_fkey`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Prefer rename of live `users`; if a prior failed run left only the backup, reuse it.
SET @has_users = (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
);
SET @has_old = (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users_old_cred_migrate'
);

SET @sql = IF(
  @has_users > 0 AND @has_old = 0,
  'RENAME TABLE `users` TO `users_old_cred_migrate`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Constraint names are schema-global; drop them from the backup before recreating `users`.
SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users_old_cred_migrate'
        AND CONSTRAINT_NAME = 'users_district_id_fkey'
    ),
    'ALTER TABLE `users_old_cred_migrate` DROP FOREIGN KEY `users_district_id_fkey`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users_old_cred_migrate'
        AND CONSTRAINT_NAME = 'users_taluka_id_fkey'
    ),
    'ALTER TABLE `users_old_cred_migrate` DROP FOREIGN KEY `users_taluka_id_fkey`',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` ENUM('student', 'college', 'citizen') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `surname` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `gender` VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `father_name` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `mother_name` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `institute` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `school_id` VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `grade` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `district_id` INT NULL,
  `taluka_id` INT NULL,
  `village` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `profile_photo` VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `social_category` VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `date_of_birth` VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `mobile` VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `mobile_hash` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `cts_id` VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `appar_id` VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_cts_id_key` (`cts_id`),
  UNIQUE KEY `users_appar_id_key` (`appar_id`),
  UNIQUE KEY `users_mobile_hash_key` (`mobile_hash`),
  KEY `users_school_id_idx` (`school_id`),
  KEY `users_district_id_idx` (`district_id`),
  KEY `users_taluka_id_idx` (`taluka_id`),
  KEY `users_institute_idx` (`institute`),
  KEY `users_mobile_hash_idx` (`mobile_hash`),
  KEY `users_role_mobile_hash_idx` (`role`, `mobile_hash`),
  CONSTRAINT `users_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_taluka_id_fkey` FOREIGN KEY (`taluka_id`) REFERENCES `talukas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `users` (
  `id`, `role`, `name`, `surname`, `gender`, `father_name`, `mother_name`,
  `institute`, `school_id`, `grade`, `district_id`, `taluka_id`, `village`,
  `profile_photo`, `social_category`, `date_of_birth`,
  `mobile`, `mobile_hash`, `cts_id`, `appar_id`, `created_at`, `updated_at`
)
SELECT
  `id`,
  `role`,
  `name`,
  `surname`,
  `gender`,
  `father_name`,
  `mother_name`,
  `institute`,
  `school_id`,
  `grade`,
  `district_id`,
  `taluka_id`,
  `village`,
  `profile_photo`,
  `social_category`,
  `date_of_birth`,
  CASE
    WHEN `phone` IS NULL OR TRIM(`phone`) = '' THEN NULL
    ELSE RIGHT(REGEXP_REPLACE(`phone`, '[^0-9]', ''), 10)
  END,
  NULL,
  CASE WHEN `udise_code` IS NULL OR TRIM(`udise_code`) = '' THEN NULL ELSE LEFT(`udise_code`, 32) END,
  CASE WHEN `abc_id` IS NULL OR TRIM(`abc_id`) = '' THEN NULL ELSE LEFT(`abc_id`, 32) END,
  `created_at`,
  `updated_at`
FROM `users_old_cred_migrate`;

DROP TABLE `users_old_cred_migrate`;

ALTER TABLE `quiz_sessions`
  ADD CONSTRAINT `quiz_sessions_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_question_exposures`
  ADD CONSTRAINT `user_question_exposures_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `analytics_visitors`
  ADD CONSTRAINT `analytics_visitors_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `leaderboard_aggregates`
  ADD CONSTRAINT `leaderboard_aggregates_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- otp_requests: rename phone → mobile (skip if already renamed)
SET @has_phone = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'otp_requests' AND COLUMN_NAME = 'phone'
);
SET @sql = IF(
  @has_phone > 0,
  'ALTER TABLE `otp_requests` DROP INDEX `otp_requests_phone_created_at_idx`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  @has_phone > 0,
  'ALTER TABLE `otp_requests` CHANGE `phone` `mobile` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_mobile_idx = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'otp_requests'
    AND INDEX_NAME = 'otp_requests_mobile_created_at_idx'
);
SET @sql = IF(
  @has_mobile_idx = 0,
  'CREATE INDEX `otp_requests_mobile_created_at_idx` ON `otp_requests` (`mobile`, `created_at`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;
