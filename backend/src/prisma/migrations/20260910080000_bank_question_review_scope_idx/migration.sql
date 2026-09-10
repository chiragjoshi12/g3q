-- Speed up ACCEPTED + scope filters used by session question allocation.
CREATE INDEX `bank_questions_review_status_scope_idx` ON `bank_questions`(`review_status`, `scope`);
