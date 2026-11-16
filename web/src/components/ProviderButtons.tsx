"use client";

import { useState } from "react";
import GoogleButton from "@/components/GoogleButton";
import { linkProvider, signInWith } from "@/lib/accounts";

const AppleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.75 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.71.71 2.88.69 1.19-.02 1.94-1.08 2.66-2.15.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.32-.89-2.34-3.53ZM14.2 6.13c.6-.74 1.01-1.75.9-2.77-.87.04-1.93.58-2.55 1.31-.56.65-1.05 1.69-.92 2.69.97.07 1.97-.49 2.57-1.23Z" />
  </svg>
);

/** Apple (redirect) + Google (Google's own button on this page). */
export default function ProviderButtons({ mode }: { mode: "link" | "signin" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const apple = async () => {
    setError("");
    setBusy(true);
    try {
      await (mode === "link" ? linkProvider("apple") : signInWith("apple"));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <div className="providers">
      <button type="button" className="pbtn pbtn-apple" disabled={busy} onClick={apple}>
        {busy ? <span className="spinner" aria-label="Opening" /> : <AppleLogo />}
        <span>{mode === "link" ? "Continue" : "Sign in"} with Apple</span>
      </button>
      <GoogleButton mode={mode} />
      {error ? <p className="hint err" role="alert">{error}</p> : null}
    </div>
  );
}
