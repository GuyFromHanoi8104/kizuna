"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Mode = "signup" | "signin";

export default function Login() {
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Your password needs at least 6 characters.");
    setBusy(true);
    const auth = getSupabase().auth;
    const { data, error } =
      mode === "signup"
        ? await auth.signUp({ email: email.trim(), password })
        : await auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      if (/already registered/i.test(error.message)) {
        setMode("signin");
        return setError("You already have an account. Sign in instead.");
      }
      if (/invalid login/i.test(error.message)) return setError("Wrong email or password.");
      return setError(error.message);
    }
    // If "Confirm email" is still on in Supabase, sign-up returns no session.
    if (mode === "signup" && !data.session) {
      setError("Account created, but Supabase is asking for email confirmation. Turn off “Confirm email” in Supabase, then sign in.");
    }
  }

  const signup = mode === "signup";

  return (
    <div className="card login a">
      <div key={mode} className="swap">
        <h1>{signup ? "Start your map" : "Welcome back"}</h1>
        <p>{signup ? "Create an account to save your connections. They’re private to you." : "Sign in to see your map."}</p>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <label className="field-label" htmlFor="pw">Password</label>
          <input
            id="pw"
            className="input"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={signup ? "At least 6 characters" : ""}
          />
          <button className="btn btn-red" disabled={busy}>
            {busy ? <span className="spinner" aria-label="Please wait" /> : signup ? "Create account" : "Sign in"}
          </button>
        </form>
        <button type="button" className="link-btn" onClick={() => { setMode(signup ? "signin" : "signup"); setError(""); }}>
          {signup ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
        {error && (
          <p className="hint err" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
