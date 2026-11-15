"use client";

import { useEffect, useRef, useState } from "react";

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Animates a number from its previous value to `target` (ease-out cubic). */
export function useCountUp(target: number, { delay = 0, duration = 900 } = {}) {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reduced()) {
      from.current = target;
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }
    const start = performance.now() + delay;
    const a = from.current;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - start) / duration));
      const v = Math.round(a + (target - a) * (1 - Math.pow(1 - p, 3)));
      from.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, duration]);

  return value;
}
