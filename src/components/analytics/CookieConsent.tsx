"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "rani_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      applyConsent(stored === "all");
      return;
    }
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  function applyConsent(acceptAll: boolean) {
    if (typeof window === "undefined") return;
    if (acceptAll) {
      window.fbq?.("consent", "grant");
      window.clarity?.("consent");
    } else {
      window.fbq?.("consent", "revoke");
      window.dataLayer?.push({ event: "cookie_consent_essential_only" });
    }
  }

  function handleAcceptAll() {
    localStorage.setItem(CONSENT_KEY, "all");
    applyConsent(true);
    setVisible(false);
  }

  function handleEssentialOnly() {
    localStorage.setItem(CONSENT_KEY, "essential");
    applyConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] transform transition-transform duration-500 translate-y-0">
      <div className="bg-[#0F1D2C] border-t border-[#C9A96E]/30 px-4 py-4 sm:px-6 sm:py-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="text-sm text-[#FAF8F5]/80 flex-1">
            We use cookies to enhance your experience, analyze site traffic, and personalize content.{" "}
            <Link href="/privacy-policy" className="text-[#C9A96E] underline hover:text-[#D4B87A]">
              Privacy Policy
            </Link>
          </p>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleEssentialOnly}
              className="px-5 py-2 text-sm font-medium border border-[#C9A96E] text-[#C9A96E] rounded-full hover:bg-[#C9A96E]/10 transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-5 py-2 text-sm font-medium bg-[#C9A96E] text-[#0F1D2C] rounded-full hover:bg-[#D4B87A] transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
