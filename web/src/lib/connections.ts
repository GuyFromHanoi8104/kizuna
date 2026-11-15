import { BY_CODE } from "@/lib/world";

export const HOW_MET = ["Work", "Uni", "Mutual friends", "Other"] as const;
export type HowMet = (typeof HOW_MET)[number];
export type View = "from" | "live";

export type Connection = {
  id: string;
  name: string;
  from_country: string;
  lives_in: string | null;
  contact: string | null;
  how_met: HowMet;
  created_at?: string;
};

export type NewConnection = Omit<Connection, "id" | "created_at">;

/** The country a connection is counted under in the current view. */
export const placeOf = (c: Connection, view: View) => (view === "live" ? c.lives_in || c.from_country : c.from_country);

export function countsBy(people: Connection[], view: View) {
  const counts: Record<string, number> = {};
  for (const p of people) {
    const k = placeOf(p, view);
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

export function statsOf(people: Connection[], view: View) {
  const counts = countsBy(people, view);
  const conts = new Set(Object.keys(counts).map((c) => BY_CODE[c]?.cont).filter(Boolean));
  return { countries: Object.keys(counts).length, people: people.length, continents: conts.size };
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
