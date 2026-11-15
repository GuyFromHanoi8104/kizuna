"use client";

import { useState } from "react";
import { PROVIDER_NAME, type Provider } from "@/lib/accounts";

const AppleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.75 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.71.71 2.88.69 1.19-.02 1.94-1.08 2.66-2.15.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.32-.89-2.34-3.53ZM14.2 6.13c.6-.74 1.01-1.75.9-2.77-.87.04-1.93.58-2.55 1.31-.56.65-1.05 1.69-.92 2.69.97.07 1.97-.49 2.57-1.23Z" />
  </svg>
);

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.8Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.29v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l4.01-3.1Z" />
    <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.53 11.53 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z" />
  </svg>
);

/** "Continue with Apple" / "Continue with Google" buttons. */
export default function ProviderButtons({ onPick, verb = "Continue" }: { onPick: (p: Provider) => Promise<void>; verb?: string }) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState("");
  const click = async (p: Provider) => {
    setError("");
    setBusy(p);
    try {
      await onPick(p);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  };
  return (
    <div className="providers">
      {(["apple", "google"] as Provider[]).map((p) => (
        <button key={p} type="button" className={`pbtn pbtn-${p}`} disabled={busy !== null} onClick={() => click(p)}>
          {busy === p ? <span className={`spinner${p === "google" ? " dark" : ""}`} aria-label="Opening" /> : p === "apple" ? <AppleLogo /> : <GoogleLogo />}
          <span>{verb} with {PROVIDER_NAME[p]}</span>
        </button>
      ))}
      {error ? <p className="hint err" role="alert">{error}</p> : null}
    </div>
  );
}
