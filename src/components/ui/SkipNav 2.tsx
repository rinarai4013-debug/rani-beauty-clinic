"use client";

/**
 * SkipNav - Accessible "Skip to main content" link.
 *
 * Visually hidden until focused (Tab key), then appears as a fixed
 * top-left overlay with gold background and navy text.  Clicking it
 * moves keyboard focus to <main id="main-content">.
 *
 * Usage: render <SkipNav /> as the first child inside <body>.
 * Ensure the <main> element has id="main-content".
 */
export default function SkipNav() {
  return (
    <a
      href="#main-content"
      className="
        fixed left-4 top-4 z-[9999]
        -translate-y-full
        rounded-lg bg-rani-gold px-6 py-3
        font-body text-sm font-bold text-rani-navy
        shadow-lg
        transition-transform duration-200 ease-out
        focus:translate-y-0
        focus:outline-none focus:ring-2 focus:ring-rani-navy focus:ring-offset-2
      "
    >
      Skip to main content
    </a>
  );
}
