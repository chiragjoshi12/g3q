-- AlterTable: roster fields from admin/students.json
ALTER TABLE `users` ADD COLUMN `surname` VARCHAR(128) NULL;
ALTER TABLE `users` ADD COLUMN `gender` VARCHAR(16) NULL;
ALTER TABLE `users` ADD COLUMN `father_name` VARCHAR(128) NULL;
ALTER TABLE `users` ADD COLUMN `mother_name` VARCHAR(128) NULL;
ALTER TABLE `users` ADD COLUMN `village` VARCHAR(128) NULL;
ALTER TABLE `users` ADD COLUMN `date_of_birth` VARCHAR(32) NULL;
