-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('student', 'college', 'citizen') NOT NULL;

-- AlterTable
ALTER TABLE `otp_requests` DROP FOREIGN KEY `otp_requests_user_id_fkey`;

-- AlterTable
ALTER TABLE `otp_requests` MODIFY `role` ENUM('student', 'college', 'citizen') NOT NULL;

-- AlterTable
ALTER TABLE `otp_requests` MODIFY `user_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `otp_requests` ADD COLUMN `verified_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `otp_requests` ADD CONSTRAINT `otp_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `users_role_phone_idx` ON `users`(`role`, `phone`);
