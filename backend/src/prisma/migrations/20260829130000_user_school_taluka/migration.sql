-- AlterTable
ALTER TABLE `users` ADD COLUMN `school_id` VARCHAR(32) NULL;
ALTER TABLE `users` ADD COLUMN `taluka` VARCHAR(128) NULL;

CREATE INDEX `users_school_id_idx` ON `users`(`school_id`);
CREATE INDEX `users_taluka_idx` ON `users`(`taluka`);
CREATE INDEX `users_institute_idx` ON `users`(`institute`);
