"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <>
      <style jsx global>{`
        @keyframes errorFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div
          style={{ animation: "errorFadeIn 0.5s ease-out" }}
          className="w-full max-w-md"
        >
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rani-gold/20">
            <svg
              className="h-8 w-8 text-rani-navy"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h1 className="font-heading text-3xl font-bold text-rani-navy">
            We Hit a Snag
          </h1>

          <div className="mx-auto mt-3 h-0.5 w-12 bg-rani-gold" />

          <p className="mt-4 font-body text-base text-rani-muted">
            Something didn&apos;t go as planned. Let&apos;s get you back on
            track.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-left text-xs text-red-700">
              <p className="font-semibold">Dev Error:</p>
              <p className="mt-1 break-words">{error.message}</p>
              {error.digest && (
                <p className="mt-1">
                  <span className="font-semibold">Digest:</span> {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => reset()}
              className="rounded-lg bg-rani-gold px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-rani-navy transition-colors hover:bg-rani-gold-light"
            >
              Try Again
            </button>

            <button
              onClick={() => router.push("/")}
              className="rounded-lg border-2 border-rani-navy px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-rani-navy transition-colors hover:bg-rani-navy hover:text-white"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
