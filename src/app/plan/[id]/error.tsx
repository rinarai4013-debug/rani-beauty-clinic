"use client";

import { useEffect } from "react";

export default function TreatmentPlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Treatment plan error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
        </div>

        <h1 className="font-heading text-2xl font-bold text-rani-navy sm:text-3xl">
          We Couldn&apos;t Load Your Treatment Plan
        </h1>

        <div className="mx-auto mt-3 h-0.5 w-12 bg-rani-gold" />

        <p className="mt-4 font-body text-base text-rani-muted">
          There was an issue loading your personalized treatment plan. Please try
          again or reach out to us directly.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-left text-xs text-red-700">
            <p className="font-semibold">Dev Error:</p>
            <p className="mt-1 break-words">{error.message}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-rani-gold px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-rani-navy transition-colors hover:bg-rani-gold-light"
          >
            Try Again
          </button>

          <a
            href="/contact"
            className="inline-block rounded-lg border-2 border-rani-navy px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-rani-navy transition-colors hover:bg-rani-navy hover:text-white"
          >
            Contact Us
          </a>
        </div>

        {/* Phone contact */}
        <div className="mt-8 rounded-lg border border-rani-border bg-white p-4">
          <p className="font-body text-sm text-rani-muted">
            Need immediate assistance?
          </p>
          <a
            href="tel:+14259052410"
            className="mt-1 inline-block font-body text-base font-semibold text-rani-navy"
          >
            (425) 905-2410
          </a>
        </div>
      </div>
    </div>
  );
}
