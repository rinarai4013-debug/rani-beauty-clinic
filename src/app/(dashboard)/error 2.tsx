"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Dashboard error:", error);
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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="font-heading text-2xl font-bold text-rani-navy sm:text-3xl">
          Dashboard Error
        </h1>

        <div className="mx-auto mt-3 h-0.5 w-12 bg-rani-gold" />

        <p className="mt-4 font-body text-base text-rani-muted">
          Something went wrong loading the dashboard. Try again or log in fresh.
        </p>

        {/* Always show error details for internal tool */}
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-left text-sm text-red-700">
          <p className="font-semibold">Error Details:</p>
          <p className="mt-1 break-words">{error.message}</p>
          {error.digest && (
            <p className="mt-1 text-xs text-red-500">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-rani-navy px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          >
            Try Again
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border-2 border-rani-navy px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-rani-navy transition-colors hover:bg-rani-navy hover:text-white"
          >
            Return to Dashboard
          </button>

          <button
            onClick={() => router.push("/dashboard/login")}
            className="rounded-lg border-2 border-rani-muted px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-rani-muted transition-colors hover:border-rani-navy hover:text-rani-navy"
          >
            Login Again
          </button>
        </div>
      </div>
    </div>
  );
}
