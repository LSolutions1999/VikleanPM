"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LoginFormState = {
  email: string;
  password: string;
};

export function LoginForm() {
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(form);
      if (error) {
        setMessage(error.message);
      } else {
        window.location.href = "/properties";
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        <span>Email</span>
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="name@company.com"
          autoComplete="email"
          required
        />
      </label>

      <label>
        <span>Password</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
      </label>

      <button className="primary-button wide" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>

      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
