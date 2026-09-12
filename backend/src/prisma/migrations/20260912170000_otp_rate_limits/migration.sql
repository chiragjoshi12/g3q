-- OTP rate-limit fields: failed attempts, lock window, soft-consume history.

ALTER TABLE `otp_requests`
  ADD COLUMN `failed_attempts` INT NOT NULL DEFAULT 0,
  ADD COLUMN `locked_until` DATETIME(3) NULL,
  ADD COLUMN `consumed_at` DATETIME(3) NULL;

CREATE INDEX `otp_requests_mobile_locked_until_idx` ON `otp_requests`(`mobile`, `locked_until`);
