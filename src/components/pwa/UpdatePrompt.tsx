"use client";

import { useState, useEffect } from "react";
import { onUpdateAvailable, skipWaiting } from "@/lib/pwa/register";

export default function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    onUpdateAvailable(() => {
      setShowUpdate(true);
    });
  }, []);

  if (!showUpdate) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-4 left-4 right-4 z-[9998] mx-auto max-w-md rounded-xl bg-[#0F1D2C] p-4 shadow-2xl border border-[#C9A96E]/30"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C9A96E]/20">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-[#C9A96E]">
            <path d="M9 1V9M9 9L5.5 5.5M9 9L12.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 9 9)"/>
            <path d="M3 12V14C3 15.1046 3.89543 16 5 16H13C14.1046 16 15 15.1046 15 14V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 9 9)"/>
          </svg>
        </div>

        <p className="flex-1 text-sm text-[#F8F6F1]">
          A new version is available
        </p>

        <button
          onClick={skipWaiting}
          className="shrink-0 rounded-lg bg-[#C9A96E] px-3 py-1.5 text-xs font-semibold text-[#0F1D2C] transition-colors hover:bg-[#C9A96E]/90"
        >
          Update now
        </button>
      </div>
    </div>
  );
}
