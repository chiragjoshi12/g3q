"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ReviewStatusBadge } from "@/components/QuestionDetail";
import {
  api,
  formatWhen,
  QuestionDetail,
  QuestionUpdatePayload,
} from "@/lib/api";

type EditForm = {
  question_gu: string;
  question_en: string;
  option_a_gu: string;
  option_b_gu: string;
  option_c_gu: string;
  option_d_gu: string;
  option_a_en: string;
  option_b_en: string;
  option_c_en: string;
  option_d_en: string;
  correct_option: string;
};

function toForm(item: QuestionDetail): EditForm {
  return {
    question_gu: item.question_gu || "",
    question_en: item.question_en || "",
    option_a_gu: item.option_a_gu || "",
    option_b_gu: item.option_b_gu || "",
    option_c_gu: item.option_c_gu || "",
    option_d_gu: item.option_d_gu || "",
    option_a_en: item.option_a_en || "",
    option_b_en: item.option_b_en || "",
    option_c_en: item.option_c_en || "",
    option_d_en: item.option_d_en || "",
    correct_option: item.correct_option || "",
  };
}

function OptionRow({
  letter,
  text,
  correct,
}: {
  letter: string;
  text: string | null;
  correct: string | null;
}) {
  const isCorrect = letter === correct;
  return (
    <div className={isCorrect ? "opt correct" : "opt"}>
      <strong>{letter}.</strong> {text || "—"}
    </div>
  );
}

