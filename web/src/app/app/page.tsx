"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Connections from "@/components/Connections";
import Login from "@/components/Login";
import { getSupabase } from "@/lib/supabase";

export default function AppPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
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

  return (
    <div className="app-bg">
      <div className="main">
        {configError ? (
          <div className="card login">
            <h1>Almost there</h1>
            <p>{configError}</p>
          </div>
        ) : session === undefined ? null : session ? (
          <Connections key={session.user.id} email={session.user.email ?? ""} />
        ) : (
          <Login />
        )}
      </div>
    </div>
  );
}
