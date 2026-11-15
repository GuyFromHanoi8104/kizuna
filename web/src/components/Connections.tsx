"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar, { DefaultAvatar } from "@/components/Avatar";
import ProfileForm from "@/components/ProfileForm";
import WorldMap from "@/components/WorldMap";
import { removeOldAvatars, type Profile } from "@/lib/profile";
import { getSupabase } from "@/lib/supabase";
import { BY_CODE, CONTINENTS, COUNTRIES, countryName } from "@/lib/world";
import { HOW_MET, countsBy, placeOf, statsOf, type Connection, type HowMet, type View } from "@/lib/connections";
import { useCountUp } from "@/lib/useCountUp";

const COLUMNS = "id,name,from_country,lives_in,contact,how_met,created_at";

/** A stat number that counts up and gives a little bump whenever it changes. */
function Stat({ value, label, tone, delay }: { value: number; label: string; tone: string; delay: number }) {
  const shown = useCountUp(value, { delay: delay + 300, duration: 1100 });
  const [bump, setBump] = useState(0);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      const id = requestAnimationFrame(() => setBump((b) => b + 1));
      return () => cancelAnimationFrame(id);
    }
  }, [value]);
  return (
    <div className="a" style={{ animationDelay: `${delay}ms` }}>
      <div className={`stat ${tone}`} style={{ height: "100%" }}>
        <div className="stat-n">
          <span key={bump} className={bump ? "bump" : ""}>
            {shown}
          </span>
        </div>
        <div className="stat-l">{label}</div>
      </div>
    </div>
  );
}

