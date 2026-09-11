-- quiz_sessions: drop unused timing columns
ALTER TABLE `quiz_sessions`
  DROP COLUMN `wall_clock_ms`,
  DROP COLUMN `average_time_ms`;

-- otp_requests: rebuild as simple int-id challenges (ephemeral login data)
ALTER TABLE `otp_requests` DROP FOREIGN KEY `otp_requests_user_id_fkey`;
DROP TABLE `otp_requests`;
CREATE TABLE `otp_requests` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `role` ENUM('student', 'college', 'citizen') NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `otp` VARCHAR(16) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `verified_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `otp_requests_phone_created_at_idx`(`phone`, `created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- analytics_visitors / events: int visitor PK + geo FKs (tracking data rebuilt)
ALTER TABLE `analytics_events` DROP FOREIGN KEY `analytics_events_visitor_id_fkey`;
ALTER TABLE `analytics_events` DROP FOREIGN KEY `analytics_events_user_id_fkey`;
DROP TABLE `analytics_events`;
ALTER TABLE `analytics_visitors` DROP FOREIGN KEY `analytics_visitors_user_id_fkey`;
DROP TABLE `analytics_visitors`;

CREATE TABLE `analytics_visitors` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `visitor_key` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(191) NULL,
  `first_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `analytics_visitors_visitor_key_key`(`visitor_key`),
  INDEX `analytics_visitors_user_id_idx`(`user_id`),
  INDEX `analytics_visitors_last_seen_at_idx`(`last_seen_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `analytics_visitors`
  ADD CONSTRAINT `analytics_visitors_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `analytics_events` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `event_id` VARCHAR(64) NOT NULL,
  `event_type` ENUM('certificate_download', 'g3q_ai_query', 'practice_quiz_start', 'practice_quiz_complete') NOT NULL,
  `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `week` INTEGER NOT NULL,
  `user_id` VARCHAR(191) NULL,
  `visitor_id` INTEGER NULL,
  `role` ENUM('student', 'college', 'citizen') NULL,
  `district_id` INTEGER NULL,
  `taluka_id` INTEGER NULL,
  `quiz_id` VARCHAR(64) NULL,
  `session_id` VARCHAR(64) NULL,
  `attempt_id` VARCHAR(64) NULL,
  `question_count` INTEGER NULL,
  `success` BOOLEAN NULL,
  `latency_ms` INTEGER NULL,
  `source` VARCHAR(64) NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `analytics_events_event_id_key`(`event_id`),
  INDEX `analytics_events_occurred_at_idx`(`occurred_at`),
  INDEX `analytics_events_event_type_occurred_at_idx`(`event_type`, `occurred_at`),
  INDEX `analytics_events_week_role_idx`(`week`, `role`),
  INDEX `analytics_events_district_id_taluka_id_idx`(`district_id`, `taluka_id`),
  INDEX `analytics_events_user_id_idx`(`user_id`),
  INDEX `analytics_events_visitor_id_idx`(`visitor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `analytics_events`
  ADD CONSTRAINT `analytics_events_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `analytics_events`
  ADD CONSTRAINT `analytics_events_visitor_id_fkey`
  FOREIGN KEY (`visitor_id`) REFERENCES `analytics_visitors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `analytics_events`
  ADD CONSTRAINT `analytics_events_district_id_fkey`
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `analytics_events`
  ADD CONSTRAINT `analytics_events_taluka_id_fkey`
  FOREIGN KEY (`taluka_id`) REFERENCES `talukas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- bank_questions.district (string) -> district_id FK
ALTER TABLE `bank_questions` ADD COLUMN `district_id` INTEGER NULL;

UPDATE `bank_questions` b
INNER JOIN `districts` d
  ON LOWER(d.name_en) = LOWER(b.district)
  OR LOWER(d.name_gu) = LOWER(b.district)
SET b.district_id = d.id
WHERE b.district IS NOT NULL AND b.district <> '';

-- common English aliases
UPDATE `bank_questions` b
INNER JOIN `districts` d ON d.name_en = 'Kachchh'
SET b.district_id = d.id
WHERE b.district_id IS NULL AND LOWER(b.district) IN ('kutch', 'kachchh');

UPDATE `bank_questions` b
INNER JOIN `districts` d ON d.name_en = 'Devbhumi Dwarka'
SET b.district_id = d.id
WHERE b.district_id IS NULL AND LOWER(REPLACE(b.district, ' ', '')) IN ('devbhumidwarka', 'devbhoomidwarka');

DROP INDEX `bank_questions_district_idx` ON `bank_questions`;
DROP INDEX `bank_questions_review_status_correct_option_district_idx` ON `bank_questions`;

ALTER TABLE `bank_questions` DROP COLUMN `district`;

CREATE INDEX `bank_questions_district_id_idx` ON `bank_questions`(`district_id`);
CREATE INDEX `bank_questions_review_status_correct_option_district_id_idx`
  ON `bank_questions`(`review_status`, `correct_option`, `district_id`);

ALTER TABLE `bank_questions`
  ADD CONSTRAINT `bank_questions_district_id_fkey`
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- beta_users: string geo -> FKs
ALTER TABLE `beta_users`
  ADD COLUMN `district_id` INTEGER NULL,
  ADD COLUMN `taluka_id` INTEGER NULL;

UPDATE `beta_users` b
INNER JOIN `users` u ON u.id = b.linked_user_id
SET b.district_id = u.district_id, b.taluka_id = u.taluka_id
WHERE u.district_id IS NOT NULL AND u.taluka_id IS NOT NULL;

UPDATE `beta_users` b
INNER JOIN `districts` d
  ON LOWER(d.name_en) = LOWER(b.district) OR LOWER(d.name_gu) = LOWER(b.district)
SET b.district_id = d.id
WHERE b.district_id IS NULL;

UPDATE `beta_users` b
INNER JOIN `talukas` t
  ON (LOWER(t.name_en) = LOWER(b.taluka) OR LOWER(t.name_gu) = LOWER(b.taluka))
  AND (b.district_id IS NULL OR t.district_id = b.district_id)
SET b.taluka_id = t.id, b.district_id = COALESCE(b.district_id, t.district_id)
WHERE b.taluka_id IS NULL;

-- drop rows that still cannot resolve geo (beta is non-critical)
DELETE FROM `beta_users` WHERE `district_id` IS NULL OR `taluka_id` IS NULL;

ALTER TABLE `beta_users`
  DROP COLUMN `district`,
  DROP COLUMN `taluka`,
  MODIFY `district_id` INTEGER NOT NULL,
  MODIFY `taluka_id` INTEGER NOT NULL;

CREATE INDEX `beta_users_district_id_idx` ON `beta_users`(`district_id`);
CREATE INDEX `beta_users_taluka_id_idx` ON `beta_users`(`taluka_id`);

ALTER TABLE `beta_users`
  ADD CONSTRAINT `beta_users_district_id_fkey`
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `beta_users`
  ADD CONSTRAINT `beta_users_taluka_id_fkey`
  FOREIGN KEY (`taluka_id`) REFERENCES `talukas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- leaderboard_aggregates: string geo -> FKs (rebuild from users when possible)
ALTER TABLE `leaderboard_aggregates`
  ADD COLUMN `taluka_id` INTEGER NULL,
  ADD COLUMN `district_id` INTEGER NULL;

UPDATE `leaderboard_aggregates` la
INNER JOIN `users` u ON u.id = la.user_id
SET la.taluka_id = u.taluka_id, la.district_id = u.district_id
WHERE u.taluka_id IS NOT NULL;

UPDATE `leaderboard_aggregates` la
INNER JOIN `talukas` t
  ON LOWER(t.name_en) = LOWER(la.taluka) OR LOWER(t.name_gu) = LOWER(la.taluka) OR LOWER(t.name_hi) = LOWER(la.taluka)
SET la.taluka_id = t.id, la.district_id = COALESCE(la.district_id, t.district_id)
WHERE la.taluka_id IS NULL;

DELETE FROM `leaderboard_aggregates` WHERE `taluka_id` IS NULL;

-- Collapse duplicates that share the same new unique key
DELETE `la1` FROM `leaderboard_aggregates` `la1`
INNER JOIN `leaderboard_aggregates` `la2`
  ON `la1`.`week` = `la2`.`week`
 AND `la1`.`role` = `la2`.`role`
 AND `la1`.`taluka_id` = `la2`.`taluka_id`
 AND `la1`.`user_id` = `la2`.`user_id`
 AND `la1`.`id` > `la2`.`id`;

DROP INDEX `leaderboard_aggregates_week_role_taluka_user_id_key` ON `leaderboard_aggregates`;
DROP INDEX `leaderboard_aggregates_week_taluka_role_idx` ON `leaderboard_aggregates`;
DROP INDEX `leaderboard_aggregates_rank_idx` ON `leaderboard_aggregates`;

ALTER TABLE `leaderboard_aggregates`
  DROP COLUMN `taluka`,
  DROP COLUMN `district`,
  MODIFY `taluka_id` INTEGER NOT NULL;

CREATE UNIQUE INDEX `leaderboard_aggregates_week_role_taluka_id_user_id_key`
  ON `leaderboard_aggregates`(`week`, `role`, `taluka_id`, `user_id`);
CREATE INDEX `leaderboard_aggregates_week_taluka_id_role_idx`
  ON `leaderboard_aggregates`(`week`, `taluka_id`, `role`);
CREATE INDEX `leaderboard_aggregates_rank_idx`
  ON `leaderboard_aggregates`(`week`, `role`, `taluka_id`, `best_percentage`, `total_correct`, `total_time_ms`);

ALTER TABLE `leaderboard_aggregates`
  ADD CONSTRAINT `leaderboard_aggregates_taluka_id_fkey`
  FOREIGN KEY (`taluka_id`) REFERENCES `talukas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `leaderboard_aggregates`
  ADD CONSTRAINT `leaderboard_aggregates_district_id_fkey`
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- leaderboard_taluka_stats
ALTER TABLE `leaderboard_taluka_stats`
  ADD COLUMN `taluka_id` INTEGER NULL,
  ADD COLUMN `district_id` INTEGER NULL;

UPDATE `leaderboard_taluka_stats` ls
INNER JOIN `talukas` t
  ON LOWER(t.name_en) = LOWER(ls.taluka) OR LOWER(t.name_gu) = LOWER(ls.taluka) OR LOWER(t.name_hi) = LOWER(ls.taluka)
SET ls.taluka_id = t.id, ls.district_id = t.district_id
WHERE ls.taluka_id IS NULL;

DELETE FROM `leaderboard_taluka_stats` WHERE `taluka_id` IS NULL;

DROP INDEX `leaderboard_taluka_stats_week_taluka_key` ON `leaderboard_taluka_stats`;

ALTER TABLE `leaderboard_taluka_stats`
  DROP COLUMN `taluka`,
  DROP COLUMN `district`,
  MODIFY `taluka_id` INTEGER NOT NULL;

CREATE UNIQUE INDEX `leaderboard_taluka_stats_week_taluka_id_key`
  ON `leaderboard_taluka_stats`(`week`, `taluka_id`);

ALTER TABLE `leaderboard_taluka_stats`
  ADD CONSTRAINT `leaderboard_taluka_stats_taluka_id_fkey`
  FOREIGN KEY (`taluka_id`) REFERENCES `talukas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `leaderboard_taluka_stats`
  ADD CONSTRAINT `leaderboard_taluka_stats_district_id_fkey`
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
