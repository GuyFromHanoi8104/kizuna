"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Connections from "@/components/Connections";
import Onboarding from "@/components/Onboarding";
import { takeRedirectError } from "@/lib/accounts";
import { loadProfile, type Profile } from "@/lib/profile";
import { getSupabase } from "@/lib/supabase";

export default function AppPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  // undefined = loading, null = signed in but no profile yet
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [profileError, setProfileError] = useState("");
  const [redirectError, setRedirectError] = useState("");

  // After an Apple/Google redirect, show any error Supabase sent back (read after hydration).
  useEffect(() => {
    Promise.resolve().then(() => setRedirectError(takeRedirectError()));
  }, []);
  const configError =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      ? ""
      : "Supabase isn’t connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy.";

  useEffect(() => {
    if (configError) return;
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [configError]);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    loadProfile(userId)
      .then((p) => alive && setProfile(p))
      .catch((e) => alive && setProfileError((e as Error).message));
    return () => {
      alive = false;
      setProfile(undefined);
      setProfileError("");
    };
  }, [userId]);

  let body: React.ReactNode = null;
  if (configError) {
    body = (
      <div className="card login">
        <h1>Almost there</h1>
        <p>{configError}</p>
      </div>
    );
  } else if (session === null) {
    body = <Onboarding onDone={setProfile} />;
  } else if (session && profileError) {
    body = (
      <div className="card login">
        <h1>Something’s off</h1>
        <p>Couldn’t load your profile: {profileError}</p>
        <p>If it says the table doesn’t exist, run the latest supabase/schema.sql in the Supabase SQL Editor.</p>
      </div>
    );
  } else if (session && profile === null) {
    body = <Onboarding existingUserId={session.user.id} onDone={setProfile} />;
  } else if (session && profile) {
    body = <Connections key={session.user.id} user={session.user} profile={profile} onProfile={setProfile} />;
  }

  return (
    <div className="app-bg">
      <div className="main">
        {redirectError ? <p className="banner" role="alert">{redirectError}</p> : null}
        {body}
      </div>
    </div>
  );
}
