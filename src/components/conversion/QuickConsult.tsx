"use client";

import { useState, type FormEvent } from "react";
import { Phone, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

const SERVICES = [
  "Botox & Dysport",
  "Dermal Fillers",
  "Laser Hair Removal",
  "HydraFacial",
  "RF Microneedling",
  "Chemical Peels",
  "Sofwave Skin Tightening",
  "GLP-1 Weight Management",
  "NAD+ Injections",
  "Hormone Therapy",
  "Not Sure - Help Me Choose",
] as const;

const CALL_TIMES = ["Morning", "Afternoon", "Evening"] as const;

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function QuickConsult() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [callTime, setCallTime] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: "callback-request@ranibeautyclinic.com",
          phone: phone.trim(),
          service: service || "General Consultation",
          message: `Callback request — preferred time: ${callTime || "Any time"}. Submitted via Quick Consult form.`,
          honeypot,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      trackAnalyticsEvent("lead_submitted", {
        form_type: "quick_consult",
        service: service || "General Consultation",
      });

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <FadeInOnScroll>
        <div className="rounded-2xl border border-rani-gold/30 bg-gradient-to-br from-rani-cream to-white p-8 text-center md:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rani-gold/10">
            <CheckCircle size={32} className="text-rani-gold" />
          </div>
          <h3 className="mt-6 font-heading text-2xl font-bold text-rani-navy">
            Thank You, {name.split(" ")[0]}
          </h3>
          <p className="mx-auto mt-3 max-w-md font-body text-sm leading-relaxed text-rani-muted">
            We&apos;ll call you within 2 hours during business hours. Our aesthetic
            team will help you find the perfect treatment plan for your goals.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-rani-navy/5 px-5 py-2.5">
            <Phone size={14} className="text-rani-gold" />
            <span className="font-body text-xs font-semibold text-rani-navy">
              Expect a call {callTime ? `in the ${callTime.toLowerCase()}` : "soon"}
            </span>
          </div>
        </div>
      </FadeInOnScroll>
    );
  }

  return (
    <FadeInOnScroll>
      <div className="rounded-2xl border border-rani-gold/30 bg-gradient-to-br from-rani-cream to-white p-8 md:p-12">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rani-gold/10">
            <Phone size={22} className="text-rani-gold" />
          </div>
          <h3 className="mt-4 font-heading text-2xl font-bold text-rani-navy md:text-3xl">
            Get Your Personalized Treatment Plan
          </h3>
          <p className="mx-auto mt-2 max-w-lg font-body text-sm text-rani-muted">
            Free 15-minute phone consultation with our aesthetic team
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-2xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label
                htmlFor="qc-name"
                className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wider text-rani-navy/70"
              >
                Name <span className="text-rani-gold">*</span>
              </label>
              <input
                id="qc-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-lg border border-rani-border bg-white px-4 py-3 font-body text-sm text-rani-navy placeholder:text-rani-muted/50 transition-all focus:border-rani-gold focus:outline-none focus:ring-2 focus:ring-rani-gold/20"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="qc-phone"
                className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wider text-rani-navy/70"
              >
                Phone <span className="text-rani-gold">*</span>
              </label>
              <input
                id="qc-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full rounded-lg border border-rani-border bg-white px-4 py-3 font-body text-sm text-rani-navy placeholder:text-rani-muted/50 transition-all focus:border-rani-gold focus:outline-none focus:ring-2 focus:ring-rani-gold/20"
              />
            </div>

            {/* Service Interest */}
            <div>
              <label
                htmlFor="qc-service"
                className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wider text-rani-navy/70"
              >
                Service Interest
              </label>
              <select
                id="qc-service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full appearance-none rounded-lg border border-rani-border bg-white px-4 py-3 font-body text-sm text-rani-navy transition-all focus:border-rani-gold focus:outline-none focus:ring-2 focus:ring-rani-gold/20"
              >
                <option value="">Select a service...</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Best Time to Call */}
            <div>
              <label
                htmlFor="qc-time"
                className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wider text-rani-navy/70"
              >
                Best Time to Call
              </label>
              <select
                id="qc-time"
                value={callTime}
                onChange={(e) => setCallTime(e.target.value)}
                className="w-full appearance-none rounded-lg border border-rani-border bg-white px-4 py-3 font-body text-sm text-rani-navy transition-all focus:border-rani-gold focus:outline-none focus:ring-2 focus:ring-rani-gold/20"
              >
                <option value="">Any time</option>
                {CALL_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Honeypot */}
          <input
            type="text"
            name="company"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {/* Error State */}
          {status === "error" && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <p className="font-body text-sm text-red-700">
                Something went wrong. Please try again or call us directly.
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="mt-6 text-center">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rani-gold px-8 py-3.5 font-body text-sm font-bold uppercase tracking-wider text-rani-navy transition-all hover:bg-rani-gold-light hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Phone size={16} />
                  Request Callback
                </>
              )}
            </button>
            <p className="mt-3 font-body text-xs text-rani-muted">
              No obligation. We respect your privacy and never share your information.
            </p>
          </div>
        </form>
      </div>
    </FadeInOnScroll>
  );
}
