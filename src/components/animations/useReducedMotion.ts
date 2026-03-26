import { useState, useEffect } from "react";

/**
 * useReducedMotion
 *
 * Custom hook that returns `true` when the user's OS/browser has the
 * `prefers-reduced-motion: reduce` media query active.
 *
 * Reacts to live changes - if the user toggles the setting while the
 * page is open the returned value updates immediately.
 *
 * Safe for SSR: defaults to `false` (animations enabled) on the server
 * and hydrates correctly on the client.
 *
 * @returns `true` if the user prefers reduced motion, `false` otherwise.
 *
 * @example
 * ```tsx
 * const prefersReduced = useReducedMotion();
 * return (
 *   <motion.div
 *     animate={{ opacity: 1, y: prefersReduced ? 0 : 20 }}
 *     transition={{ duration: prefersReduced ? 0 : 0.6 }}
 *   />
 * );
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Set the initial value from the live query
    setPrefersReduced(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReduced;
}
