import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export type Provider = "apple" | "google";
export const PROVIDER_NAME: Record<Provider, string> = { apple: "Apple", google: "Google" };

const back = () => `${window.location.origin}/app`;

/** Guest account → attach Apple/Google so the same map works on other devices. Redirects away and back. */
export async function linkProvider(provider: Provider) {
  const { error } = await getSupabase().auth.linkIdentity({ provider, options: { redirectTo: back() } });
  if (error) throw new Error(error.message);
}

/** New device: sign in to an existing (already linked) Kizuna account. Redirects away and back. */
export async function signInWith(provider: Provider) {
  const { error } = await getSupabase().auth.signInWithOAuth({ provider, options: { redirectTo: back() } });
  if (error) throw new Error(error.message);
}

export const linkedProviders = (user: User | null | undefined): Provider[] =>
  (user?.identities ?? []).map((i) => i.provider).filter((p): p is Provider => p === "apple" || p === "google");

/** Reads an error Supabase put in the URL after an Apple/Google redirect, then cleans the URL. */
export function takeRedirectError(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const raw = params.get("error_description") || hash.get("error_description") || "";
  if (!raw) return "";
  window.history.replaceState(null, "", window.location.pathname);
  const msg = raw.replace(/\+/g, " ");
  if (/already.*linked|identity.*exists|already.*registered/i.test(msg)) {
    return "That account is already connected to another Kizuna map. To open that map here, delete this guest map first, then sign in with it.";
  }
  return msg;
}
