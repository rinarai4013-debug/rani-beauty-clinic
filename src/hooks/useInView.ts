import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Options accepted by the `useInView` hook.
 */
interface UseInViewOptions {
  /**
   * A number between 0 and 1 indicating how much of the element must be
   * visible before the observer fires. Defaults to `0.15` (15%).
   */
  threshold?: number;

  /**
   * When `true` the observer disconnects after the element enters the
   * viewport for the first time, so the callback only fires once.
   * Defaults to `true`.
   */
  triggerOnce?: boolean;

  /**
   * Margin around the root element (viewport) that expands or contracts
   * the intersection rectangle. Uses the CSS margin shorthand format,
   * e.g. `"-100px 0px"`.  Defaults to `"0px"`.
   */
  rootMargin?: string;
}

/**
 * useInView - performant scroll-triggered visibility detection.
 *
 * Uses the native `IntersectionObserver` API (no Framer Motion overhead)
 * which is ideal when you have many elements on a page that need
 * entrance animations or lazy behaviour.
 *
 * @returns A tuple of `[ref, isInView]`.
 *   - Attach `ref` to the DOM element you want to observe.
 *   - `isInView` is `true` when the element satisfies the threshold.
 *
 * @example
 * ```tsx
 * function Section() {
 *   const [ref, isInView] = useInView({ threshold: 0.2, triggerOnce: true });
 *   return (
 *     <div
 *       ref={ref}
 *       className={isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
 *       style={{ transition: "all 0.6s ease-out" }}
 *     >
 *       Content fades in when 20% visible.
 *     </div>
 *   );
 * }
 * ```
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): [React.RefCallback<T>, boolean] {
  const { threshold = 0.15, triggerOnce = true, rootMargin = "0px" } = options;

  const [isInView, setIsInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<T | null>(null);
  // Track whether we have already triggered (for triggerOnce mode)
  const hasTriggeredRef = useRef(false);

  // Cleanup helper
  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Ref callback: called whenever React attaches/detaches the element
  const setRef = useCallback(
    (node: T | null) => {
      // Disconnect any existing observer
      disconnect();

      elementRef.current = node;

      // If triggerOnce already fired, nothing to do
      if (triggerOnce && hasTriggeredRef.current) return;

      if (!node) return;

      // SSR guard
      if (typeof IntersectionObserver === "undefined") {
        setIsInView(true);
        return;
      }

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          const visible = entry.isIntersecting;
          setIsInView(visible);

          if (visible && triggerOnce) {
            hasTriggeredRef.current = true;
            disconnect();
          }
        },
        { threshold, rootMargin }
      );

      observerRef.current.observe(node);
    },
    [threshold, triggerOnce, rootMargin, disconnect]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return [setRef, isInView];
}
