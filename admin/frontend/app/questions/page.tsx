"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminUserItem,
  api,
  DashboardStats,
  getRole,
  getToken,
  QuestionListItem,
  QuestionListResponse,
} from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";
import { ReviewStatusBadge } from "@/components/QuestionDetail";
import { QuestionReviewModal } from "@/components/QuestionReviewModal";

const PAGE_SIZE = 20;

export default function QuestionsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [items, setItems] = useState<QuestionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [correctOption, setCorrectOption] = useState("");
  const [reviewStatus, setReviewStatus] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [filtersReady, setFiltersReady] = useState(false);
  const [reviewers, setReviewers] = useState<AdminUserItem[]>([]);
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    const s = await api<DashboardStats>("/api/v1/admin/stats");
    setStats(s);
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
        language,
        review_status: reviewStatus,
      });
      if (query.trim()) params.set("q", query.trim());
      if (correctOption) params.set("correct_option", correctOption);
      if (assignedTo && assignedTo !== "all") params.set("assigned_to", assignedTo);
      const data = await api<QuestionListResponse>(
        `/api/v1/admin/questions?${params}`
      );
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, query, language, correctOption, reviewStatus, assignedTo]);

  useEffect(() => {
    if (!getToken()) return;
    const currentRole = getRole() || "admin";
    setRole(currentRole);
    const params = new URLSearchParams(window.location.search);
    const assigned = params.get("assigned");
    const review = params.get("review_status");
    if (assigned) setAssignedTo(assigned);
    else if (currentRole !== "master") setAssignedTo("mine");
    if (review) setReviewStatus(review);
    else if (currentRole !== "master" && !assigned) setReviewStatus("PENDING");
    if (currentRole === "master") {
      api<{ items: AdminUserItem[] }>("/api/v1/admin/users")
        .then((data) =>
          setReviewers(data.items.filter((u) => u.role === "admin"))
        )
        .catch(() => undefined);
    }
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    if ((getRole() || "admin") === "master") {
      loadStats().catch(console.error);
    }
  }, [loadStats]);

  useEffect(() => {
    if (!getToken() || !filtersReady) return;
    loadQuestions();
  }, [filtersReady, loadQuestions]);

  function onSearch() {
    setPage(1);
    setQuery(searchInput.trim());
  }

  function refreshAfterChange() {
    loadQuestions();
    loadStats().catch(console.error);
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isMaster = role === "master";

  return (
    <AdminShell title="Question Bank">
      {isMaster ? (
      <section className="stats-row">
        <article>
          <span>Total</span>
          <strong>{stats ? stats.total_questions.toLocaleString() : "—"}</strong>
        </article>
        <article>
          <span>Pending</span>
          <strong>{stats?.review_pending?.toLocaleString() ?? "—"}</strong>
        </article>
        <article>
          <span>Accepted</span>
          <strong>{stats?.review_accepted?.toLocaleString() ?? "—"}</strong>
        </article>
        <article>
          <span>Rejected</span>
          <strong>{stats?.review_rejected?.toLocaleString() ?? "—"}</strong>
        </article>
      </section>
      ) : null}

      <section className={`toolbar bank-toolbar ${isMaster ? "with-assign" : "reviewer-toolbar"}`}>
        <input
          type="search"
          placeholder="Search ID, question, department…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
        />
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All languages</option>
          <option value="both">Bilingual only</option>
          <option value="gu_only">Gujarati only</option>
          <option value="en_only">English only</option>
        </select>
        <select
          value={reviewStatus}
          onChange={(e) => {
            setReviewStatus(e.target.value);
            setPage(1);
          }}
        >
          {isMaster ? (
            <>
              <option value="all">All review status</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </>
          ) : (
            <>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted by me</option>
              <option value="REJECTED">Rejected by me</option>
            </>
          )}
        </select>
        {isMaster ? (
          <>
        <select
          value={assignedTo}
          onChange={(e) => {
            setAssignedTo(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All assignments</option>
          <option value="mine">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
          {reviewers.map((u) => (
            <option key={u.id} value={String(u.id)}>
              Assigned to {u.full_name || u.username}
            </option>
          ))}
        </select>
        <select
          value={correctOption}
          onChange={(e) => {
            setCorrectOption(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Any answer</option>
          <option value="A">Correct A</option>
          <option value="B">Correct B</option>
          <option value="C">Correct C</option>
          <option value="D">Correct D</option>
        </select>
          </>
        ) : null}
        <button type="button" onClick={onSearch}>
          Search
        </button>
      </section>

      <section className="table-wrap">
        <table className="q-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Question</th>
              <th>Status</th>
              <th>Ans</th>
              {isMaster ? (
                <>
                  <th>Assigned</th>
                  <th>Reviewed by</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isMaster ? 6 : 4}>Loading…</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={isMaster ? 6 : 4}>{error}</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={isMaster ? 6 : 4}>No questions found.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.que_id} onClick={() => setSelectedId(item.que_id)}>
                  <td className="qid">{item.que_id}</td>
                  <td>
                    <div className="q-preview">
                      {item.question_en || item.question_gu || "—"}
                    </div>
                  </td>
                  <td>
                    <ReviewStatusBadge status={item.review_status} />
                  </td>
                  <td className="ans">{item.correct_option || "—"}</td>
                  {isMaster ? (
                    <>
                      <td>{item.assigned_to_username || "—"}</td>
                      <td className="reviewed-by">
                        {item.reviewed_by_username || "—"}
                      </td>
                    </>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <nav className="pager">
        <button
          type="button"
          className="ghost"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <span>
          Page {page} / {pages} · {total.toLocaleString()} questions
        </span>
        <button
          type="button"
          className="ghost"
          disabled={page >= pages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </nav>

      {selectedId ? (
        <QuestionReviewModal
          queId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={refreshAfterChange}
        />
      ) : null}
    </AdminShell>
  );
}