function Segmented<T extends string>({ options, value, onChange, label, white }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; white?: boolean }) {
  const idx = Math.max(0, options.findIndex((o) => o.v === value));
  return (
    <div role="group" aria-label={label} className={`seg${white ? " on-white" : ""}`}>
      <span className="seg-ind" aria-hidden="true" style={{ transform: `translateX(${idx * 100}%)` }} />
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={o.v === value} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Connections({ profile, onProfile }: { profile: Profile; onProfile: (p: Profile) => void }) {
  const supabase = getSupabase();
  const [people, setPeople] = useState<Connection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState<View>("from");
  const [sel, setSel] = useState("DE");
  const [swap, setSwap] = useState(0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "known">("all");
  const [form, setForm] = useState({ name: "", other: "", contact: "", how: "Uni" as HowMet });
  const [hint, setHint] = useState<{ text: string; kind: "ok" | "err" } | null>(null);
  const [shakeName, setShakeName] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Load connections
  useEffect(() => {
    let alive = true;
    supabase
      .from("connections")
      .select(COLUMNS)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setLoadError(error.message);
        else {
          const rows = (data ?? []) as Connection[];
          setPeople(rows);
          if (rows.length) setSel(rows[rows.length - 1].from_country);
        }
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [supabase]);

  const counts = useMemo(() => countsBy(people, view), [people, view]);
  const stats = useMemo(() => statsOf(people, view), [people, view]);
  const live = view === "live";

  const pick = useCallback((code: string) => {
    setSel((cur) => {
      if (cur !== code) {
        setSwap((s) => s + 1);
        setHint(null);
      }
      return code;
    });
  }, []);

  const switchView = (v: View) => {
    if (v === view) return;
    setView(v);
    setSwap((s) => s + 1);
    setHint(null);
    setForm((f) => ({ ...f, other: "" }));
  };

  const fillOf = useCallback(
    (code: string) => (code === sel ? "#DD2C04" : counts[code] >= 2 ? "#0077D9" : counts[code] ? "#7CC8FF" : "#E3E9F0"),
    [sel, counts],
  );
  const showDot = useCallback((code: string) => Boolean(counts[code]) || code === sel, [counts, sel]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = COUNTRIES.filter((c) => !term || c.name.toLowerCase().includes(term) || c.code.toLowerCase() === term);
    if (filter === "known") list = list.filter((c) => counts[c.code]);
    return list;
  }, [q, filter, counts]);

  const selCountry = BY_CODE[sel] ?? { code: sel, name: sel, cont: "" };
  const here = people.filter((p) => placeOf(p, view) === sel);
  const n = here.length;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setShakeName((s) => s + 1);
      return setHint({ text: "Add a name first.", kind: "err" });
    }
    if (live && !form.other) return setHint({ text: "Pick where they are from.", kind: "err" });
    setSaving(true);
    const row = {
      name,
      from_country: live ? form.other : sel,
      lives_in: (live ? sel : form.other) || null,
      contact: form.contact.trim() || null,
      how_met: form.how,
    };
    const { data, error } = await supabase.from("connections").insert(row).select(COLUMNS).single();
    setSaving(false);
    if (error) return setHint({ text: `Couldn’t save: ${error.message}`, kind: "err" });
    const added = data as Connection;
    setPeople((p) => [...p, added]);
    setLastAdded(added.id);
    setForm((f) => ({ name: "", other: "", contact: "", how: f.how }));
    setHint({ text: `Saved ${added.name}.`, kind: "ok" });
  }

  async function remove(c: Connection) {
    if (removing) return;
    setRemoving(c.id);
    const [{ error }] = await Promise.all([
      supabase.from("connections").delete().eq("id", c.id),
      new Promise((r) => setTimeout(r, 220)),
    ]);
    setRemoving(null);
    if (error) return setHint({ text: `Couldn’t remove: ${error.message}`, kind: "err" });
    setPeople((p) => p.filter((x) => x.id !== c.id));
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your Kizuna account and all your saved connections? This can’t be undone.")) return;
    await removeOldAvatars(profile.id).catch(() => {});
    const { error } = await supabase.rpc("delete_my_account");
    if (error) return window.alert(`Couldn’t delete account: ${error.message}`);
    await supabase.auth.signOut();
  }

  const subOf = (p: Connection) =>
    [
      live ? `From ${countryName(p.from_country)}` : p.lives_in && p.lives_in !== p.from_country ? `Lives in ${countryName(p.lives_in)}` : "",
      p.contact,
    ]
      .filter(Boolean)
      .join(" · ") || "No details yet";

  return (
    <>
      <div className="head a" style={{ animationDelay: "60ms" }}>
        <div>
          <h1 className="h1">Your world</h1>
          <p className="sub">Tap a country to see who you know from there, or who lives there.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="label-caps">Show people by</span>
          <Segmented
            white
            label="Count people by"
            value={view}
            onChange={switchView}
            options={[
              { v: "from", label: "Where they’re from" },
              { v: "live", label: "Where they live" },
            ]}
          />
        </div>
      </div>

      {editing ? (
        <div style={{ marginTop: 22 }}>
          <ProfileForm userId={profile.id} initial={profile} onSaved={(p) => { onProfile(p); setEditing(false); }} onCancel={() => setEditing(false)} />
        </div>
      ) : (
        <div className="card me a" style={{ animationDelay: "120ms" }}>
          <Avatar url={profile.avatar_url} seed={profile.id} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="me-name">{profile.name}{profile.age ? `, ${profile.age}` : ""}</div>
            <div className="me-sub">From {countryName(profile.from_country)} · Lives in {countryName(profile.lives_in)}</div>
          </div>
          <button type="button" className="chip" onClick={() => setEditing(true)}>Edit profile</button>
        </div>
      )}

      {loadError && <p className="hint err">Couldn’t load your connections: {loadError}</p>}

      <div className="stats">
        <Stat value={loaded ? stats.countries : 0} label="Countries" tone="s-blue" delay={160} />
        <Stat value={loaded ? stats.people : 0} label="Connections" tone="s-ink" delay={250} />
        <Stat value={loaded ? stats.continents : 0} label="Continents" tone="s-red" delay={340} />
      </div>

      <section className="card map-card a" style={{ animationDelay: "420ms" }} aria-label="World map">
        <div className="map-top">
          <h2>Map</h2>
          <div className="legend">
            <span><i style={{ background: "#7CC8FF" }} />1 person</span>
            <span><i style={{ background: "#0077D9" }} />2+ people</span>
            <span><i style={{ background: "#DD2C04" }} />Selected</span>
          </div>
        </div>
        <WorldMap fillOf={fillOf} showDot={showDot} onPick={pick} label="World map. Countries where you know someone are blue." />
      </section>

      <div className="split">
        <section className="card list-col a" style={{ animationDelay: "560ms" }} aria-label="Countries">
          <label className="field-label" htmlFor="search">Search countries</label>
          <input id="search" className="input" type="search" placeholder="e.g. Japan" value={q} onChange={(e) => setQ(e.target.value)} />
          <div style={{ marginTop: 12 }}>
            <Segmented
              label="Filter"
              value={filter}
              onChange={setFilter}
              options={[
                { v: "all", label: `All · ${COUNTRIES.length}` },
                { v: "known", label: `Known · ${stats.countries}` },
              ]}
            />
          </div>
          <div className="list">
            {rows.map((c, i) => {
              const on = c.code === sel;
              return (
                <button
                  key={c.code}
                  type="button"
                  className={`row${on ? " on" : ""}${i < 14 ? " in" : ""}`}
                  style={i < 14 ? { animationDelay: `${650 + i * 35}ms` } : undefined}
                  aria-pressed={on}
                  onClick={() => pick(c.code)}
                >
                  <span className={`code${counts[c.code] ? " known" : ""}`}>{c.code}</span>
                  <span className="row-name">{c.name}</span>
                  {counts[c.code] ? <span key={counts[c.code]} className="count">{counts[c.code]}</span> : null}
                </button>
              );
            })}
            {rows.length === 0 && <p className="empty-note">No countries match “{q}”.</p>}
          </div>
        </section>

        <section className="detail-col a" style={{ animationDelay: "640ms" }} aria-label="Selected country">
          <div className="card detail">
            <div key={swap} className="swap">
              <div className="detail-head">
                <span className="big-code">{selCountry.code}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2>{selCountry.name}</h2>
                  <p>
                    {CONTINENTS[selCountry.cont] ?? ""} · {n === 1 ? "1 person" : `${n} people`} {live ? "living here" : "from here"}
                  </p>
                </div>
              </div>
              <div className="people">
                {here.map((p) => (
                  <div key={p.id} className={`person${p.id === removing ? " gone" : p.id === lastAdded ? " new" : ""}`}>
                    <DefaultAvatar seed={p.id} size={44} />
                    <div className="person-main">
                      <div className="person-name">{p.name}</div>
                      <div className="person-sub">{subOf(p)}</div>
                    </div>
                    <span className={`tag tag-${p.how_met.split(" ")[0]}`}>{p.how_met}</span>
                    <button type="button" className="icon-btn" aria-label={`Remove ${p.name}`} onClick={() => remove(p)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                      </svg>
                    </button>
                  </div>
                ))}
                {loaded && n === 0 && (
                  <div className="empty">
                    No one {live ? "living in" : "from"} {selCountry.name} yet. Add your first connection below.
                  </div>
                )}
              </div>
            </div>
          </div>

          <form className="card form" onSubmit={save} noValidate>
            <h3>{live ? `Add someone who lives in ${selCountry.name}` : `Add someone from ${selCountry.name}`}</h3>
            <p className="form-note">{live ? "Name and where they are from are required." : "Only name and country are required."}</p>
            <div className="grid2">
              <div>
                <label className="field-label" htmlFor="name">Name <b>*</b></label>
                <input
                  key={shakeName}
                  id="name"
                  className={`input${shakeName ? " shake" : ""}`}
                  placeholder="Their name"
                  value={form.name}
                  maxLength={120}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setHint(null); }}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="other">
                  {live ? <>From <b>*</b></> : <>Lives in <em>(optional)</em></>}
                </label>
                <select id="other" className="input" value={form.other} onChange={(e) => { setForm({ ...form, other: e.target.value }); setHint(null); }}>
                  <option value="">{live ? "Choose a country" : "Same as home / not sure"}</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="contact">Phone or social <em>(optional)</em></label>
                <input id="contact" className="input" placeholder="+49 … or @handle" value={form.contact} maxLength={200} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </div>
            </div>
            <fieldset className="fieldset">
              <legend>How did you meet?</legend>
              <div className="chips">
                {HOW_MET.map((h) => (
                  <button key={h} type="button" className="chip" aria-pressed={form.how === h} onClick={() => setForm({ ...form, how: h })}>
                    {h}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="form-foot">
              <button className="btn btn-red btn-sm" disabled={saving}>
                {saving ? <span className="spinner" aria-label="Saving" /> : "Save connection"}
              </button>
              {hint && (
                <span key={hint.text} className={`hint ${hint.kind}`} role="status">
                  {hint.text}
                </span>
              )}
            </div>
          </form>
        </section>
      </div>

      <div className="account" style={{ flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
        <button type="button" className="link-btn danger" onClick={deleteAccount}>Delete account</button>
        <p className="guest-note">Your Kizuna account is saved in this browser. Clearing your browser’s data or using private mode will start a new, empty map.</p>
      </div>
    </>
  );
}
