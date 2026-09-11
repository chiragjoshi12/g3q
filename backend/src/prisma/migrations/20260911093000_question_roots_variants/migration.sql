-- Canonical question bank: roots (scope/district/caste) + variants (type JSON payload)
-- Existing bank_questions rows are preserved and linked (no data loss).

CREATE TABLE `question_roots` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `legacy_que_id` VARCHAR(32) NULL,
  `department_id` INTEGER NULL,
  `beta_department_id` INTEGER NULL,
  `department_gu` VARCHAR(255) NULL,
  `department_en` VARCHAR(255) NULL,
  `scope` VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
  `district_id` INTEGER NULL,
  `caste_category` VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
  `explanation_gu` TEXT NULL,
  `explanation_en` TEXT NULL,
  `explanation_hi` TEXT NULL,
  `last_edited_by_id` INTEGER NULL,
  `last_edited_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `question_roots_legacy_que_id_key`(`legacy_que_id`),
  INDEX `question_roots_scope_idx`(`scope`),
  INDEX `question_roots_district_id_idx`(`district_id`),
  INDEX `question_roots_caste_category_idx`(`caste_category`),
  INDEX `question_roots_scope_district_id_caste_category_idx`(`scope`, `district_id`, `caste_category`),
  INDEX `question_roots_department_id_idx`(`department_id`),
  INDEX `question_roots_beta_department_id_idx`(`beta_department_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `question_variants` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `root_id` INTEGER NOT NULL,
  `type` ENUM('mcq', 'true_false', 'fill_blanks', 'sequence', 'match_pairs') NOT NULL,
  `legacy_que_id` VARCHAR(32) NULL,
  `payload` JSON NOT NULL,
  `review_status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `reviewed_by_id` INTEGER NULL,
  `reviewed_at` DATETIME(3) NULL,
  `last_edited_by_id` INTEGER NULL,
  `last_edited_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `question_variants_legacy_que_id_key`(`legacy_que_id`),
  UNIQUE INDEX `question_variants_root_id_type_key`(`root_id`, `type`),
  INDEX `question_variants_type_idx`(`type`),
  INDEX `question_variants_review_status_idx`(`review_status`),
  INDEX `question_variants_review_status_type_idx`(`review_status`, `type`),
  INDEX `question_variants_root_id_review_status_idx`(`root_id`, `review_status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `question_roots`
  ADD CONSTRAINT `question_roots_department_id_fkey`
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `question_roots`
  ADD CONSTRAINT `question_roots_beta_department_id_fkey`
  FOREIGN KEY (`beta_department_id`) REFERENCES `beta_departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `question_roots`
  ADD CONSTRAINT `question_roots_district_id_fkey`
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `question_roots`
  ADD CONSTRAINT `question_roots_last_edited_by_id_fkey`
  FOREIGN KEY (`last_edited_by_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `question_variants`
  ADD CONSTRAINT `question_variants_root_id_fkey`
  FOREIGN KEY (`root_id`) REFERENCES `question_roots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `question_variants`
  ADD CONSTRAINT `question_variants_reviewed_by_id_fkey`
  FOREIGN KEY (`reviewed_by_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `question_variants`
  ADD CONSTRAINT `question_variants_last_edited_by_id_fkey`
  FOREIGN KEY (`last_edited_by_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bank_questions`
  ADD COLUMN `root_id` INTEGER NULL,
  ADD COLUMN `variant_id` INTEGER NULL;

CREATE INDEX `bank_questions_root_id_idx` ON `bank_questions`(`root_id`);
CREATE UNIQUE INDEX `bank_questions_variant_id_key` ON `bank_questions`(`variant_id`);

ALTER TABLE `bank_questions`
  ADD CONSTRAINT `bank_questions_root_id_fkey`
  FOREIGN KEY (`root_id`) REFERENCES `question_roots`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `bank_questions`
  ADD CONSTRAINT `bank_questions_variant_id_fkey`
  FOREIGN KEY (`variant_id`) REFERENCES `question_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
