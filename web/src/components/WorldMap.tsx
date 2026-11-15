"use client";

import { memo } from "react";
import { DOTS, SHAPES, shapeX } from "@/lib/world";

type Props = {
  /** fill color per country code */
  fillOf: (code: string) => string;
  /** countries that should "light up" after the gray map has drawn (landing preview) */
  lit?: Set<string>;
  onPick?: (code: string) => void;
  /** whether to show a dot for a tiny country (no shape at this scale) */
  showDot?: (code: string) => boolean;
  baseDelay?: number;
  label: string;
};

function WorldMap({ fillOf, lit, onPick, showDot, baseDelay = 500, label }: Props) {
  const delay = (x: number) => Math.round(baseDelay + x * 0.8);
  return (
    <svg viewBox="0 0 1000 500" className="map" role="img" aria-label={label}>
      {SHAPES.map((s) => {
        const d = delay(shapeX(s.d));
        const isLit = lit?.has(s.code);
        return (
          <path
            key={s.code}
            d={s.d}
            className={`land${isLit ? " lit" : ""}${onPick ? " click" : ""}`}
            style={{
              fill: fillOf(s.code),
              animationDelay: isLit ? `${d}ms, ${d + 500}ms` : `${d}ms`,
            }}
            onClick={onPick ? () => onPick(s.code) : undefined}
          />
        );
      })}
      {showDot &&
        DOTS.map((p) => {
          const on = showDot(p.code);
          return (
            <circle
              key={p.code}
              cx={p.x}
              cy={p.y}
              r={on ? 5 : 2.5}
              className={`land dot${onPick ? " click" : ""}`}
              style={{ fill: on ? fillOf(p.code) : "#C9D3DE", animationDelay: `${delay(p.x)}ms` }}
              onClick={onPick ? () => onPick(p.code) : undefined}
            />
          );
        })}
    </svg>
  );
}

export default memo(WorldMap);
