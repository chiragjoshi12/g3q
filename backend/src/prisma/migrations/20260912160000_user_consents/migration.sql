-- Citizen signup consents (data use + info accuracy).

CREATE TABLE `user_consents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `consent_version` VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `accepted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `user_consents_user_id_idx` (`user_id`),
  KEY `user_consents_accepted_at_idx` (`accepted_at`),
  CONSTRAINT `user_consents_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
