import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { jsonSource } from "@/lib/data/sources/json.source";
import { httpSource } from "@/lib/data/sources/http.source";

/**
 * The one place that decides where data comes from.
 *
 * DataSource contract — both implementations satisfy it exactly:
 *   lookupIdentity({ role, credential })         -> User (raw)
 *   requestOtp({ role, credential, phone })      -> { id, maskedPhone, resendSeconds }
 *   verifyOtp({ id, otp, role, ... })            -> { user, token } | { needsProfile }
 *   registerCitizen({ id, name, ... })           -> { user, token }
 *   getPracticeBundle({ quizId, language })      -> { quiz, questions }
 *   getLandingSummary()                          -> { totalPlays, weeklyPlays, featuredQuizId }
 *   getMe()                                      -> User
 *   startSession({ count, language })            -> SessionMeta
 *   getSession(sessionId)                        -> SessionPlayPayload | SessionResult
 *   submitSession({ sessionId, answers, ... })   -> SessionResult
 *   getSessionResult(sessionId)                  -> SessionResult
 *   listMySessions()                             -> { participatedWeeks, currentWeek, quizSessions }
 *   getMyCurrentSession()                        -> { currentWeek, weekMeta, session }
 *   getMySessionStats()                          -> Stats
 *   clearMySessions()                            -> Stats
 *   getSchoolLeaderboard({ ... })                -> Leaderboard
 *   getCollegeLeaderboard({ ... })               -> Leaderboard
 *   getCitizenLeaderboard({ ... })               -> Leaderboard
 *   getTalukaLeaderboard({ ... })                -> Leaderboard
 */

const REGISTRY = {
  [DATA_SOURCE.JSON]: jsonSource,
  [DATA_SOURCE.REST]: httpSource,
};

export function getDataSource() {
  return REGISTRY[appConfig.dataSource] || jsonSource;
}
