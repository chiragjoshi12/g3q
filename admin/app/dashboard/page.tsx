"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { QuestionReviewModal } from "@/components/QuestionReviewModal";
import { ReviewStatusBadge } from "@/components/QuestionDetail";
import {
  api,
  formatWhen,
  getRole,
  getToken,
  WorkCommentItem,
  WorkDashboard,
  WorkDayCount,
  WorkReviewer,
} from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  done: "Done",
  in_progress: "In progress",
  not_started: "Not started",
  inactive: "Inactive",
  withdrawn: "Taken back",
};

function formatDay(ymd: string) {
  const d = new Date(`${ymd}T12:00:00+05:30`);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function statusClass(status: string) {
  if (status === "done") return "status-badge accepted";
  if (status === "in_progress") return "status-badge pending";
  if (status === "inactive" || status === "withdrawn") return "status-badge rejected";
  return "status-badge";
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="work-progress" aria-label={`${pct}% complete`}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

function ActivityTable({ days }: { days: WorkDayCount[] }) {
  const rows = [...days].reverse();
  return (
    <div className="table-wrap activity-table">
      <table className="q-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Assigned</th>
            <th>Reviewed</th>
            <th>Remaining</th>
            <th>Accepted</th>
            <th>Rejected</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((day) => (
            <tr key={day.date} className="no-click">
              <td>{formatDay(day.date)}</td>
              <td>{day.assigned}</td>
              <td>{day.reviewed}</td>
              <td>{day.remaining ?? Math.max(0, day.assigned - day.reviewed)}</td>
              <td>{day.accepted}</td>
              <td>{day.rejected}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<WorkDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [role, setRole] = useState("admin");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isMaster = role === "master";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await api<WorkDashboard>("/api/v1/admin/work/dashboard");
      setData(dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load allocation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    setRole(getRole() || "admin");
    load();
  }, [load]);

  const reviewers = data?.reviewers ?? [];

  const totals = useMemo(() => {
    return reviewers.reduce(
      (acc, r) => {
        acc.reviewed += r.reviewed;
        acc.assigned += r.assigned_total;
        return acc;
      },
      { reviewed: 0, assigned: 0 }
    );
  }, [reviewers]);

  function countFor(r: WorkReviewer) {
    return counts[r.admin_id] ?? "50";
  }

  async function allocate(r: WorkReviewer) {
    const count = Number(countFor(r));
    if (!Number.isInteger(count) || count < 1) {
      setError("Enter a valid question count.");
      return;
    }
    setSavingKey(`assign-${r.admin_id}`);
    setError(null);
    setOk(null);
    try {
      const result = await api<{
        allocation: { created: number; requested: number; available: number };
      }>("/api/v1/admin/work/allocate", {
        method: "POST",
        body: JSON.stringify({ admin_id: r.admin_id, count }),
      });
      const created = result.allocation?.created ?? 0;
      if (created === 0) {
        setOk(`No unassigned pending questions left for ${r.full_name || r.username}.`);
      } else if (created < count) {
        setOk(`Assigned ${created} of ${count} questions to ${r.full_name || r.username}.`);
      } else {
        setOk(`Assigned ${created} questions to ${r.full_name || r.username}.`);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign questions");
    } finally {
      setSavingKey(null);
    }
  }

  async function unassign(r: WorkReviewer, count: number, batchId?: number) {
    if (!Number.isInteger(count) || count < 1) {
      setError("Enter a valid question count.");
      return;
    }
    setSavingKey(batchId ? `batch-${batchId}` : `unassign-${r.admin_id}`);
    setError(null);
    setOk(null);
    try {
      const result = await api<{
        allocation: { released: number; requested: number };
      }>("/api/v1/admin/work/unassign", {
        method: "POST",
        body: JSON.stringify({
          admin_id: r.admin_id,
          count,
          ...(batchId ? { batch_id: batchId } : {}),
        }),
      });
      const released = result.allocation?.released ?? 0;
      if (released === 0) {
        setOk(`No pending questions left to take back from ${r.full_name || r.username}.`);
      } else if (released < count) {
        setOk(`Took back ${released} of ${count} pending questions from ${r.full_name || r.username}.`);
      } else {
        setOk(`Took back ${released} pending questions from ${r.full_name || r.username}.`);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reduce assignment");
    } finally {
      setSavingKey(null);
    }
  }

  const me = data?.me;
  const remaining = me?.remaining ?? 0;
  const queueHref = "/questions?assigned=mine";

  return (
    <AdminShell title={isMaster ? "Questions Allocation" : "My work"}>
      {loading && !data ? <p className="empty-state">Loading…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {ok ? <p className="form-ok">{ok}</p> : null}

      {data ? (
        <>
          {data.warnings?.length
            ? data.warnings.map((w) => (
                <p key={w} className="work-warning">
                  {w}
                </p>
              ))
            : null}

          {isMaster ? (
            <>
              <section className="work-hero master">
                <div>
                  <h2>Allocate questions to reviewers</h2>
                  <p>
                    Assign a batch of pending questions to any sub-admin. There is no daily
                    limit — they keep the queue until it is reviewed.
                  </p>
                </div>
              </section>

              <section className="stats-row cols-3">
                <article>
                  <span>Unassigned pending</span>
                  <strong>{data.bank.unassigned_pending.toLocaleString()}</strong>
                </article>
                <article>
                  <span>Assigned</span>
                  <strong>{totals.assigned.toLocaleString()}</strong>
                </article>
                <article>
                  <span>Reviewed</span>
                  <strong>{totals.reviewed.toLocaleString()}</strong>
                </article>
              </section>

              <section className="table-wrap">
                <table className="q-table">
                  <thead>
                    <tr>
                      <th>Reviewer</th>
                      <th>Assigned</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Assign questions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewers.length === 0 ? (
                      <tr className="no-click">
                        <td colSpan={5}>
                          No reviewers yet. Create a sub-admin on the Admins page.
                        </td>
                      </tr>
                    ) : (
                      reviewers.map((r) => {
                        const open = expandedId === r.admin_id;
                        const history = r.assignment_history ?? [];
                        return (
                          <Fragment key={r.admin_id}>
                            <tr className="no-click">
                              <td>
                                <button
                                  type="button"
                                  className={`reviewer-expand${open ? " open" : ""}`}
                                  onClick={() =>
                                    setExpandedId(open ? null : r.admin_id)
                                  }
                                  aria-expanded={open}
                                >
                                  <span className="qid">{r.full_name || r.username}</span>
                                  <span className="muted-note">{r.username}</span>
                                </button>
                              </td>
                              <td>
                                {r.assigned_total}
                                <div className="muted-note">
                                  {r.remaining} left · {r.reviewed} reviewed
                                </div>
                              </td>
                              <td className="work-progress-cell">
                                <ProgressBar value={r.progress_pct} />
                                <span>{r.progress_pct}%</span>
                              </td>
                              <td>
                                <span className={statusClass(r.status)}>
                                  {STATUS_LABEL[r.status] || r.status}
                                </span>
                              </td>
                              <td>
                                <div className="work-assign-cell">
                                  <input
                                    type="number"
                                    min={1}
                                    max={2000}
                                    value={countFor(r)}
                                    disabled={!r.is_active || !!savingKey}
                                    onChange={(e) =>
                                      setCounts((prev) => ({
                                        ...prev,
                                        [r.admin_id]: e.target.value,
                                      }))
                                    }
                                    aria-label={`Questions to assign to ${r.full_name || r.username}`}
                                  />
                                  <button
                                    type="button"
                                    className="compact"
                                    disabled={!r.is_active || !!savingKey}
                                    onClick={() => allocate(r)}
                                  >
                                    {savingKey === `assign-${r.admin_id}` ? "Assigning…" : "Assign"}
                                  </button>
                                  <button
                                    type="button"
                                    className="ghost compact"
                                    disabled={!r.is_active || !!savingKey || r.remaining < 1}
                                    onClick={() => unassign(r, Number(countFor(r)))}
                                  >
                                    {savingKey === `unassign-${r.admin_id}` ? "Reducing…" : "Reduce"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {open ? (
                              <tr className="no-click work-history-row">
                                <td colSpan={5}>
                                  {history.length === 0 ? (
                                    <p className="muted-note">No assignment history yet.</p>
                                  ) : (
                                    <table className="q-table work-history-table">
                                      <thead>
                                        <tr>
                                          <th>When</th>
                                          <th>Assigned</th>
                                          <th>Left</th>
                                          <th>Status</th>
                                          <th />
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {history.map((batch) => (
                                          <tr key={batch.id} className="no-click">
                                            <td>{formatWhen(batch.created_at)}</td>
                                            <td>{batch.count}</td>
                                            <td>{batch.remaining}</td>
                                            <td>
                                              <span className={statusClass(batch.status)}>
                                                {STATUS_LABEL[batch.status] || batch.status}
                                              </span>
                                            </td>
                                            <td>
                                              {batch.remaining > 0 ? (
                                                <button
                                                  type="button"
                                                  className="ghost compact"
                                                  disabled={!!savingKey}
                                                  onClick={() =>
                                                    unassign(r, batch.remaining, batch.id)
                                                  }
                                                >
                                                  {savingKey === `batch-${batch.id}`
                                                    ? "Reducing…"
                                                    : "Reduce"}
                                                </button>
                                              ) : null}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </section>
            </>
          ) : (
            <>
              <section className="work-hero">
                <div>
                  {remaining > 0 ? (
                    <>
                      <h2>
                        {remaining === 1
                          ? "1 question left"
                          : `${remaining} questions left`}
                      </h2>
                      <p>
                        {`Assigned ${me?.assigned_total ?? 0} · reviewed ${me?.reviewed ?? 0} · ${me?.accepted ?? 0} accepted, ${me?.rejected ?? 0} rejected.`}
                      </p>
                    </>
                  ) : me?.assigned_total ? (
                    <>
                      <h2>Your queue is clear</h2>
                      <p>
                        You reviewed {me.reviewed} assigned questions
                        {me.accepted || me.rejected
                          ? ` · ${me.accepted} accepted, ${me.rejected} rejected`
                          : ""}
                        .
                      </p>
                    </>
                  ) : (
                    <>
                      <h2>No questions allocated yet</h2>
                      <p>Ask the master admin to assign you a batch of questions.</p>
                    </>
                  )}
                </div>
                <div className="work-hero-meter">
                  {me?.assigned_total ? (
                    <>
                      <strong>{me.progress_pct}%</strong>
                      <span>of assigned work</span>
                      <ProgressBar value={me.progress_pct} />
                    </>
                  ) : null}
                  <Link href={queueHref} className="work-cta">
                    {remaining > 0 ? "Start reviewing" : "Open my queue"}
                  </Link>
                </div>
              </section>

              <section className="stats-row cols-4">
                <article>
                  <span>Remaining</span>
                  <strong>{remaining.toLocaleString()}</strong>
                </article>
                <article>
                  <span>Reviewed</span>
                  <strong>{me?.reviewed?.toLocaleString() ?? "—"}</strong>
                </article>
                <article>
                  <span>Accepted</span>
                  <strong>{me?.accepted.toLocaleString() ?? "—"}</strong>
                </article>
                <article>
                  <span>Rejected</span>
                  <strong>{me?.rejected.toLocaleString() ?? "—"}</strong>
                </article>
              </section>

              <section className="panel-block">
                <div className="panel-head">
                  <div>
                    <h2>Past activity</h2>
                    <p>
                      {`All time ${me?.reviewed ?? 0} reviewed${
                        me?.reviewed
                          ? ` · ${me.accepted} accepted, ${me.rejected} rejected`
                          : ""
                      }.`}
                    </p>
                  </div>
                </div>
                {(data.recent_days ?? []).length === 0 ? (
                  <p className="empty-state">No assigned questions yet.</p>
                ) : (
                  <ActivityTable days={data.recent_days ?? []} />
                )}
              </section>

              <section className="panel-block">
                <div className="panel-head">
                  <div>
                    <h2>Your comments</h2>
                    <p>Questions where you left a review note</p>
                  </div>
                </div>
                {(data.my_comments ?? []).length === 0 ? (
                  <p className="empty-state">You have not commented on any questions yet.</p>
                ) : (
                  <ul className="work-comments">
                    {(data.my_comments ?? []).map((item: WorkCommentItem) => (
                      <li key={item.que_id}>
                        <button type="button" onClick={() => setSelectedId(item.que_id)}>
                          <div className="work-comment-top">
                            <span className="qid">{item.que_id}</span>
                            <ReviewStatusBadge status={item.review_status} />
                          </div>
                          <p className="work-comment-question">
                            {item.question_en || item.question_gu || "—"}
                          </p>
                          <blockquote>{item.latest_comment.body}</blockquote>
                          <p className="work-comment-meta">
                            {item.comment_count === 1
                              ? "1 comment"
                              : `${item.comment_count} comments`}
                            {item.latest_comment.created_at
                              ? ` · ${formatWhen(item.latest_comment.created_at)}`
                              : ""}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </>
      ) : null}

      {selectedId ? (
        <QuestionReviewModal
          queId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      ) : null}
    </AdminShell>
  );
}
