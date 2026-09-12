-- Rebuild talukas with type (taluka | municipal_corporation) from Wikipedia list.
-- Clears dependent FKs, drops table, recreates, then data is seeded by sync script / migrate follow-up.

SET FOREIGN_KEY_CHECKS = 0;

UPDATE `users` SET `taluka_id` = NULL WHERE `taluka_id` IS NOT NULL;

DELETE FROM `leaderboard_aggregates`;
DELETE FROM `leaderboard_taluka_stats`;

DROP TABLE IF EXISTS `talukas`;

CREATE TABLE `talukas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `district_id` INT NOT NULL,
  `name_en` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_gu` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_hi` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` ENUM('taluka', 'municipal_corporation') NOT NULL DEFAULT 'taluka',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `talukas_district_id_name_en_key` (`district_id`, `name_en`),
  UNIQUE KEY `talukas_district_id_name_gu_key` (`district_id`, `name_gu`),
  KEY `talukas_district_id_idx` (`district_id`),
  KEY `talukas_type_idx` (`type`),
  CONSTRAINT `talukas_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
