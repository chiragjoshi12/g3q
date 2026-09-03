"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { AdminProfile, api, getRole } from "@/lib/api";

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (getRole() && getRole() !== "master") {
      router.replace("/dashboard");
      return;
    }
    api<AdminProfile>("/api/v1/admin/me")
      .then((data) => {
        setProfile(data);
        setFullName(data.full_name || "");
        setUniversity(data.university || "");
        setMobile(data.mobile_number || "");
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load profile")
      )
      .finally(() => setLoading(false));
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await api<AdminProfile>("/api/v1/admin/me", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: fullName,
          university,
          mobile_number: mobile,
        }),
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const roleLabel =
    profile?.role === "master" ? "Master Admin" : profile ? "Admin" : "—";

  return (
    <AdminShell title="Account">
      <section className="account-layout">
        <aside className="account-summary">
          {loading || !profile ? (
            <p className="muted-note">Loading profile…</p>
          ) : (
            <>
              <div className="account-avatar">
                {(profile.full_name || profile.username || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <h2>{profile.full_name || profile.username}</h2>
              <p className="account-role">{roleLabel}</p>
              <dl className="account-meta">
                <div>
                  <dt>Username</dt>
                  <dd>{profile.username}</dd>
                </div>
                <div>
                  <dt>University</dt>
                  <dd>{profile.university || "—"}</dd>
                </div>
                <div>
                  <dt>Mobile</dt>
                  <dd>{profile.mobile_number || "—"}</dd>
                </div>
              </dl>
            </>
          )}
        </aside>

        <section className="account-panel">
          <div className="panel-head">
            <div>
              <h2>Profile details</h2>
              <p>Keep your contact information up to date.</p>
            </div>
          </div>
          {loading ? (
            <p className="muted-note">Loading…</p>
          ) : (
            <form className="login-form account-form" onSubmit={onSubmit}>
              <div className="field-row">
                <label>
                  Username
                  <input value={profile?.username || ""} disabled readOnly />
                </label>
                <label>
                  Role
                  <input value={roleLabel} disabled readOnly />
                </label>
              </div>
              <label>
                Full name
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={128}
                />
              </label>
              <label>
                University
                <input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  required
                  maxLength={255}
                />
              </label>
              <label>
                Mobile number
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  inputMode="tel"
                  maxLength={20}
                />
              </label>
              <div className="form-actions">
                <button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                {error ? <p className="form-error">{error}</p> : null}
                {saved ? <p className="form-ok">Saved</p> : null}
              </div>
            </form>
          )}
        </section>
      </section>
    </AdminShell>
  );
}
