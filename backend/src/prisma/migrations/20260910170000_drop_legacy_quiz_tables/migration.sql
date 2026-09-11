-- Drop legacy fixed-quiz tables (unused; live play uses quiz_sessions + bank_questions)

DROP TABLE IF EXISTS `attempt_answers`;
DROP TABLE IF EXISTS `attempts`;
DROP TABLE IF EXISTS `explanations`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `quizzes`;
