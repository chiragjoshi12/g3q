-- Public OTP handle: clients use token (otp_token), not numeric id.

ALTER TABLE `otp_requests`
  ADD COLUMN `token` VARCHAR(32) NULL;

UPDATE `otp_requests`
SET `token` = LOWER(LPAD(HEX(`id`), 10, '0'))
WHERE `token` IS NULL OR `token` = '';

ALTER TABLE `otp_requests`
  MODIFY COLUMN `token` VARCHAR(32) NOT NULL;

CREATE UNIQUE INDEX `otp_requests_token_key` ON `otp_requests`(`token`);
