"use client";

import { useOnlineStatus } from "@/lib/pwa/offline";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-[9999] bg-[#0F1D2C] border-b-2 border-[#C9A96E] px-4 py-2.5 text-center"
    >
      <div className="flex items-center justify-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
        </span>
        <p className="text-sm font-medium text-[#F8F6F1]">
          You&apos;re offline &mdash; viewing cached content
        </p>
      </div>
    </div>
  );
}
