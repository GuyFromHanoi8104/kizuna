"use client";

import { useId, useMemo, useRef, useState } from "react";
import { COUNTRIES, countryName, type Country } from "@/lib/world";

type Props = {
  id: string;
  value: string;
  onChange: (code: string) => void;
  /** placeholder shown in the empty box */
  placeholder?: string;
  /** label for the "no country" option; omit to make a country required */
  emptyLabel?: string;
};

/** Ranks matches: name starts with the text, then a word starts with it, then contains it. Codes match exactly. */
function search(q: string): Country[] {
  const t = q.trim().toLowerCase();
  if (!t) return COUNTRIES;
  const starts: Country[] = [];
  const word: Country[] = [];
  const has: Country[] = [];
  for (const c of COUNTRIES) {
    const n = c.name.toLowerCase();
    if (n.startsWith(t) || c.code.toLowerCase() === t) starts.push(c);
    else if (n.split(/[\s-]/).some((w) => w.startsWith(t))) word.push(c);
    else if (n.includes(t)) has.push(c);
  }
  return [...starts, ...word, ...has];
}

/** Type-to-search country picker (accessible combobox). */
export default function CountrySelect({ id, value, onChange, placeholder = "Type a country", emptyLabel }: Props) {
  const listId = useId();
  const [query, setQuery] = useState<string | null>(null); // null = not typing, show the chosen country
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const options = useMemo(() => {
    const list = search(query ?? "").map((c) => ({ code: c.code, name: c.name }));
    return emptyLabel && !query ? [{ code: "", name: emptyLabel }, ...list] : list;
  }, [query, emptyLabel]);

  const choose = (code: string) => {
    onChange(code);
    setQuery(null);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (open && options[active]) {
        e.preventDefault();
        choose(options[active].code);
      }
    } else if (e.key === "Escape") {
      setQuery(null);
      setOpen(false);
    }
  };

  const shown = query ?? (value ? countryName(value) : "");

  return (
    <div className="combo">
      <input
        ref={input}
        id={id}
        className="input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={shown}
        onFocus={(e) => {
          setOpen(true);
          setActive(0);
          e.currentTarget.select();
        }}
        onBlur={() => {
          setOpen(false);
          setQuery(null);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={onKey}
      />
      <span className="combo-caret" aria-hidden="true">⌄</span>
      {open && (
        <ul id={listId} role="listbox" className="combo-list">
          {options.length === 0 ? (
            <li className="combo-empty">No country called “{query}”</li>
          ) : (
            options.map((o, i) => (
              <li
                key={o.code || "none"}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={o.code === value}
                className={`combo-opt${i === active ? " active" : ""}${o.code === value ? " chosen" : ""}${!o.code ? " none" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o.code)}
              >
                <span>{o.name}</span>
                {o.code ? <span className="combo-code">{o.code}</span> : null}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
