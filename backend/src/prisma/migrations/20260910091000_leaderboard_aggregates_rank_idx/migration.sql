-- Ranking path: ORDER BY best_percentage DESC, total_correct DESC, total_time_ms ASC
CREATE INDEX `leaderboard_aggregates_rank_idx`
  ON `leaderboard_aggregates` (
    `week`,
    `role`,
    `taluka`,
    `best_percentage` DESC,
    `total_correct` DESC,
    `total_time_ms` ASC
  );
