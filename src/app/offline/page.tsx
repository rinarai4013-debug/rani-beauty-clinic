"use client";

import { useCallback } from "react";

export default function OfflinePage() {
  const handleRetry = useCallback(() => {
    window.location.href = "/";
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F6F1] px-6 text-center">
      {/* Brand icon */}
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0F1D2C] shadow-lg">
        <span className="font-serif text-4xl font-bold text-[#C9A96E]">R</span>
      </div>

      <h1 className="font-serif text-3xl font-bold text-[#0F1D2C]">
        You&apos;re Offline
      </h1>

      <p className="mt-3 max-w-sm text-base text-[#0F1D2C]/70">
        It looks like you&apos;ve lost your internet connection. Some features
        may be limited, but previously viewed pages are still available.
      </p>

      {/* Cached content info */}
      <div className="mt-8 w-full max-w-sm rounded-xl border border-[#0F1D2C]/10 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#0F1D2C]/50">
          Available Offline
        </h2>
        <ul className="mt-3 space-y-2 text-left text-sm text-[#0F1D2C]/80">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
            Previously visited pages
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
            Service information
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
            Treatment details
          </li>
        </ul>
      </div>

      <button
        onClick={handleRetry}
        className="mt-8 rounded-xl bg-[#0F1D2C] px-8 py-3 text-sm font-semibold text-[#F8F6F1] shadow-lg transition-all hover:bg-[#0F1D2C]/90 hover:shadow-xl active:scale-[0.98]"
      >
        Try Again
      </button>

      <p className="mt-4 text-xs text-[#0F1D2C]/40">
        Rani Beauty Clinic &mdash; ranibeautyclinic.com
      </p>
    </div>
  );
}
