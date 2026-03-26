"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronDown, List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  /* ── Collect headings on mount ─────────────────────────── */
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLHeadingElement>("article h2, article h3, main h2, main h3")
    );

    const items: TocItem[] = elements
      .filter((el) => {
        // Skip headings that already have an id or are inside nav elements
        if (el.closest("nav")) return false;
        return true;
      })
      .map((el) => {
        // Assign an id if one doesn't exist
        if (!el.id) {
          el.id = el.textContent
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") ?? "";
        }
        return {
          id: el.id,
          text: el.textContent ?? "",
          level: el.tagName === "H2" ? (2 as const) : (3 as const),
        };
      })
      .filter((item) => item.id && item.text);

    setHeadings(items);
  }, []);

  /* ── IntersectionObserver for scroll spy ────────────────── */
  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    // Find the first visible heading
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

    if (visible.length > 0) {
      setActiveId(visible[0].target.id);
    }
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: "-80px 0px -60% 0px",
      threshold: 0.1,
    });

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings, handleIntersect]);

  /* ── Smooth-scroll handler ─────────────────────────────── */
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const offset = 100; // account for sticky navbar
    const top = el.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top, behavior: "smooth" });
    setActiveId(id);
    setIsOpen(false); // collapse on mobile after click
  };

  if (headings.length < 2) return null;

  return (
    <>
      {/* ── Mobile: collapsible TOC ────────────────────────── */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-lg bg-rani-cream px-4 py-3 text-sm font-semibold text-rani-navy"
          aria-expanded={isOpen}
          aria-controls="toc-mobile-list"
        >
          <span className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Table of Contents
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <nav
            id="toc-mobile-list"
            aria-label="Table of contents"
            className="mt-2 rounded-lg bg-rani-cream px-4 py-3"
          >
            <ul className="space-y-1">
              {headings.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => scrollTo(h.id)}
                    className={`block w-full text-left text-sm transition-colors duration-150 rounded px-2 py-1.5 ${
                      h.level === 3 ? "pl-5" : ""
                    } ${
                      activeId === h.id
                        ? "bg-rani-gold/30 text-rani-navy font-semibold"
                        : "text-rani-muted hover:text-rani-navy hover:bg-rani-gold/10"
                    }`}
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* ── Desktop: sticky sidebar ────────────────────────── */}
      <nav
        aria-label="Table of contents"
        className="hidden lg:block sticky top-[100px] max-h-[calc(100vh-140px)] overflow-y-auto rounded-xl bg-rani-cream p-5"
      >
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rani-muted">
          <List className="h-3.5 w-3.5" />
          On this page
        </p>

        <ul className="space-y-0.5">
          {headings.map((h) => (
            <li key={h.id} className="relative">
              {/* Gold active indicator bar */}
              {activeId === h.id && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-rani-gold"
                  aria-hidden="true"
                />
              )}
              <button
                onClick={() => scrollTo(h.id)}
                className={`block w-full text-left text-sm transition-colors duration-150 rounded px-3 py-1.5 ${
                  h.level === 3 ? "pl-6" : ""
                } ${
                  activeId === h.id
                    ? "text-rani-navy font-semibold"
                    : "text-rani-muted hover:text-rani-navy"
                }`}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
