"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import {
  AdminUserItem,
  api,
  getRole,
  getToken,
} from "@/lib/api";

export default function AdminsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [mobile, setMobile] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: AdminUserItem[] }>("/api/v1/admin/users");
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    if (getRole() !== "master") {
      router.replace("/questions");
      return;
    }
    load();
  }, [load, router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      await api<AdminUserItem>("/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          full_name: fullName || null,
          university: university || null,
          mobile_number: mobile || null,
        }),
      });
      setUsername("");
      setPassword("");
      setFullName("");
      setUniversity("");
      setMobile("");
      setOk("Admin account created");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: AdminUserItem) {
    setError(null);
    setOk(null);
    try {
      await api<AdminUserItem>(
        `/api/v1/admin/users/${user.id}/active?active=${!user.is_active}`,
        { method: "PATCH" }
      );
      setOk(
        user.is_active
          ? `Deactivated ${user.username}`
          : `Reactivated ${user.username}`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <AdminShell title="Admins">
      <section className="panel-block">
        <div className="panel-head">
          <div>
            <h2>Create admin</h2>
            <p>Only the master admin can add reviewer accounts.</p>
          </div>
        </div>
        <form className="login-form account-form" onSubmit={onCreate}>
          <div className="field-row">
            <label>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={64}
                autoComplete="off"
              />
            </label>
            <label>
              Temporary password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
          </div>
          <label>
            Full name
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={128}
            />
          </label>
          <div className="field-row">
            <label>
              University
              <input
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                maxLength={255}
              />
            </label>
            <label>
              Mobile
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength={20}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create admin"}
            </button>
            {error ? <p className="form-error">{error}</p> : null}
            {ok ? <p className="form-ok">{ok}</p> : null}
          </div>
        </form>
      </section>

      <section className="table-wrap">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : (
          <table className="q-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="no-click">
                  <td className="qid">{u.username}</td>
                  <td>
                    <span className="pill">{u.role}</span>
                  </td>
                  <td>{u.full_name || "—"}</td>
                  <td>
                    <span
                      className={
                        u.is_active
                          ? "status-badge accepted"
                          : "status-badge rejected"
                      }
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {u.role === "master" ? (
                      <span className="muted-note">Protected</span>
                    ) : (
                      <button
                        type="button"
                        className="ghost compact"
                        onClick={() => toggleActive(u)}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AdminShell>
  );
}
