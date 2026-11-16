"use client";

import { useEffect, useRef, useState } from "react";
import { friendlyAuthError } from "@/lib/accounts";
import { GOOGLE_CLIENT_ID, loadGoogle, makeNonce, type CredentialResponse } from "@/lib/googleOneTap";
import { getSupabase } from "@/lib/supabase";

/** Google's own button, rendered on gokizuna.eu. `link` attaches Google to the current guest account; `signin` opens an existing one. */
export default function GoogleButton({ mode }: { mode: "link" | "signin" }) {
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [google, nonce] = await Promise.all([loadGoogle(), makeNonce()]);
        if (cancelled || !box.current) return;
        google.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: nonce.hashed,
          ux_mode: "popup",
          use_fedcm_for_button: true,
          callback: async ({ credential }: CredentialResponse) => {
            setError("");
            setBusy(true);
            const auth = getSupabase().auth;
            const creds = { provider: "google" as const, token: credential, nonce: nonce.raw };
            const { error } = mode === "link" ? await auth.linkIdentity(creds) : await auth.signInWithIdToken(creds);
            if (error) {
              setBusy(false);
              return setError(friendlyAuthError(error.message));
            }
            // Pick up the newly linked identity so the page switches to "Connected with Google".
            if (mode === "link") await auth.refreshSession();
            setBusy(false);
          },
        });
        box.current.innerHTML = "";
        google.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: mode === "link" ? "continue_with" : "signin_with",
          logo_alignment: "center",
          width: Math.min(box.current.offsetWidth || 300, 400),
        });
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return (
    <div>
      <div ref={box} className={`gbtn${busy ? " busy" : ""}`} />
      {error ? (
        <p className="hint err" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
