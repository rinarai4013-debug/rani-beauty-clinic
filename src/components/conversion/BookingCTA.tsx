"use client";

import { clinicInfo } from "@/data/clinic-info";
import { trackCTAClick, trackBookingOpen, trackPhoneClick } from "@/lib/analytics/events";

/**
 * Reusable inline booking CTA with book + call options.
 * Use anywhere you want to offer a booking opportunity mid-page.
 *
 * Usage:
 *   <BookingCTA location="service_page_sofwave" />
 */
export default function BookingCTA({
  location,
  text = "Book Your Consultation",
  showPhone = true,
  className = "",
}: {
  location: string;
  text?: string;
  showPhone?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href={clinicInfo.booking.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          trackCTAClick(text, location, clinicInfo.booking.url);
          trackBookingOpen(location);
        }}
        className="inline-flex items-center gap-2 rounded-full bg-rani-gold px-6 py-2.5 font-body text-sm font-bold text-rani-navy transition-colors hover:bg-rani-gold-light"
      >
        {text}
      </a>
      {showPhone && (
        <a
          href={clinicInfo.phoneTel}
          onClick={() => trackPhoneClick(location)}
          className="font-body text-sm text-rani-muted transition-colors hover:text-rani-navy"
        >
          or call {clinicInfo.phone}
        </a>
      )}
    </div>
  );
}
