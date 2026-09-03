"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { QuestionReviewModal } from "@/components/QuestionReviewModal";
import {
  api,
  getRole,
  getToken,
  WorkDashboard,
  WorkDayCount,
  WorkQueueItem,
  WorkReviewer,
} from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  done: "Done",
  in_progress: "In progress",
  not_started: "Not started",
  paused: "Paused",
  no_quota: "No quota",
  inactive: "Inactive",
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

function formatDayShort(ymd: string) {
  const d = new Date(`${ymd}T12:00:00+05:30`);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

function statusClass(status: string) {
  if (status === "done") return "status-badge accepted";
  if (status === "in_progress") return "status-badge pending";
  if (status === "paused" || status === "inactive") return "status-badge rejected";
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
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState("admin");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [quotaAdminId, setQuotaAdminId] = useState("");
  const [dailyQuota, setDailyQuota] = useState("50");
  const [quotaNotes, setQuotaNotes] = useState("");

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
  const activeReviewers = useMemo(
    () => reviewers.filter((r) => r.is_active),
    [reviewers]
  );

  const totals = useMemo(() => {
    return activeReviewers.reduce(
      (acc, r) => {
        acc.quota += r.daily_quota;
        acc.reviewed += r.reviewed_today;
        acc.remaining += r.remaining_today;
        return acc;
      },
      { quota: 0, reviewed: 0, remaining: 0 }
    );
  }, [activeReviewers]);

  function pickReviewer(r: WorkReviewer) {
    setQuotaAdminId(String(r.admin_id));
    setDailyQuota(String(r.daily_quota || 50));
    setQuotaNotes(r.quota_notes || "");
  }

  async function onSaveQuota(e: FormEvent) {
    e.preventDefault();
    if (!quotaAdminId) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      await api("/api/v1/admin/work/quota", {
        method: "POST",
        body: JSON.stringify({
          admin_id: Number(quotaAdminId),
          daily_quota: Number(dailyQuota),
          is_active: true,
          notes: quotaNotes || null,
        }),
      });
      setOk("Daily quota saved. Today’s questions were allocated automatically.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save quota");
    } finally {
      setSaving(false);
    }
  }

  async function toggleQuota(r: WorkReviewer, nextActive: boolean) {
    setError(null);
    setOk(null);
    try {
      await api("/api/v1/admin/work/quota", {
        method: "POST",
        body: JSON.stringify({
          admin_id: r.admin_id,
          daily_quota: r.daily_quota || 1,
          is_active: nextActive,
          notes: r.quota_notes,
        }),
      });
      setOk(nextActive ? `Resumed quota for ${r.username}` : `Paused quota for ${r.username}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  const me = data?.me;
  const remaining = me?.remaining_today ?? 0;
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
                  <p className="work-kicker">{formatDay(data.date)}</p>
                  <h2>Allocate questions to reviewers</h2>
                  <p>
                    Set how many questions each sub-admin should review each day.
                    Create accounts on the Admins page first.
                  </p>
                </div>
              </section>

              <section className="stats-row cols-4">
                <article>
                  <span>Unassigned pending</span>
                  <strong>{data.bank.unassigned_pending.toLocaleString()}</strong>
                </article>
                <article>
                  <span>Today’s target</span>
                  <strong>{totals.quota.toLocaleString()}</strong>
                </article>
                <article>
                  <span>Reviewed today</span>
                  <strong>{totals.reviewed.toLocaleString()}</strong>
                </article>
                <article>
                  <span>Remaining today</span>
                  <strong>{totals.remaining.toLocaleString()}</strong>
                </article>
              </section>

              <form className="panel-block work-quota-form" onSubmit={onSaveQuota}>
                <div className="panel-head">
                  <div>
                    <h2>Set questions / day</h2>
                    <p>Change the daily target for an existing sub-admin.</p>
                  </div>
                </div>
                <div className="work-form-grid two">
                  <label>
                    Sub-admin
                    <select
                      value={quotaAdminId}
                      onChange={(e) => setQuotaAdminId(e.target.value)}
                      required
                    >
                      <option value="">Select reviewer</option>
                      {activeReviewers.map((r) => (
                        <option key={r.admin_id} value={r.admin_id}>
                          {r.full_name || r.username}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Questions / day
                    <input
                      type="number"
                      min={1}
                      max={2000}
                      value={dailyQuota}
                      onChange={(e) => setDailyQuota(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <label>
                  Notes
                  <input
                    value={quotaNotes}
                    onChange={(e) => setQuotaNotes(e.target.value)}
                    maxLength={500}
                    placeholder="Optional — shift, subject area…"
                  />
                </label>
                <div className="form-actions">
                  <button type="submit" disabled={saving || !quotaAdminId}>
                    {saving ? "Saving…" : "Save & allocate today"}
                  </button>
                </div>
              </form>

              <section className="table-wrap">
                <table className="q-table">
                  <thead>
                    <tr>
                      <th>Reviewer</th>
                      <th>Quota</th>
                      <th>Today · {formatDayShort(data.date)}</th>
                      <th>Progress</th>
                      <th>Queue</th>
                      <th>Lifetime</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewers.length === 0 ? (
                      <tr className="no-click">
                        <td colSpan={8}>
                          No reviewers yet. Create a sub-admin on the Admins page.
                        </td>
                      </tr>
                    ) : (
                      reviewers.map((r) => (
                        <tr key={r.admin_id} className="no-click">
                          <td>
                            <div className="qid">{r.full_name || r.username}</div>
                            <div className="muted-note">{r.username}</div>
                          </td>
                          <td>{r.quota_active ? r.daily_quota : "—"}</td>
                          <td>
                            {r.reviewed_today}/{r.daily_quota || 0}
                            <div className="muted-note">
                              {r.remaining_today} left · {r.assigned_today} assigned
                            </div>
                          </td>
                          <td className="work-progress-cell">
                            <ProgressBar value={r.progress_pct} />
                            <span>{r.progress_pct}%</span>
                          </td>
                          <td>
                            {r.queue_pending}
                            {r.backlog_pending ? (
                              <div className="muted-note">{r.backlog_pending} backlog</div>
                            ) : null}
                          </td>
                          <td>
                            {r.lifetime_reviewed}
                            <div className="muted-note">
                              {r.lifetime_accepted} ok · {r.lifetime_rejected} rejected
                            </div>
                          </td>
                          <td>
                            <span className={statusClass(r.status)}>
                              {STATUS_LABEL[r.status] || r.status}
                            </span>
                          </td>
                          <td>
                            <div className="inline-actions">
                              <button
                                type="button"
                                className="ghost compact"
                                onClick={() => pickReviewer(r)}
                              >
                                Edit quota
                              </button>
                              {r.daily_quota > 0 ? (
                                <button
                                  type="button"
                                  className="ghost compact"
                                  onClick={() => toggleQuota(r, !r.quota_active)}
                                >
                                  {r.quota_active ? "Pause" : "Resume"}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </section>
            </>
          ) : (
            <>
              <section className="work-hero">
                <div>
                  <p className="work-kicker">{formatDay(data.date)}</p>
                  {me?.quota_active ? (
                    remaining > 0 ? (
                      <>
                        <h2>
                          {remaining === 1
                            ? "1 question left today"
                            : `${remaining} questions left today`}
                        </h2>
                        <p>
                          {`Daily target ${me.daily_quota} · reviewed ${me.reviewed_today} · ${me.accepted_today} accepted, ${me.rejected_today} rejected${
                            me.backlog_pending
                              ? ` · ${me.backlog_pending} leftover from earlier days`
                              : ""
                          }.`}
                        </p>
                      </>
                    ) : (
                      <>
                        <h2>Today’s reviews are complete</h2>
                        <p>
                          You reviewed {me.reviewed_today} of {me.daily_quota} for{" "}
                          {formatDay(data.date)}.
                        </p>
                      </>
                    )
                  ) : (
                    <>
                      <h2>No questions allocated yet</h2>
                      <p>Ask the master admin to set your questions / day target.</p>
                    </>
                  )}
                </div>
                <div className="work-hero-meter">
                  {me?.quota_active ? (
                    <>
                      <strong>{me.progress_pct}%</strong>
                      <span>of {formatDayShort(data.date)} target</span>
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
                  <span>Reviewed today</span>
                  <strong>{me?.reviewed_today?.toLocaleString() ?? "—"}</strong>
                </article>
                <article>
                  <span>Remaining today</span>
                  <strong>{remaining.toLocaleString()}</strong>
                </article>
                <article>
                  <span>Accepted today</span>
                  <strong>{me?.accepted_today.toLocaleString() ?? "—"}</strong>
                </article>
                <article>
                  <span>Rejected today</span>
                  <strong>{me?.rejected_today.toLocaleString() ?? "—"}</strong>
                </article>
              </section>

              <section className="panel-block">
                <div className="panel-head">
                  <div>
                    <h2>Past activity</h2>
                    <p>
                      {`All time ${me?.lifetime_reviewed ?? 0} reviewed${
                        me?.lifetime_reviewed
                          ? ` · ${me.lifetime_accepted} accepted, ${me.lifetime_rejected} rejected`
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
                    <h2>Today’s queue</h2>
                    <p>Oldest assigned pending questions first · {formatDay(data.date)}</p>
                  </div>
                  <Link href={queueHref} className="back-link">
                    Review all
                  </Link>
                </div>
                {data.my_queue.length === 0 ? (
                  <p className="empty-state">No pending questions in your queue.</p>
                ) : (
                  <ul className="work-queue">
                    {data.my_queue.slice(0, 5).map((item: WorkQueueItem) => (
                      <li key={item.que_id}>
                        <button type="button" onClick={() => setSelectedId(item.que_id)}>
                          <span className="qid">{item.que_id}</span>
                          <span>{item.question_en || item.question_gu || "—"}</span>
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
