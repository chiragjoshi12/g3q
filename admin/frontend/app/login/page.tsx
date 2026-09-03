"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, LoginResponse, setAuth } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/analytics");
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<LoginResponse>(
        "/api/v1/admin/login",
        {
          method: "POST",
          body: JSON.stringify({ username, password }),
        },
        false
      );
      setAuth(data.access_token, data.username, data.role);
      router.replace("/analytics");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="brand-mark">G3Q</p>
        <h1>Gujarat Gyan Guru Quiz</h1>
        <p className="lede">Admin console for bilingual question review.</p>
        <form className="login-form" onSubmit={onSubmit}>
          <label>
            Username
            <input
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
