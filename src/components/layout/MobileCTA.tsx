"use client";

import { Phone, CalendarDays } from "lucide-react";
import { clinicInfo } from "@/data/clinic-info";
import Link from "next/link";

export default function MobileCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-rani-navy/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.1)] lg:hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <a
          href={clinicInfo.phoneTel}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-rani-gold py-2.5 font-body text-sm font-semibold text-rani-gold transition-colors hover:bg-rani-gold hover:text-rani-navy"
        >
          <Phone size={16} />
          Call Now
        </a>
        <Link
          href="/contact"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rani-gold py-2.5 font-body text-sm font-semibold text-rani-navy transition-colors hover:bg-rani-gold-light"
        >
          <CalendarDays size={16} />
          Book Now
        </Link>
      </div>
    </div>
  );
}
