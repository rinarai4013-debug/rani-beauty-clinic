"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { clinicInfo } from "@/data/clinic-info";
import { AGGREGATE_RATING, REVIEW_COUNT } from "@/data/constants";
import { trackCTAClick } from "@/lib/analytics/events";

/**
 * Google Review CTA — encourages satisfied clients to leave a review.
 * Best placed after booking confirmations, on the results page, or
 * anywhere post-treatment satisfaction is high.
 *
 * Usage:
 *   <ReviewCTA location="thank_you_page" />
 */
export default function ReviewCTA({
  location,
  className = "",
}: {
  location: string;
  className?: string;
}) {
  const reviewUrl = clinicInfo.social.google;

  return (
    <div
      className={`rounded-2xl border border-rani-gold/30 bg-rani-cream p-8 text-center md:p-10 ${className}`}
    >
      {/* Star Rating */}
      <div className="flex items-center justify-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={22}
            className="fill-rani-gold text-rani-gold-accessible"
          />
        ))}
      </div>

      {/* Current Rating */}
      <p className="mt-3 font-body text-sm text-rani-muted">
        <span className="font-semibold text-rani-navy">{AGGREGATE_RATING} stars</span>{" "}
        from {REVIEW_COUNT}+ reviews on{" "}
        <span className="inline-flex items-baseline gap-1">
          <span
            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold leading-none"
            style={{
              background: "linear-gradient(135deg, #4285F4, #34A853, #FBBC05, #EA4335)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            aria-hidden="true"
          >
            G
          </span>
          Google
        </span>
      </p>

      {/* Headline */}
      <h3 className="mt-5 font-heading text-2xl font-bold text-rani-navy md:text-3xl">
        Love Your Results?
      </h3>

      {/* Subtext */}
      <p className="mx-auto mt-3 max-w-md font-body text-sm leading-relaxed text-rani-muted">
        Your feedback helps others discover the care they deserve. If you had a
        wonderful experience, we&apos;d be honored if you shared it on Google.
      </p>

      {/* CTA Buttons */}
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href={reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackCTAClick("Leave a Google Review", location, reviewUrl)
          }
          className="inline-flex items-center gap-2 rounded-lg bg-rani-gold px-6 py-3 font-body text-sm font-semibold text-rani-navy shadow-sm transition-all duration-200 hover:bg-rani-gold-light hover:shadow-md"
        >
          <Star size={16} className="fill-rani-navy text-rani-navy" />
          Leave a Google Review
        </a>

        <Link
          href="/results"
          onClick={() =>
            trackCTAClick("View All Reviews", location, "/results")
          }
          className="inline-flex items-center gap-1 rounded-lg border border-rani-border px-5 py-3 font-body text-sm font-medium text-rani-navy transition-colors duration-200 hover:border-rani-gold/50 hover:bg-white"
        >
          View All Results
        </Link>
      </div>
    </div>
  );
}
