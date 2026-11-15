"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { saveProfile, uploadAvatar, type Profile } from "@/lib/profile";
import { getSupabase } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/world";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Three-step sign-up with no email or password:
 * 1. name  2. where you're from / where you live  3. optional extras (skippable).
 * At the end we create a guest (anonymous) Supabase account; the browser remembers it.
 */
export default function Onboarding({ existingUserId, onDone }: { existingUserId?: string; onDone: (p: Profile) => void }) {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [live, setLive] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const go = (n: number) => {
    setError("");
    setDir(n > step ? "fwd" : "back");
    setStep(n);
  };

  function next(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (!name.trim()) return setError("What should we call you?");
      return go(2);
    }
    if (step === 2) {
      if (!from) return setError("Pick where you’re from.");
      if (!live) return setError("Pick where you live now.");
      return go(3);
    }
    finish(false);
  }

  async function finish(skip: boolean) {
    setError("");
    const ageNum = !skip && age.trim() ? Number(age) : null;
    if (!skip) {
      if (email.trim() && !EMAIL.test(email.trim())) return setError("That email doesn’t look right.");
      if (ageNum !== null && (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 120)) return setError("Age should be between 13 and 120.");
    }
    setBusy(true);
    try {
      const supabase = getSupabase();
      let userId = existingUserId;
      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user) throw new Error(error?.message ?? "Couldn’t create your account.");
        userId = data.user.id;
      }
      const avatar_url = !skip && file ? await uploadAvatar(userId, file) : null;
      const profile = await saveProfile(userId, {
        name: name.trim(),
        from_country: from,
        lives_in: live,
        age: ageNum,
        email: skip ? null : email.trim() || null,
        phone: skip ? null : phone.trim() || null,
        avatar_url,
      });
      onDone(profile);
    } catch (err) {
      const msg = (err as Error).message;
      setError(/anonymous/i.test(msg) ? "Guest accounts are switched off in Supabase. Turn on “Allow anonymous sign-ins”." : msg);
      setBusy(false);
    }
  }

  return (
    <div className="card onboard a">
      <div className="steps-bar" aria-label={`Step ${step} of 3`}>
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= step ? "on" : ""} />
        ))}
      </div>

      <form key={step} className={`ob-step ${dir}`} onSubmit={next} noValidate>
        {step === 1 && (
          <>
            <p className="ob-kicker">Step 1 of 3</p>
            <h1>Tell Kizuna your name</h1>
            <label className="sr-only" htmlFor="ob-name">Your name</label>
            <input id="ob-name" className="input ob-big" autoFocus autoComplete="name" maxLength={80} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </>
        )}

        {step === 2 && (
          <>
            <p className="ob-kicker">Step 2 of 3</p>
            <h1>Hi {name.trim().split(" ")[0]}! Where in the world?</h1>
            <div className="grid2">
              <div>
                <label className="field-label" htmlFor="ob-from">Where you’re from <b>*</b></label>
                <select id="ob-from" className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
                  <option value="">Choose a country</option>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="ob-live">Where you live now <b>*</b></label>
                <select id="ob-live" className="input" value={live} onChange={(e) => setLive(e.target.value)}>
                  <option value="">Choose a country</option>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="ob-kicker">Step 3 of 3 · optional</p>
            <h1>A few extras</h1>
            <p className="form-note">All optional. Skip if you like, you can add them later.</p>
            <div className="photo-row">
              <div className="photo-ring">
                <Avatar url={preview} seed={name || "kizuna"} size={76} />
              </div>
              <button type="button" className="chip" onClick={() => fileInput.current?.click()}>
                {preview ? "Change photo" : "Add a photo"}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setPreview(URL.createObjectURL(f));
                  }
                  e.target.value = "";
                }}
              />
            </div>
            <div className="grid2">
              <div>
                <label className="field-label" htmlFor="ob-email">Email</label>
                <input id="ob-email" className="input" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="ob-phone">Phone</label>
                <input id="ob-phone" className="input" type="tel" autoComplete="tel" placeholder="+49 …" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="ob-age">Age</label>
                <input id="ob-age" className="input" inputMode="numeric" maxLength={3} placeholder="e.g. 22" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} />
              </div>
            </div>
          </>
        )}

        <div className="form-foot">
          {step > 1 ? (
            <button type="button" className="link-btn" onClick={() => go(step - 1)} disabled={busy}>
              ← Back
            </button>
          ) : null}
          <span style={{ flex: 1 }} />
          {step === 3 ? (
            <button type="button" className="link-btn" onClick={() => finish(true)} disabled={busy}>
              Skip
            </button>
          ) : null}
          <button className="btn btn-red btn-sm" disabled={busy}>
            {busy ? <span className="spinner" aria-label="Creating your map" /> : step === 3 ? "Start my map" : "Continue"}
          </button>
        </div>
        {error ? <p key={error} className="hint err" role="alert">{error}</p> : null}
      </form>
    </div>
  );
}
