"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Step = "email" | "code" | "password";

export default function Login() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    setBusy(true);
    const { error } = await getSupabase().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) return setError(error.message);
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await getSupabase().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) setError("That code didn’t work. Check it or send a new one.");
  }

  async function withPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(error.message);
  }

  return (
    <div className="card login a">
      <div key={step} className="swap">
        {step === "email" && (
          <>
            <h1>Start your map</h1>
            <p>Sign in with your email. We’ll send you a code, no password needed. Your connections are private to you.</p>
            <form onSubmit={sendCode}>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <button className="btn btn-red" disabled={busy}>
                {busy ? <span className="spinner" aria-label="Sending" /> : "Send me a code"}
              </button>
            </form>
            <button type="button" className="link-btn" onClick={() => setStep("password")}>
              Sign in with a password instead
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <h1>Check your inbox</h1>
            <p>
              We sent a code to <strong>{email}</strong>. Enter it below.
            </p>
            <form onSubmit={verify}>
              <label className="field-label" htmlFor="code">
                Code
              </label>
              <input id="code" className="input code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              <button className="btn btn-red" disabled={busy || code.length < 6}>
                {busy ? <span className="spinner" aria-label="Checking" /> : "Sign in"}
              </button>
            </form>
            <button type="button" className="link-btn" onClick={() => { setStep("email"); setCode(""); }}>
              Use a different email
            </button>
          </>
        )}

        {step === "password" && (
          <>
            <h1>Sign in</h1>
            <form onSubmit={withPassword}>
              <label className="field-label" htmlFor="email2">Email</label>
              <input id="email2" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <label className="field-label" htmlFor="pw">Password</label>
              <input id="pw" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="btn btn-red" disabled={busy}>
                {busy ? <span className="spinner" aria-label="Signing in" /> : "Sign in"}
              </button>
            </form>
            <button type="button" className="link-btn" onClick={() => setStep("email")}>
              Get an email code instead
            </button>
          </>
        )}

        {error && (
          <p className="hint err" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
