"use client";

import { ReactNode, createContext, useContext, useMemo } from "react";
import { MotionConfig } from "framer-motion";
import { useReducedMotion } from "./useReducedMotion";

// Re-export the hook from its dedicated file so consumers can import from
// either location.
export { useReducedMotion } from "./useReducedMotion";

interface ReducedMotionProviderProps {
  children: ReactNode;
}

/**
 * Context that exposes the current reduced-motion preference.
 * Components deep in the tree can read this without needing the hook.
 */
const ReducedMotionContext = createContext<boolean>(false);

export function useReducedMotionContext(): boolean {
  return useContext(ReducedMotionContext);
}

/**
 * ReducedMotionProvider
 *
 * Wraps the application (or a subtree) and:
 * 1. Detects the user's `prefers-reduced-motion` system preference.
 * 2. When reduced motion is preferred, configures Framer Motion's
 *    <MotionConfig> to set `reducedMotion="always"`, which causes all
 *    `motion.*` components within the subtree to skip animations
 *    (transitions resolve instantly, initial/animate collapse, etc.).
 * 3. Provides a React context so any descendant can check whether
 *    reduced motion is active via `useReducedMotionContext()`.
 *
 * Usage:
 *   // In your root layout or providers wrapper:
 *   <ReducedMotionProvider>
 *     <App />
 *   </ReducedMotionProvider>
 *
 *   // In any descendant:
 *   const prefersReduced = useReducedMotionContext();
 */
export default function ReducedMotionProvider({
  children,
}: ReducedMotionProviderProps) {
  const prefersReduced = useReducedMotion();

  const motionReduceSetting = useMemo(
    () => (prefersReduced ? "always" : "never") as "always" | "never",
    [prefersReduced]
  );

  return (
    <ReducedMotionContext.Provider value={prefersReduced}>
      <MotionConfig reducedMotion={motionReduceSetting}>
        {children}
      </MotionConfig>
    </ReducedMotionContext.Provider>
  );
}
