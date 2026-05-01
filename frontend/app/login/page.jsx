"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function LoginForm() {
  const router = useRouter();
  const { login, isAuthed, ready } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && isAuthed) router.replace("/");
  }, [ready, isAuthed, router]);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.username, form.password);
      router.replace("/");
    } catch {
      setError("Invalid credentials or API unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card stack" onSubmit={onSubmit}>
        <div>
          <div className="title">PMDM Console</div>
          <div className="subtle">Sign in to manage macOS fleets</div>
        </div>
        <div>
          <label>Username</label>
          <input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} required />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
        </div>
        {error ? <div style={{ color: "#ffb4b4" }}>{error}</div> : null}
        <button className="btn primary" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
