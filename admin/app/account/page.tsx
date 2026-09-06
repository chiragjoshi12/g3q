"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { AdminProfile, api, clearAuth } from "@/lib/api";

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
  }, []);

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

  function logout() {
    clearAuth();
    router.replace("/login");
  }

  const roleLabel =
    profile?.role === "master" ? "Master Admin" : profile ? "Admin" : "—";

  return (
    <AdminShell title="Account">
      <section className="account-layout">
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
                University/College
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
                <button type="button" className="ghost" onClick={logout}>
                  Log out
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