export function QuestionReviewModal({
  queId,
  onClose,
  onChanged,
}: {
  queId: string;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [item, setItem] = useState<QuestionDetail | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<QuestionDetail>(
        `/api/v1/admin/questions/${encodeURIComponent(queId)}`
      );
      setItem(data);
      setForm(toForm(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queId]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function setField<K extends keyof EditForm>(key: K, value: string) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const payload: QuestionUpdatePayload = { ...form };
      const updated = await api<QuestionDetail>(
        `/api/v1/admin/questions/${encodeURIComponent(queId)}`,
        { method: "PATCH", body: JSON.stringify(payload) }
      );
      setItem(updated);
      setForm(toForm(updated));
      setEditing(false);
      setOk("Changes saved");
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onReview(action: "ACCEPTED" | "REJECTED") {
    setBusyAction(action);
    setError(null);
    setOk(null);
    try {
      const updated = await api<QuestionDetail>(
        `/api/v1/admin/questions/${encodeURIComponent(queId)}/review`,
        {
          method: "POST",
          body: JSON.stringify({ action }),
        }
      );
      setItem(updated);
      setForm(toForm(updated));
      setOk(action === "ACCEPTED" ? "Question accepted" : "Question rejected");
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setBusyAction(null);
    }
  }

  async function onComment(e: FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setBusyAction("comment");
    setError(null);
    setOk(null);
    try {
      await api(`/api/v1/admin/questions/${encodeURIComponent(queId)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      setCommentBody("");
      setOk("Comment added");
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comment failed");
    } finally {
      setBusyAction(null);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-panel question-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="dialog-head">
          <div>
            <p className="modal-kicker">Question review</p>
            <h2 id="question-modal-title">{queId}</h2>
          </div>
          <div className="modal-head-actions">
            {item ? <ReviewStatusBadge status={item.review_status} /> : null}
            {item && !loading && !editing ? (
              <button
                type="button"
                className="ghost compact"
                disabled={!!busyAction}
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            ) : null}
            <button type="button" className="ghost compact" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        <div className="modal-body">
          {loading ? <p className="muted-note">Loading…</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          {ok ? <p className="form-ok">{ok}</p> : null}

          {item && !loading ? (
            <>
              <div className="attr-grid compact modal-meta">
                <div>
                  <span>Reviewed by</span>
                  <strong>
                    {item.reviewed_by_username
                      ? `${item.reviewed_by_username} · ${formatWhen(item.reviewed_at)}`
                      : "Not reviewed yet"}
                  </strong>
                </div>
                <div>
                  <span>Last edited by</span>
                  <strong>
                    {item.last_edited_by_username
                      ? `${item.last_edited_by_username} · ${formatWhen(item.last_edited_at)}`
                      : "No edits yet"}
                  </strong>
                </div>
              </div>

              {editing && form ? (
                <form className="clean-edit" onSubmit={onSaveEdit}>
                  <div className="lang-grid">
                    <section className="lang-card edit-card">
                      <h3>Gujarati</h3>
                      <label>
                        Question
                        <textarea
                          rows={3}
                          value={form.question_gu}
                          onChange={(e) =>
                            setField("question_gu", e.target.value)
                          }
                        />
                      </label>
                      {(["a", "b", "c", "d"] as const).map((letter) => {
                        const key = `option_${letter}_gu` as const;
                        return (
                          <label key={key}>
                            Option {letter.toUpperCase()}
                            <input
                              value={form[key]}
                              onChange={(e) => setField(key, e.target.value)}
                            />
                          </label>
                        );
                      })}
                    </section>

                    <section className="lang-card edit-card">
                      <h3>English</h3>
                      <label>
                        Question
                        <textarea
                          rows={3}
                          value={form.question_en}
                          onChange={(e) =>
                            setField("question_en", e.target.value)
                          }
                        />
                      </label>
                      {(["a", "b", "c", "d"] as const).map((letter) => {
                        const key = `option_${letter}_en` as const;
                        return (
                          <label key={key}>
                            Option {letter.toUpperCase()}
                            <input
                              value={form[key]}
                              onChange={(e) => setField(key, e.target.value)}
                            />
                          </label>
                        );
                      })}
                    </section>
                  </div>

                  <label className="correct-option-field">
                    Correct option
                    <select
                      value={form.correct_option}
                      onChange={(e) =>
                        setField("correct_option", e.target.value)
                      }
                    >
                      <option value="">—</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </label>

                  <div className="review-actions">
                    <button type="submit" disabled={saving}>
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      className="ghost compact"
                      onClick={() => {
                        setEditing(false);
                        setForm(toForm(item));
                      }}
                    >
                      Cancel edit
                    </button>
                  </div>
                </form>
              ) : (
                <div className="lang-grid">
                  <section className="lang-card">
                    <h3>Gujarati</h3>
                    <p>{item.question_gu || "Not available"}</p>
                    <div className="options">
                      <OptionRow
                        letter="A"
                        text={item.option_a_gu}
                        correct={item.correct_option}
                      />
                      <OptionRow
                        letter="B"
                        text={item.option_b_gu}
                        correct={item.correct_option}
                      />
                      <OptionRow
                        letter="C"
                        text={item.option_c_gu}
                        correct={item.correct_option}
                      />
                      <OptionRow
                        letter="D"
                        text={item.option_d_gu}
                        correct={item.correct_option}
                      />
                    </div>
                    <p className="correct-text">
                      Correct: <strong>{item.correct_answer_gu || "—"}</strong>
                    </p>
                  </section>
                  <section className="lang-card">
                    <h3>English</h3>
                    <p>{item.question_en || "Not available"}</p>
                    <div className="options">
                      <OptionRow
                        letter="A"
                        text={item.option_a_en}
                        correct={item.correct_option}
                      />
                      <OptionRow
                        letter="B"
                        text={item.option_b_en}
                        correct={item.correct_option}
                      />
                      <OptionRow
                        letter="C"
                        text={item.option_c_en}
                        correct={item.correct_option}
                      />
                      <OptionRow
                        letter="D"
                        text={item.option_d_en}
                        correct={item.correct_option}
                      />
                    </div>
                    <p className="correct-text">
                      Correct: <strong>{item.correct_answer_en || "—"}</strong>
                    </p>
                  </section>
                </div>
              )}

              <section className="modal-section comments-block">
                <div className="section-head">
                  <h3>Comments</h3>
                  <p>Use comments to flag issues or leave review notes for other admins.</p>
                </div>
                <form className="comment-form" onSubmit={onComment}>
                  <textarea
                    rows={3}
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Describe the issue or feedback…"
                    required
                  />
                  <button type="submit" disabled={busyAction === "comment"}>
                    {busyAction === "comment" ? "Posting…" : "Add comment"}
                  </button>
                </form>
                <ul className="comment-list">
                  {(item.comments || []).length === 0 ? (
                    <li className="muted-note">No comments yet.</li>
                  ) : (
                    (item.comments || []).map((c) => (
                      <li key={c.id}>
                        <div className="comment-meta">
                          <strong>{c.username}</strong>
                          <span>{formatWhen(c.created_at)}</span>
                        </div>
                        <p>{c.body}</p>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </>
          ) : null}
        </div>

        {item && !loading ? (
          <footer className="modal-foot">
            <p className="modal-foot-hint">
              Accept when the question is ready for the bank, or reject if it needs rework.
            </p>
            <div className="review-actions modal-foot-actions">
              <button
                type="button"
                className="btn-accept"
                disabled={!!busyAction || editing}
                onClick={() => onReview("ACCEPTED")}
              >
                {busyAction === "ACCEPTED" ? "Saving…" : "Accept"}
              </button>
              <button
                type="button"
                className="btn-reject"
                disabled={!!busyAction || editing}
                onClick={() => onReview("REJECTED")}
              >
                {busyAction === "REJECTED" ? "Saving…" : "Reject"}
              </button>
            </div>
          </footer>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
