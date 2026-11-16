"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar, { DefaultAvatar } from "@/components/Avatar";
import CountrySelect from "@/components/CountrySelect";
import ProfileForm from "@/components/ProfileForm";
import ProviderButtons from "@/components/ProviderButtons";
import type { User } from "@supabase/supabase-js";
import { PROVIDER_NAME, linkedProviders } from "@/lib/accounts";
import WorldMap from "@/components/WorldMap";
import { removeOldAvatars, type Profile } from "@/lib/profile";
import { getSupabase } from "@/lib/supabase";
import { BY_CODE, CONTINENTS, COUNTRIES, countryName } from "@/lib/world";
import { HOW_MET, countsBy, placeOf, statsOf, type Connection, type HowMet, type View } from "@/lib/connections";
import { useCountUp } from "@/lib/useCountUp";

const COLUMNS = "id,name,from_country,lives_in,contact,how_met,created_at";

type Draft = { key: number; name: string; other: string; contact: string };
let draftKey = 0;
const newDraft = (): Draft => ({ key: ++draftKey, name: "", other: "", contact: "" });

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

export default function Connections({ user, profile, onProfile }: { user: User; profile: Profile; onProfile: (p: Profile) => void }) {
  const linked = linkedProviders(user);
  const isGuest = linked.length === 0;
  const supabase = getSupabase();
  const [people, setPeople] = useState<Connection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState<View>("from");
  const [sel, setSel] = useState("DE");
  const [swap, setSwap] = useState(0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "known">("all");
  const [drafts, setDrafts] = useState<Draft[]>(() => [newDraft()]);
  const [how, setHow] = useState<HowMet>("Uni");
  const [hint, setHint] = useState<{ text: string; kind: "ok" | "err" } | null>(null);
  const [shakeName, setShakeName] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastAdded, setLastAdded] = useState<Set<string>>(() => new Set());
  const [removing, setRemoving] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
    setDrafts((r) => r.map((d) => ({ ...d, other: "" })));
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

  const editRow = (key: number, patch: Partial<Draft>) => {
    setDrafts((r) => r.map((d) => (d.key === key ? { ...d, ...patch } : d)));
    setHint(null);
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    // Rows left completely empty are ignored; a row with details but no name is an error.
    const filled = drafts.filter((d) => d.name.trim() || d.contact.trim() || d.other);
    if (!filled.length || filled.some((d) => !d.name.trim())) {
      setShakeName((x) => x + 1);
      return setHint({ text: filled.length > 1 ? "Every person needs a name." : "Add a name first.", kind: "err" });
    }
    if (live && filled.some((d) => !d.other)) return setHint({ text: "Pick where each person is from.", kind: "err" });
    setSaving(true);
    const insert = filled.map((d) => ({
      name: d.name.trim(),
      from_country: live ? d.other : sel,
      lives_in: (live ? sel : d.other) || null,
      contact: d.contact.trim() || null,
      how_met: how,
    }));
    const { data, error } = await supabase.from("connections").insert(insert).select(COLUMNS);
    setSaving(false);
    if (error) return setHint({ text: `Couldn’t save: ${error.message}`, kind: "err" });
    const added = (data ?? []) as Connection[];
    setPeople((p) => [...p, ...added]);
    setLastAdded(new Set(added.map((x) => x.id)));
    setDrafts([newDraft()]);
    setHint({ text: added.length === 1 ? `Saved ${added[0].name}.` : `Saved ${added.length} people.`, kind: "ok" });
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

  // In-page confirmation (no browser pop-ups: some mobile browsers block window.confirm).
  async function deleteAccount() {
    setDeleteError("");
    setDeleting(true);
    await removeOldAvatars(profile.id).catch(() => {});
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      setDeleting(false);
      return setDeleteError(`Couldn’t delete your account: ${error.message}`);
    }
    // The account is gone on the server; clear this browser's session too.
    await supabase.auth.signOut({ scope: "local" });
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
                  <div key={p.id} className={`person${p.id === removing ? " gone" : lastAdded.has(p.id) ? " new" : ""}`}>
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
            <h3>{live ? `Add people who live in ${selCountry.name}` : `Add people from ${selCountry.name}`}</h3>
            <p className="form-note">{live ? "Name and where they are from are required." : "Only name and country are required."}</p>
            <div className="drafts">
              {drafts.map((d, i) => (
                <div key={d.key} className={`draft${drafts.length > 1 ? " multi" : ""}`}>
                  {drafts.length > 1 ? (
                    <div className="draft-top">
                      <span className="draft-n">Person {i + 1}</span>
                      <button type="button" className="icon-btn" aria-label={`Remove person ${i + 1}`} onClick={() => setDrafts((r) => r.filter((x) => x.key !== d.key))}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                      </button>
                    </div>
                  ) : null}
                  <div className="grid2" style={{ marginTop: drafts.length > 1 ? 8 : 18 }}>
                    <div>
                      <label className="field-label" htmlFor={`name-${d.key}`}>Name <b>*</b></label>
                      <input
                        key={`${d.key}-${shakeName}`}
                        id={`name-${d.key}`}
                        className={`input${shakeName && !d.name.trim() ? " shake" : ""}`}
                        placeholder="Their name"
                        value={d.name}
                        maxLength={120}
                        autoFocus={i > 0 && i === drafts.length - 1 && !d.name}
                        onChange={(e) => editRow(d.key, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`other-${d.key}`}>
                        {live ? <>From <b>*</b></> : <>Lives in <em>(optional)</em></>}
                      </label>
                      <CountrySelect
                        id={`other-${d.key}`}
                        value={d.other}
                        onChange={(c) => editRow(d.key, { other: c })}
                        placeholder={live ? "Type a country" : "Same as home / not sure"}
                        emptyLabel={live ? undefined : "Same as home / not sure"}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`contact-${d.key}`}>Phone or social <em>(optional)</em></label>
                      <input id={`contact-${d.key}`} className="input" placeholder="+49 … or @handle" value={d.contact} maxLength={200} onChange={(e) => editRow(d.key, { contact: e.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="add-row" onClick={() => setDrafts((r) => [...r, newDraft()])}>
              <span aria-hidden="true">+</span> Add another person {live ? `living in ${selCountry.name}` : `from ${selCountry.name}`}
            </button>
            <fieldset className="fieldset">
              <legend>{drafts.length > 1 ? "How did you meet them?" : "How did you meet?"}</legend>
              <div className="chips">
                {HOW_MET.map((h) => (
                  <button key={h} type="button" className="chip" aria-pressed={how === h} onClick={() => setHow(h)}>
                    {h}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="form-foot">
              <button className="btn btn-red btn-sm" disabled={saving}>
                {saving ? <span className="spinner" aria-label="Saving" /> : drafts.length > 1 ? `Save ${drafts.length} people` : "Save connection"}
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

      {isGuest ? (
        <section className="card sync a" style={{ animationDelay: "720ms" }} aria-label="Use Kizuna on other devices">
          <div className="sync-text">
            <h3>Use Kizuna on your other devices</h3>
            <p>Right now your map lives only in this browser. Connect Apple or Google to open the same map on your phone, laptop or anywhere else. Nothing you’ve saved changes.</p>
          </div>
          <ProviderButtons mode="link" />
        </section>
      ) : null}

      <div className="account" style={{ flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
        {isGuest ? (
          <p className="guest-note">Your Kizuna account is saved in this browser. Clearing your browser’s data or using private mode starts a new, empty map, unless you’ve connected Apple or Google.</p>
        ) : (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span>Connected with {linked.map((p) => PROVIDER_NAME[p]).join(" and ")}</span>
            <button type="button" className="link-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        )}
        {confirmDelete ? (
          <div className="confirm-del" role="alertdialog" aria-labelledby="del-title">
            <p id="del-title"><strong>Delete your Kizuna account?</strong> This permanently erases your profile and all {people.length} saved {people.length === 1 ? "connection" : "connections"}. It can’t be undone.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button type="button" className="btn btn-red btn-sm" onClick={deleteAccount} disabled={deleting}>
                {deleting ? <span className="spinner" aria-label="Deleting" /> : "Yes, delete everything"}
              </button>
              <button type="button" className="link-btn" onClick={() => { setConfirmDelete(false); setDeleteError(""); }} disabled={deleting}>Cancel</button>
            </div>
            {deleteError ? <p className="hint err" role="alert">{deleteError}</p> : null}
          </div>
        ) : (
          <button type="button" className="link-btn danger" onClick={() => setConfirmDelete(true)}>Delete account</button>
        )}
      </div>
    </>
  );
}
