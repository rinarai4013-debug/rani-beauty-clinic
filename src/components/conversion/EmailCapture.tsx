"use client";

import { useState, type FormEvent } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

interface EmailCaptureProps {
  /** "compact" for footer placement, "full" for standalone section */
  variant?: "compact" | "full";
}

const STORAGE_KEY = "rani_email_subscribers";

function storeEmail(email: string) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!existing.includes(email)) {
      existing.push(email);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
  } catch {
    // localStorage unavailable — fail silently
  }
}

export default function EmailCapture({ variant = "full" }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || status === "submitting") return;

    setStatus("submitting");

    try {
      storeEmail(email);

      trackAnalyticsEvent("lead_submitted", {
        form_type: "email_capture",
        lead_source: `newsletter_${variant}`,
        source: "email_capture",
      });

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  /* ── Compact variant (footer) ────────────────────────────────── */
  if (variant === "compact") {
    return (
      <div className="border-b border-rani-gold/10 bg-rani-navy">
        <div className="mx-auto max-w-7xl px-6 py-10 md:py-12">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            {/* Copy */}
            <div className="text-center md:text-left">
              <h3 className="font-heading text-lg font-semibold text-white tracking-wide">
                Exclusive Beauty Intelligence
              </h3>
              <p className="mt-1 font-body text-sm text-gray-400 max-w-md">
                Physician-curated treatment insights, expert skincare guidance,
                and member-only offers delivered to your inbox.
              </p>
            </div>

            {/* Form */}
            <div className="w-full max-w-md">
              {status === "success" ? (
                <p className="font-body text-sm text-rani-gold text-center md:text-right">
                  Welcome to the inner circle. Watch your inbox.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    aria-label="Email address"
                    className="flex-1 rounded-md border border-rani-gold/20 bg-white/5 px-4 py-2.5
                      font-body text-sm text-white placeholder:text-gray-500
                      focus:border-rani-gold/50 focus:outline-none focus:ring-1 focus:ring-rani-gold/30
                      transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="shrink-0 rounded-md bg-rani-gold px-5 py-2.5
                      font-body text-sm font-medium text-rani-navy
                      hover:bg-rani-gold/90 focus:outline-none focus:ring-2 focus:ring-rani-gold/50
                      disabled:opacity-60 transition-colors"
                  >
                    {status === "submitting" ? "Joining..." : "Subscribe"}
                  </button>
                </form>
              )}
              {status === "error" && (
                <p className="mt-2 font-body text-xs text-red-400 text-center md:text-right">
                  Something went wrong. Please try again.
                </p>
              )}
              {status !== "success" && (
                <p className="mt-2 font-body text-[11px] text-gray-500 text-center md:text-right">
                  No spam. Unsubscribe anytime. We respect your privacy.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Full variant (section) ──────────────────────────────────── */
  return (
    <section className="bg-rani-cream">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20 text-center">
        {/* Decorative accent */}
        <div className="mx-auto mb-6 h-px w-16 bg-rani-gold/40" />

        <h2 className="font-heading text-2xl font-semibold text-rani-navy tracking-wide md:text-3xl">
          Exclusive Beauty Intelligence
        </h2>
        <p className="mt-4 mx-auto max-w-lg font-body text-base text-gray-600 leading-relaxed">
          Join our curated list for physician-led treatment insights, expert
          skincare science, and exclusive offers reserved for subscribers only.
        </p>

        {/* Form / Success */}
        <div className="mt-8 mx-auto max-w-md">
          {status === "success" ? (
            <div className="rounded-lg border border-rani-gold/20 bg-white px-6 py-5">
              <p className="font-heading text-lg font-semibold text-rani-navy">
                Welcome to the inner circle.
              </p>
              <p className="mt-1 font-body text-sm text-gray-500">
                Your first edition of Beauty Intelligence is on its way.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Email address"
                className="flex-1 rounded-md border border-rani-gold/30 bg-white px-4 py-3
                  font-body text-sm text-rani-navy placeholder:text-gray-400
                  focus:border-rani-gold focus:outline-none focus:ring-2 focus:ring-rani-gold/20
                  transition-colors"
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                className="shrink-0 rounded-md bg-rani-gold px-6 py-3
                  font-body text-sm font-semibold text-rani-navy uppercase tracking-wider
                  hover:bg-rani-gold/90 focus:outline-none focus:ring-2 focus:ring-rani-gold/50
                  disabled:opacity-60 transition-colors"
              >
                {status === "submitting" ? "Joining..." : "Subscribe"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="mt-3 font-body text-sm text-red-500">
              Something went wrong. Please try again.
            </p>
          )}
          {status !== "success" && (
            <p className="mt-3 font-body text-xs text-gray-400">
              No spam, ever. Unsubscribe anytime. We respect your privacy.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
