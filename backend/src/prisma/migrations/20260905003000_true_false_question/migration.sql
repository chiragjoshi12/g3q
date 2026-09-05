-- AlterTable
ALTER TABLE `questions` MODIFY `type` ENUM('single_choice', 'true_false', 'match_following', 'image_choice', 'drag_drop', 'drag_into_blanks') NOT NULL;

-- AlterTable
ALTER TABLE `attempt_answers` MODIFY `type` ENUM('single_choice', 'true_false', 'match_following', 'image_choice', 'drag_drop', 'drag_into_blanks') NOT NULL;
