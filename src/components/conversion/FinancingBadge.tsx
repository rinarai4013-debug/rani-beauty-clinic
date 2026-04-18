"use client";

import { CreditCard } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

/**
 * Reusable financing callout for high-ticket services.
 * Shows monthly payment estimate to reduce sticker shock.
 *
 * Usage:
 *   <FinancingBadge serviceName="Sofwave" monthlyFrom={230} />
 */
export default function FinancingBadge({
  serviceName,
  monthlyFrom,
  className = "",
}: {
  serviceName: string;
  monthlyFrom: number;
  className?: string;
}) {
  return (
    <a
      href="/contact"
      onClick={() =>
        trackAnalyticsEvent("plan_financing_clicked", {
          service_name: serviceName,
          value: monthlyFrom,
        })
      }
      className={`inline-flex items-center gap-2 rounded-full border border-rani-gold/30 bg-rani-gold/5 px-4 py-1.5 font-body text-xs text-rani-navy transition-colors hover:bg-rani-gold/10 ${className}`}
    >
      <CreditCard size={14} className="text-rani-gold-accessible" />
      <span>
        From <span className="font-bold text-rani-gold-accessible">${monthlyFrom}/mo</span> with financing
      </span>
    </a>
  );
}
