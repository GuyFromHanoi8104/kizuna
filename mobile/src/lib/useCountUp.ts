import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Animates a number from its previous value to `target` (ease-out cubic). */
export function useCountUp(target: number, delay = 0, duration = 900) {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        from.current = target;
        setValue(target);
        return;
      }
      const start = Date.now() + delay;
      const a = from.current;
      const step = () => {
        const p = Math.max(0, Math.min(1, (Date.now() - start) / duration));
        const v = Math.round(a + (target - a) * (1 - Math.pow(1 - p, 3)));
        from.current = v;
        setValue(v);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [target, delay, duration]);

  return value;
}
