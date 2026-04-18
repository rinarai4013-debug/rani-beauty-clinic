"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { trackCTAClick, trackBookingOpen } from "@/lib/analytics/events";
import { clinicInfo } from "@/data/clinic-info";

/**
 * Displays context-aware urgency messaging for consultation booking.
 * Shows limited availability and time-based messaging to drive action.
 *
 * NOT fake scarcity — uses time-of-day and day-of-week logic
 * to surface relevant scheduling pressure.
 */
export default function ConsultationUrgency({ className = "" }: { className?: string }) {
  const [message, setMessage] = useState<string>("");
  const [subtext, setSubtext] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday

    // Context-aware urgency messaging
    if (day === 0 || day === 6) {
      // Weekend
      setMessage("Weekend appointments fill fast");
      setSubtext("Book now for priority scheduling next week");
    } else if (hour < 12) {
      // Morning
      setMessage("Same-week consultations available");
      setSubtext("Morning slots go first — secure yours today");
    } else if (hour < 17) {
      // Afternoon
      setMessage("Limited evening slots this week");
      setSubtext("Book today to lock in your preferred time");
    } else {
      // Evening
      setMessage("Booking for tomorrow and beyond");
      setSubtext("Reserve your spot before the week fills up");
    }
  }, []);

  if (!message) return null;

  return (
    <div className={`rounded-xl border border-rani-gold/20 bg-gradient-to-r from-rani-gold/5 to-transparent px-5 py-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rani-gold/10">
          <Clock size={18} className="text-rani-gold-accessible" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-bold text-rani-navy">{message}</p>
          <p className="font-body text-xs text-rani-muted">{subtext}</p>
        </div>
        <a
          href={clinicInfo.booking.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { trackCTAClick('Book Now', 'urgency_banner', clinicInfo.booking.url); trackBookingOpen('urgency_banner'); }}
          className="shrink-0 rounded-full bg-rani-gold px-5 py-2 font-body text-xs font-bold text-rani-navy transition-colors hover:bg-rani-gold-light whitespace-nowrap"
        >
          Book Now
        </a>
      </div>
    </div>
  );
}
