"use client";

import Link from "next/link";
import WorldMap from "@/components/WorldMap";
import { useCountUp } from "@/lib/useCountUp";

const ROLL = ["Vietnam", "Germany", "Brazil", "Japan", "Nigeria", "France", "Mexico", "India", "Korea", "Italy", "Canada", "Kenya"];
// Column order for the slide-down loop: first item duplicated at top, the rest reversed.
const COLUMN = [ROLL[0], ...ROLL.slice(1).reverse(), ROLL[0]];

// Example network for the preview card only.
const DEMO = new Set(["DE", "FR", "ES", "IT", "NL", "PL", "JP", "KR", "CN", "IN", "TH", "ID", "BR", "MX", "CO", "US", "CA", "NG", "KE", "EG", "GB", "TR", "PT", "AT"]);
const demoFill = (c: string) => (DEMO.has(c) ? "#0099FF" : "#E3E9F0");

export default function Landing() {
  const countries = useCountUp(24, { delay: 1100, duration: 1400 });
  const people = useCountUp(46, { delay: 1100, duration: 1400 });
  const continents = useCountUp(5, { delay: 1100, duration: 1400 });

  return (
    <main>
      <section className="hero">
        <p className="eyebrow a" style={{ animationDelay: "100ms" }}>
          絆 · the bonds you made abroad
        </p>
        <h1 className="hook">
          <span className="hook-line a" style={{ animationDelay: "200ms" }}>
            Know someone from
          </span>
          <span className="hook-row a" style={{ animationDelay: "330ms" }}>
            <span className="roll-box">
              <span className="roll">
                {COLUMN.map((c, i) => (
                  <span key={i} aria-hidden={i !== COLUMN.length - 1 ? true : undefined}>
                    {c}
                  </span>
                ))}
              </span>
            </span>
            <span>?</span>
          </span>
        </h1>
        <p className="addline a" style={{ animationDelay: "470ms" }}>
          Add them to <span className="badge">Kizuna</span>
        </p>
        <p className="lede a" style={{ animationDelay: "600ms" }}>
          One map for every friend, classmate and colleague you’ve met around the world. Save how to reach them and how you
          met.
        </p>
        <div className="ctas a" style={{ animationDelay: "720ms" }}>
          <Link href="/app" className="btn btn-red">
            Start my map <span className="arrow" aria-hidden="true">→</span>
          </Link>
          <a href="#how" className="btn btn-ghost">
            How it works
          </a>
        </div>

        <div className="preview" aria-label="Example of a Kizuna map">
          <div className="stats" style={{ marginTop: 0 }}>
            <div className="stat s-blue">
              <div className="stat-n">{countries}</div>
              <div className="stat-l">Countries</div>
            </div>
            <div className="stat s-ink">
              <div className="stat-n">{people}</div>
              <div className="stat-l">Connections</div>
            </div>
            <div className="stat s-red">
              <div className="stat-n">{continents}</div>
              <div className="stat-l">Continents</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <WorldMap fillOf={demoFill} lit={DEMO} baseDelay={1000} label="World map with example countries highlighted" />
          </div>
        </div>
      </section>

      <section id="how" className="section">
        <div className="container">
          <h2 className="h2 reveal">Your world, in three taps</h2>
          <div className="steps">
            <div className="reveal">
              <div className="step">
                <div className="step-n">01</div>
                <h3>Pick a country</h3>
                <p>Tap it on the map or search the list. All 250 countries and territories are there.</p>
              </div>
            </div>
            <div className="reveal">
              <div className="step">
                <div className="step-n">02</div>
                <h3>Save the person</h3>
                <p>Their name, where they live, a number or social handle, and how you met: work, uni or mutual friends.</p>
              </div>
            </div>
            <div className="reveal">
              <div className="step">
                <div className="step-n" style={{ color: "var(--red)" }}>
                  03
                </div>
                <h3>Watch your map fill in</h3>
                <p>See how many countries, people and continents your network spans, by where they’re from or where they live.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 24px 96px" }}>
        <div className="container closing reveal">
          <h2>One friend per country is still a whole world.</h2>
          <Link href="/app" className="btn btn-red">
            Add your first connection <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="foot">
          <span>© Kizuna</span>
          <Link href="/privacy">Privacy</Link>
        </div>
      </section>
    </main>
  );
}
