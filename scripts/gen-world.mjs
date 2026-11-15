import fs from 'fs';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoPath, geoCentroid } from 'd3-geo';
import iso from 'i18n-iso-countries';
import { countries } from 'countries-list';

const t110 = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json'));
const t50 = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json'));
const f110 = feature(t110, t110.objects.countries).features.filter(f => f.id !== '010');
const f50 = feature(t50, t50.objects.countries).features.filter(f => f.id !== '010');

const W = 1000, H = 500;
const proj = geoNaturalEarth1().fitSize([W, H], { type: 'FeatureCollection', features: f110 });
const path = geoPath(proj);
const round = d => d.replace(/(\d+\.\d)\d+/g, '$1');

const a2 = id => id ? iso.numericToAlpha2(id) : undefined;
const shapes = [];
const have = new Set();
for (const f of f110) {
  const code = a2(f.id) || (f.properties.name === 'Kosovo' ? 'XK' : null);
  if (!code) continue;
  const d = path(f); if (!d) continue;
  shapes.push({ code, d: round(d) });
  have.add(code);
}
const dots = [];
for (const f of f50) {
  const code = a2(f.id);
  if (!code || have.has(code) || !countries[code]) continue;
  const c = proj(geoCentroid(f)); if (!c) continue;
  dots.push({ code, x: +c[0].toFixed(1), y: +c[1].toFixed(1) });
  have.add(code);
}
const list = Object.entries(countries)
  .filter(([c]) => c !== 'AQ')
  .map(([code, v]) => ({ code, name: v.name, cont: Array.isArray(v.continent) ? v.continent[0] : v.continent }))
  .sort((a, b) => a.name.localeCompare(b.name));
const out = JSON.stringify({ shapes, dots, list });
for (const p of ['../web/src/data/world.json', '../mobile/src/data/world.json']) fs.writeFileSync(new URL(p, import.meta.url), out);
console.log(shapes.length, dots.length, list.length, 'written');
