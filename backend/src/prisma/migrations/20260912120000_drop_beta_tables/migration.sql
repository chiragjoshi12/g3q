-- Drop beta-only tables (FK order: detach question_roots, then children first).

-- question_roots may still reference beta_departments on DBs that never applied
-- 20260911123000 (or where that step failed). Safe if already dropped.
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'question_roots'
    AND CONSTRAINT_NAME = 'question_roots_beta_department_id_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  LIMIT 1
);
SET @sql := IF(
  @fk IS NOT NULL,
  'ALTER TABLE `question_roots` DROP FOREIGN KEY `question_roots_beta_department_id_fkey`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop leftover beta column if still present.
SET @col := (
  SELECT COLUMN_NAME
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'question_roots'
    AND COLUMN_NAME = 'beta_department_id'
  LIMIT 1
);
SET @sql := IF(
  @col IS NOT NULL,
  'ALTER TABLE `question_roots` DROP COLUMN `beta_department_id`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP TABLE IF EXISTS `beta_quiz_session_questions`;
DROP TABLE IF EXISTS `beta_user_question_exposures`;
DROP TABLE IF EXISTS `beta_quiz_sessions`;
DROP TABLE IF EXISTS `beta_question_variants`;
DROP TABLE IF EXISTS `beta_question_roots`;
DROP TABLE IF EXISTS `beta_department_quiz_images`;
DROP TABLE IF EXISTS `beta_users`;
DROP TABLE IF EXISTS `beta_departments`;
