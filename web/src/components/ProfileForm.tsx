"use client";

import { useRef, useState } from "react";
import CountrySelect from "@/components/CountrySelect";
import Avatar from "@/components/Avatar";
import { removeOldAvatars, saveProfile, uploadAvatar, type Profile } from "@/lib/profile";

type Props = {
  userId: string;
  initial?: Profile | null;
  onSaved: (p: Profile) => void;
  onCancel?: () => void;
};

export default function ProfileForm({ userId, initial, onSaved, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [age, setAge] = useState(initial?.age ? String(initial.age) : "");
  const [from, setFrom] = useState(initial?.from_country ?? "");
  const [live, setLive] = useState(initial?.lives_in ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.avatar_url ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const onboarding = !initial;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Add your name.");
    if (!from) return setError("Pick where you’re from.");
    if (!live) return setError("Pick where you live.");
    const ageNum = age.trim() ? Number(age) : null;
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError("That email doesn’t look right.");
    if (ageNum !== null && (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 120)) return setError("Age should be a number between 13 and 120.");
    setBusy(true);
    try {
      let avatar_url = initial?.avatar_url ?? null;
      if (file) avatar_url = await uploadAvatar(userId, file);
      else if (removePhoto) {
        await removeOldAvatars(userId);
        avatar_url = null;
      }
      const saved = await saveProfile(userId, {
        name: name.trim(),
        age: ageNum,
        from_country: from,
        lives_in: live,
        phone: phone.trim() || null,
        email: email.trim() || null,
        avatar_url,
      });
      onSaved(saved);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form profile-form a" onSubmit={submit} noValidate>
      <h3>Edit profile</h3>
      <p className="form-note">{onboarding ? "One last step. Only name, where you’re from and where you live are required." : "Only name, where you’re from and where you live are required."}</p>

      <div className="photo-row">
        <div className="photo-ring">
          <Avatar url={removePhoto ? null : preview} seed={userId} size={84} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="chip" onClick={() => fileInput.current?.click()}>
            {preview && !removePhoto ? "Change photo" : "Upload photo"}
          </button>
          {preview && !removePhoto ? (
            <button type="button" className="chip" onClick={() => { setFile(null); setRemovePhoto(true); }}>
              Remove
            </button>
          ) : null}
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
                setRemovePhoto(false);
              }
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="grid2">
        <div>
          <label className="field-label" htmlFor="p-name">Name <b>*</b></label>
          <input id="p-name" className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
        </div>
        <div>
          <label className="field-label" htmlFor="p-age">Age <em>(optional)</em></label>
          <input id="p-age" className="input" inputMode="numeric" value={age} maxLength={3} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 22" />
        </div>
        <div>
          <label className="field-label" htmlFor="p-from">Where you’re from <b>*</b></label>
          <CountrySelect id="p-from" value={from} onChange={setFrom} />
        </div>
        <div>
          <label className="field-label" htmlFor="p-live">Where you live <b>*</b></label>
          <CountrySelect id="p-live" value={live} onChange={setLive} />
        </div>
        <div>
          <label className="field-label" htmlFor="p-phone">Phone <em>(optional)</em></label>
          <input id="p-phone" className="input" type="tel" value={phone} maxLength={40} onChange={(e) => setPhone(e.target.value)} placeholder="+49 …" autoComplete="tel" />
        </div>
        <div>
          <label className="field-label" htmlFor="p-email">Email <em>(optional)</em></label>
          <input id="p-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </div>
      </div>

      <div className="form-foot">
        <button className="btn btn-red btn-sm" disabled={busy}>
          {busy ? <span className="spinner" aria-label="Saving" /> : onboarding ? "Start my map" : "Save profile"}
        </button>
        {onCancel ? (
          <button type="button" className="link-btn" onClick={onCancel}>Cancel</button>
        ) : null}
        {error ? <span key={error} className="hint err" role="alert">{error}</span> : null}
      </div>
    </form>
  );
}
