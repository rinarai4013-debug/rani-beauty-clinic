"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated count-up hook. Animates from 70% of target to target
 * when the element comes into view.
 *
 * Initial value is 0 (not target) so the count-up animation is
 * visible and avoids SSR hydration mismatches.
 */
export function useCountUp(
  target: number,
  isInView: boolean,
  options?: { duration?: number; isDecimal?: boolean }
): string {
  const { duration = 1200, isDecimal = false } = options || {};
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startFrom = target * 0.7;
    const range = target - startFrom;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startFrom + eased * range);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    }

    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  if (isDecimal) {
    return value.toFixed(1);
  }
  return Math.floor(value).toLocaleString();
}
