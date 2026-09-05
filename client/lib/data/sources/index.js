import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { jsonSource } from "@/lib/data/sources/json.source";
import { httpSource } from "@/lib/data/sources/http.source";

/**
 * The one place that decides where data comes from.
 *
 * DataSource contract — both implementations satisfy it exactly:
 *   lookupIdentity({ role, credential })         -> User (raw)
 *   requestOtp({ role, credential, phone })      -> { requestId, maskedPhone, resendSeconds }
 *   verifyOtp({ requestId, otp, role, ... })     -> { user, token } | { needsProfile }
 *   registerCitizen({ requestId, name, district, taluka }) -> { user, token }
 *   listQuizzes()                             -> Quiz[]
 *   getQuizById(quizId)                       -> Quiz
 *   getQuestionsByQuizId(quizId)              -> Question[]
 *   getExplanationsByQuizId(quizId)           -> Record<questionId, Explanation>
 */

const REGISTRY = {
  [DATA_SOURCE.JSON]: jsonSource,
  [DATA_SOURCE.REST]: httpSource,
};

export function getDataSource() {
  return REGISTRY[appConfig.dataSource] || jsonSource;
}
