-- Drop batches; assignments stand alone with quotas

ALTER TABLE `admin_question_assignments`
  DROP FOREIGN KEY `admin_question_assignments_batch_id_fkey`;

ALTER TABLE `admin_question_assignments`
  DROP INDEX `admin_question_assignments_batch_id_idx`;

ALTER TABLE `admin_question_assignments`
  DROP COLUMN `batch_id`;

DROP TABLE `admin_work_batches`;
