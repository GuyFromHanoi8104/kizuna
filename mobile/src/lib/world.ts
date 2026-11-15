import world from "@/data/world.json";

export type Shape = { code: string; d: string };
export type Dot = { code: string; x: number; y: number };
export type Country = { code: string; name: string; cont: string };

export const SHAPES = world.shapes as Shape[];
export const DOTS = world.dots as Dot[];
export const COUNTRIES = world.list as Country[];

export const BY_CODE: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export const CONTINENTS: Record<string, string> = {
  AF: "Africa",
  AS: "Asia",
  EU: "Europe",
  NA: "North America",
  SA: "South America",
  OC: "Oceania",
  AN: "Antarctica",
};

export const countryName = (code: string | null | undefined) => (code ? BY_CODE[code]?.name ?? code : "");

/** x position of a shape's first point, used to sweep the map in from west to east. */
export const shapeX = (d: string) => parseFloat(d.slice(1)) || 0;
