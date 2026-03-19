"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Phone, MessageCircle } from "lucide-react";

/**
 * Enhanced sticky mobile CTA bar with glass-morphism effect.
 * Three equally-spaced actions: Book, Call, Chat.
 * CSS transitions instead of Framer Motion for zero JS bundle cost.
 */
export default function MobileCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    if (scrollY > 100) {
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

          if (currentScrollY < 100) {
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

  const openChat = () => {
    window.dispatchEvent(new CustomEvent("rani:open-chat"));
    setActiveButton("chat");
    setTimeout(() => setActiveButton(null), 300);
  };

  const handleBookClick = () => {
    setActiveButton("book");
    setTimeout(() => setActiveButton(null), 300);
  };

  const handleCallClick = () => {
    setActiveButton("call");
    setTimeout(() => setActiveButton(null), 300);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-300 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
      role="navigation"
      aria-label="Quick actions"
    >
      {/* Glass-morphism bar */}
      <div
        className="border-t border-white/10 bg-rani-navy/85 shadow-[0_-4px_30px_rgba(0,0,0,0.15)]"
        style={{
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        <div
          className="grid grid-cols-3 gap-1 px-4 pt-3"
          style={{
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          {/* Book Button */}
          <a
            href="https://booking.mangomint.com/876418"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleBookClick}
            className={`
              flex flex-col items-center justify-center gap-1 rounded-xl py-2
              transition-all duration-200 active:scale-95
              ${
                activeButton === "book"
                  ? "bg-rani-gold/20 text-rani-gold"
                  : "text-white/80 hover:text-rani-gold"
              }
            `}
            aria-label="Book an appointment"
          >
            <CalendarDays
              size={22}
              className={
                activeButton === "book"
                  ? "text-rani-gold"
                  : "text-white/80"
              }
            />
            <span className="font-body text-xs font-semibold">Book</span>
          </a>

          {/* Call Button */}
          <a
            href="tel:+14255394440"
            onClick={handleCallClick}
            className={`
              flex flex-col items-center justify-center gap-1 rounded-xl py-2
              transition-all duration-200 active:scale-95
              ${
                activeButton === "call"
                  ? "bg-rani-gold/20 text-rani-gold"
                  : "text-white/80 hover:text-rani-gold"
              }
            `}
            aria-label="Call the clinic"
          >
            <Phone
              size={22}
              className={
                activeButton === "call"
                  ? "text-rani-gold"
                  : "text-white/80"
              }
            />
            <span className="font-body text-xs font-semibold">Call</span>
          </a>

          {/* Chat Button */}
          <button
            onClick={openChat}
            className={`
              flex flex-col items-center justify-center gap-1 rounded-xl py-2
              transition-all duration-200 active:scale-95
              ${
                activeButton === "chat"
                  ? "bg-rani-gold/20 text-rani-gold"
                  : "text-white/80 hover:text-rani-gold"
              }
            `}
            aria-label="Open AI chat"
          >
            <MessageCircle
              size={22}
              className={
                activeButton === "chat"
                  ? "text-rani-gold"
                  : "text-white/80"
              }
            />
            <span className="font-body text-xs font-semibold">Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
