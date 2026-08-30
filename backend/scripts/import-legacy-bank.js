/**
 * Copy bilingual bank data from legacy MySQL `g3q` → app DB `g3q_backend`
 * WITHOUT modifying the source database (SELECT-only on legacy).
 *
 * Usage: npm run import:legacy-bank
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const legacyDb = process.env.LEGACY_MYSQL_DATABASE || 'g3q';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  // Parse mysql://user:pass@host:port/db
  const parsed = new URL(url);
  const targetDb = parsed.pathname.replace(/^\//, '');
  const conn = await mysql.createConnection({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    multipleStatements: true,
  });

  console.log(`Source (read-only): ${legacyDb}`);
  console.log(`Target: ${targetDb} @ ${parsed.hostname}:${parsed.port}`);

  await conn.query(`
SET FOREIGN_KEY_CHECKS=0;

INSERT INTO \`${targetDb}\`.admin_users
  (id, username, password_hash, role, full_name, university, mobile_number, is_active, created_at)
SELECT
  id, username, password_hash,
  CASE WHEN LOWER(role)='master' THEN 'master' ELSE 'admin' END,
  full_name, university, mobile_number,
  IF(is_active=1, 1, 0), created_at
FROM \`${legacyDb}\`.users
ON DUPLICATE KEY UPDATE
  username=VALUES(username),
  password_hash=VALUES(password_hash),
  role=VALUES(role),
  full_name=VALUES(full_name),
  university=VALUES(university),
  mobile_number=VALUES(mobile_number),
  is_active=VALUES(is_active);

INSERT INTO \`${targetDb}\`.bank_questions
  (id, que_id, department_gu, department_en, question_gu, question_en,
   option_a_gu, option_b_gu, option_c_gu, option_d_gu,
   option_a_en, option_b_en, option_c_en, option_d_en,
   correct_option, scope, district, caste_category,
   review_status, reviewed_by_id, reviewed_at,
   last_edited_by_id, last_edited_at, created_at, updated_at)
SELECT
  id, que_id, department_gu, department_en, question_gu, question_en,
  option_a_gu, option_b_gu, option_c_gu, option_d_gu,
  option_a_en, option_b_en, option_c_en, option_d_en,
  UPPER(correct_option),
  COALESCE(NULLIF(scope,''), 'GENERAL'),
  NULLIF(district,''),
  COALESCE(NULLIF(caste_category,''), 'GENERAL'),
  CASE
    WHEN UPPER(review_status) IN ('ACCEPTED','ACCEPT') THEN 'ACCEPTED'
    WHEN UPPER(review_status) IN ('REJECTED','REJECT') THEN 'REJECTED'
    ELSE 'PENDING'
  END,
  reviewed_by_id, reviewed_at, last_edited_by_id, last_edited_at,
  created_at, updated_at
FROM \`${legacyDb}\`.questions
ON DUPLICATE KEY UPDATE
  department_gu=VALUES(department_gu),
  department_en=VALUES(department_en),
  question_gu=VALUES(question_gu),
  question_en=VALUES(question_en),
  option_a_gu=VALUES(option_a_gu),
  option_b_gu=VALUES(option_b_gu),
  option_c_gu=VALUES(option_c_gu),
  option_d_gu=VALUES(option_d_gu),
  option_a_en=VALUES(option_a_en),
  option_b_en=VALUES(option_b_en),
  option_c_en=VALUES(option_c_en),
  option_d_en=VALUES(option_d_en),
  correct_option=VALUES(correct_option),
  scope=VALUES(scope),
  district=VALUES(district),
  caste_category=VALUES(caste_category),
  review_status=VALUES(review_status),
  reviewed_by_id=VALUES(reviewed_by_id),
  reviewed_at=VALUES(reviewed_at),
  last_edited_by_id=VALUES(last_edited_by_id),
  last_edited_at=VALUES(last_edited_at),
  updated_at=VALUES(updated_at);

UPDATE \`${targetDb}\`.bank_questions b
LEFT JOIN \`${targetDb}\`.admin_users a ON a.id = b.reviewed_by_id
SET b.reviewed_by_id = NULL
WHERE b.reviewed_by_id IS NOT NULL AND a.id IS NULL;

UPDATE \`${targetDb}\`.bank_questions b
LEFT JOIN \`${targetDb}\`.admin_users a ON a.id = b.last_edited_by_id
SET b.last_edited_by_id = NULL
WHERE b.last_edited_by_id IS NOT NULL AND a.id IS NULL;

INSERT INTO \`${targetDb}\`.bank_question_comments
  (id, que_id, user_id, username, body, created_at)
SELECT c.id, c.que_id, c.user_id, c.username, c.body, c.created_at
FROM \`${legacyDb}\`.question_comments c
INNER JOIN \`${targetDb}\`.bank_questions b ON b.que_id = c.que_id
INNER JOIN \`${targetDb}\`.admin_users a ON a.id = c.user_id
ON DUPLICATE KEY UPDATE
  body=VALUES(body), username=VALUES(username), user_id=VALUES(user_id);

INSERT INTO \`${targetDb}\`.bank_question_activities
  (id, que_id, user_id, username, action, detail, created_at)
SELECT c.id, c.que_id, c.user_id, c.username, c.action, c.detail, c.created_at
FROM \`${legacyDb}\`.question_activities c
INNER JOIN \`${targetDb}\`.bank_questions b ON b.que_id = c.que_id
INNER JOIN \`${targetDb}\`.admin_users a ON a.id = c.user_id
ON DUPLICATE KEY UPDATE
  action=VALUES(action), detail=VALUES(detail),
  username=VALUES(username), user_id=VALUES(user_id);

SET FOREIGN_KEY_CHECKS=1;
`);

  const [counts] = await conn.query(`
SELECT 'legacy.questions' AS src, COUNT(*) AS c FROM \`${legacyDb}\`.questions
UNION ALL SELECT 'new.bank_questions', COUNT(*) FROM \`${targetDb}\`.bank_questions
UNION ALL SELECT 'legacy.users', COUNT(*) FROM \`${legacyDb}\`.users
UNION ALL SELECT 'new.admin_users', COUNT(*) FROM \`${targetDb}\`.admin_users
UNION ALL SELECT 'new.comments', COUNT(*) FROM \`${targetDb}\`.bank_question_comments
UNION ALL SELECT 'new.activities', COUNT(*) FROM \`${targetDb}\`.bank_question_activities
`);

  console.table(counts);
  console.log('Done. Legacy database was not modified.');
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
