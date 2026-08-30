export type LoginResponse = {
  access_token: string;
  token_type: string;
  username: string;
  role: string;
  full_name?: string | null;
  university?: string | null;
  mobile_number?: string | null;
};

export type AdminProfile = {
  username: string;
  role: string;
  full_name: string | null;
  university: string | null;
  mobile_number: string | null;
};

export type AdminUserItem = {
  id: number;
  username: string;
  role: string;
  full_name: string | null;
  university: string | null;
  mobile_number: string | null;
  is_active: boolean;
  created_at: string | null;
};

export type DashboardStats = {
  total_questions: number;
  with_gujarati: number;
  with_english: number;
  bilingual: number;
  gu_only: number;
  en_only: number;
  enhance_pending?: number;
  enhance_done?: number;
  rewritten?: number;
  review_pending?: number;
  review_accepted?: number;
  review_rejected?: number;
};

export type ReviewStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type QuestionListItem = {
  id: number;
  que_id: string;
  department_en: string | null;
  department_gu: string | null;
  question_en: string | null;
  question_gu: string | null;
  correct_option: string | null;
  has_gujarati: number;
  has_english: number;
  source_set: string | null;
  source_q_no: string | null;
  scope?: string | null;
  district?: string | null;
  caste_category?: string | null;
  enhance_status?: string | null;
  was_rewritten?: number;
  review_status?: ReviewStatus | string;
  reviewed_by_username?: string | null;
  reviewed_at?: string | null;
  last_edited_by_username?: string | null;
  last_edited_at?: string | null;
};

export type QuestionCommentItem = {
  id: number;
  que_id: string;
  user_id: number;
  username: string;
  body: string;
  created_at: string | null;
};

export type QuestionActivityItem = {
  id: number;
  que_id: string;
  user_id: number;
  username: string;
  action: string;
  detail: string | null;
  created_at: string | null;
};

export type QuestionDetail = QuestionListItem & {
  option_a_gu: string | null;
  option_b_gu: string | null;
  option_c_gu: string | null;
  option_d_gu: string | null;
  option_a_en: string | null;
  option_b_en: string | null;
  option_c_en: string | null;
  option_d_en: string | null;
  correct_answer_gu: string | null;
  correct_answer_en: string | null;
  rewrite_reason?: string | null;
  comments?: QuestionCommentItem[];
  activities?: QuestionActivityItem[];
};

export type QuestionUpdatePayload = {
  department_gu?: string | null;
  department_en?: string | null;
  question_gu?: string | null;
  question_en?: string | null;
  option_a_gu?: string | null;
  option_b_gu?: string | null;
  option_c_gu?: string | null;
  option_d_gu?: string | null;
  option_a_en?: string | null;
  option_b_en?: string | null;
  option_c_en?: string | null;
  option_d_en?: string | null;
  correct_answer_gu?: string | null;
  correct_answer_en?: string | null;
  correct_option?: string | null;
  scope?: string | null;
  district?: string | null;
  caste_category?: string | null;
};

export type QuestionListResponse = {
  total: number;
  page: number;
  page_size: number;
  items: QuestionListItem[];
};

export type AnalyticsGeoItem = {
  label: string;
  school_id?: string | null;
  institute?: string | null;
  registered_students: number;
  students_played: number;
  sessions_completed: number;
  questions_attempted: number;
  questions_correct: number;
  avg_percentage: number;
  play_rate_pct: number;
};

export type AnalyticsWeeklyItem = {
  year_week: string;
  week_start: string;
  sessions_completed: number;
  students_played: number;
  questions_attempted: number;
  avg_percentage: number;
};

export type AnalyticsCasteItem = {
  caste_category: string;
  registered_students: number;
  students_played: number;
  sessions_completed: number;
  questions_attempted: number;
  questions_correct: number;
  avg_percentage: number;
  play_rate_pct: number;
};

export type AnalyticsDashboard = {
  overview: {
    total_students: number;
    students_played: number;
    students_not_played: number;
    play_rate_pct: number;
    sessions_completed: number;
    questions_attempted: number;
    questions_correct: number;
    questions_wrong: number;
    accuracy_pct: number;
    avg_percentage: number;
    best_percentage: number;
    total_time_ms: number;
    avg_time_per_session_ms: number;
  };
  bank: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
  by_district: AnalyticsGeoItem[];
  by_taluka: AnalyticsGeoItem[];
  by_school: AnalyticsGeoItem[];
  weekly: AnalyticsWeeklyItem[];
  by_caste: AnalyticsCasteItem[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("g3q_token");
}

export function setAuth(token: string, username: string, role?: string) {
  localStorage.setItem("g3q_token", token);
  localStorage.setItem("g3q_user", username);
  if (role) localStorage.setItem("g3q_role", role);
}

export function clearAuth() {
  localStorage.removeItem("g3q_token");
  localStorage.removeItem("g3q_user");
  localStorage.removeItem("g3q_role");
}

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("g3q_user");
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("g3q_role");
}

export function isMaster(): boolean {
  return getRole() === "master";
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && auth) {
    clearAuth();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((d: { msg?: string }) => d.msg).join(", ")
          : typeof data.message === "string"
            ? data.message
            : "Request failed";
    throw new Error(detail);
  }
  return data as T;
}

export function formatWhen(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}
