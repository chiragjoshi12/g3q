-- Rebuild analytics tables (tracking data is ephemeral)

ALTER TABLE `analytics_events` DROP FOREIGN KEY `analytics_events_visitor_id_fkey`;
ALTER TABLE `analytics_events` DROP FOREIGN KEY `analytics_events_user_id_fkey`;
ALTER TABLE `analytics_events` DROP FOREIGN KEY `analytics_events_district_id_fkey`;
ALTER TABLE `analytics_events` DROP FOREIGN KEY `analytics_events_taluka_id_fkey`;
DROP TABLE `analytics_events`;

ALTER TABLE `analytics_visitors` DROP FOREIGN KEY `analytics_visitors_user_id_fkey`;
DROP TABLE `analytics_visitors`;

CREATE TABLE `analytics_visitors` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `visitor_key` VARCHAR(24) NOT NULL,
  `user_id` VARCHAR(191) NULL,
  `first_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
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
  `event_type` ENUM('certificate_download', 'g3q_ai_query', 'practice_quiz_start', 'practice_quiz_complete') NOT NULL,
  `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `week` INTEGER NOT NULL,
  `visitor_id` INTEGER NOT NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `analytics_events_occurred_at_idx`(`occurred_at`),
  INDEX `analytics_events_event_type_occurred_at_idx`(`event_type`, `occurred_at`),
  INDEX `analytics_events_week_idx`(`week`),
  INDEX `analytics_events_visitor_id_idx`(`visitor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `analytics_events`
  ADD CONSTRAINT `analytics_events_visitor_id_fkey`
  FOREIGN KEY (`visitor_id`) REFERENCES `analytics_visitors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
