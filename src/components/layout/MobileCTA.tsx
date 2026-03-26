"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

/**
 * Simplified sticky mobile CTA bar - single full-width gold booking button.
 * Appears after scrolling past hero, hidden on md+ breakpoints.
 */
export default function MobileCTA() {
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    if (scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDelta = currentScrollY - lastScrollY;

          if (currentScrollY < 300) {
            setIsVisible(false);
          } else if (scrollDelta > 5) {
            setIsVisible(true);
          } else if (scrollDelta < -15) {
            setIsVisible(false);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [handleScroll]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          role="navigation"
          aria-label="Book appointment"
        >
          <div
            className="border-t border-white/10 bg-rani-navy/90"
            style={{
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }}
          >
            <div
              className="px-4 pt-2"
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              <a
                href="https://booking.mangomint.com/ranibeautyclinic1"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackAnalyticsEvent("cta_click", {
                    cta_text: "Book Your Consultation",
                    cta_location: "mobile_sticky_bar",
                  });
                }}
                className="flex h-[52px] w-full items-center justify-center rounded-xl bg-rani-gold font-body text-sm font-bold uppercase tracking-wider text-rani-navy transition-colors active:bg-rani-gold-light active:scale-[0.98]"
              >
                Book Your Consultation
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
