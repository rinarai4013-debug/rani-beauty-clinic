"use client";

import { Phone } from "lucide-react";
import { clinicInfo } from "@/data/clinic-info";

/**
 * Sticky bottom CTA bar — visible on mobile only (< lg breakpoint).
 * Renders a full-width Book + Call bar fixed to the bottom of the viewport.
 * Add pb-[72px] to the page's last section so content isn't hidden behind it.
 */
export default function StickyBookBar() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#C9A96E]/20 bg-[#0F1D2C]/98 backdrop-blur-sm px-4 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        <a
          href={clinicInfo.booking.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center rounded-lg bg-[#C9A96E] min-h-[48px] text-sm font-semibold text-[#0F1D2C] transition hover:bg-[#b8984f]"
        >
          Book Now
        </a>
        <a
          href={clinicInfo.phoneTel}
          className="flex items-center justify-center rounded-lg border border-white/20 min-h-[48px] min-w-[48px] px-4 gap-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">Call</span>
        </a>
      </div>
    </div>
  );
}
