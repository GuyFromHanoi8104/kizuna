/**
 * Google Identity Services ("Sign in with Google" button rendered by Google, on our own page).
 * Google returns an ID token to the page; we hand it to Supabase. No redirect through
 * supabase.co, so Google's sign-in sheet shows gokizuna.eu / Kizuna instead.
 */

type CredentialResponse = { credential: string };
type GoogleId = {
  initialize: (o: Record<string, unknown>) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

// Public value (OAuth client IDs are not secret). Override with NEXT_PUBLIC_GOOGLE_CLIENT_ID in Vercel.
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "334672972904-6gnp8qnqggtcke8fdn8optg490p0c208.apps.googleusercontent.com";

let loading: Promise<GoogleId> | null = null;

export function loadGoogle(): Promise<GoogleId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error("Google sign-in didn’t load.")));
      s.onerror = () => {
        loading = null;
        reject(new Error("Couldn’t reach Google. Check your connection or ad blocker."));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/** Random nonce: Google gets the SHA-256 hash, Supabase gets the raw value to check it. */
export async function makeNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

export type { CredentialResponse };
