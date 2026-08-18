"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SignupFormState = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
};

export function SignupForm() {
  const [form, setForm] = useState<SignupFormState>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: ""
  });
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName || form.email.split("@")[0],
            role: "manager"
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Account created. Check your email to confirm your signup, then sign in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        <span>Full name</span>
        <input
          type="text"
          value={form.fullName}
          onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          placeholder="Avery Cole"
          autoComplete="name"
          required
        />
      </label>

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
          placeholder="Create a password"
          autoComplete="new-password"
          required
        />
      </label>

      <label>
        <span>Confirm password</span>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
          placeholder="Confirm your password"
          autoComplete="new-password"
          required
        />
      </label>

      <button className="primary-button wide" type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </button>

      <p className="form-links">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>

      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
