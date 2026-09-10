-- AlterTable: users geography FKs + drop joined_on / string district+taluka

ALTER TABLE `users`
  ADD COLUMN `district_id` INTEGER NULL,
  ADD COLUMN `taluka_id` INTEGER NULL;

-- Backfill district_id from legacy string district (en/gu/hi)
UPDATE `users` u
LEFT JOIN `districts` d
  ON LOWER(d.name_en) = LOWER(u.district)
  OR LOWER(d.name_gu) = LOWER(u.district)
  OR LOWER(COALESCE(d.name_hi, '')) = LOWER(u.district)
SET u.district_id = d.id
WHERE u.district IS NOT NULL
  AND TRIM(u.district) <> ''
  AND u.district_id IS NULL;

-- Backfill taluka_id from legacy string taluka (scoped to district when known)
UPDATE `users` u
INNER JOIN `talukas` t
  ON (
    LOWER(t.name_en) = LOWER(u.taluka)
    OR LOWER(t.name_gu) = LOWER(u.taluka)
    OR LOWER(t.name_hi) = LOWER(u.taluka)
  )
  AND (u.district_id IS NULL OR t.district_id = u.district_id)
SET u.taluka_id = t.id,
    u.district_id = COALESCE(u.district_id, t.district_id)
WHERE u.taluka IS NOT NULL
  AND TRIM(u.taluka) <> ''
  AND u.taluka_id IS NULL;

-- Drop old indexes / columns
DROP INDEX `users_taluka_idx` ON `users`;

ALTER TABLE `users`
  DROP COLUMN `district`,
  DROP COLUMN `taluka`,
  DROP COLUMN `joined_on`;

CREATE INDEX `users_district_id_idx` ON `users`(`district_id`);
CREATE INDEX `users_taluka_id_idx` ON `users`(`taluka_id`);

ALTER TABLE `users`
  ADD CONSTRAINT `users_district_id_fkey`
    FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `users`
  ADD CONSTRAINT `users_taluka_id_fkey`
    FOREIGN KEY (`taluka_id`) REFERENCES `talukas`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
