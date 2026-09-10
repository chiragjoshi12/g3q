-- AlterTable
ALTER TABLE `quiz_sessions` MODIFY COLUMN `status` ENUM('in_progress', 'submitted', 'abandoned', 'expired') NOT NULL DEFAULT 'in_progress';
