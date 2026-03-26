"use client";

import { useState, useEffect, useCallback } from "react";
import {
  onInstallPromptAvailable,
  promptInstall,
  isAppInstalled,
} from "@/lib/pwa/register";

export default function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or previously dismissed this session
    if (isAppInstalled()) return;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("rani-pwa-dismissed")) return;

    onInstallPromptAvailable(() => {
      setShowBanner(true);
    });
  }, []);

  const handleInstall = useCallback(async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setShowBanner(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setShowBanner(false);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("rani-pwa-dismissed", "1");
    }
  }, []);

  if (!showBanner || dismissed) return null;

  return (
    <div
      role="banner"
      aria-label="Install app prompt"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl bg-[#0F1D2C] p-4 shadow-2xl border border-[#C9A96E]/30 animate-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#C9A96E]/20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#C9A96E]">
            <path d="M12 2L12 15M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#F8F6F1]">
            Add Rani Beauty to Home Screen
          </p>
          <p className="mt-0.5 text-xs text-[#F8F6F1]/70">
            Quick access to bookings, services &amp; exclusive offers
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="rounded-lg bg-[#C9A96E] px-4 py-1.5 text-xs font-semibold text-[#0F1D2C] transition-colors hover:bg-[#C9A96E]/90"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg px-4 py-1.5 text-xs font-medium text-[#F8F6F1]/60 transition-colors hover:text-[#F8F6F1]"
            >
              Not now
            </button>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 text-[#F8F6F1]/40 hover:text-[#F8F6F1] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
