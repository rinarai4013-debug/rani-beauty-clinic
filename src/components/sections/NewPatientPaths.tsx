"use client";

import { CalendarCheck, HelpCircle, Phone } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import StaggerChildren from "@/components/animations/StaggerChildren";
import { clinicInfo } from "@/data/clinic-info";

const paths = [
  {
    icon: CalendarCheck,
    title: "I Know What I Want",
    description:
      "Ready to book? Schedule your consultation and we'll confirm your treatment plan.",
    cta: "Book Your Consultation",
    href: clinicInfo.booking.url,
    target: "_blank" as const,
    primary: true,
  },
  {
    icon: HelpCircle,
    title: "Help Me Choose",
    description:
      "Not sure where to start? Take our 2-minute quiz for a personalized recommendation.",
    cta: "Take the Quiz",
    href: "/quiz",
    primary: false,
  },
  {
    icon: Phone,
    title: "I Have Questions",
    description:
      "Talk to our team. We are happy to walk you through options, pricing, and what to expect.",
    cta: `Call ${clinicInfo.phone}`,
    href: clinicInfo.phoneTel,
    primary: false,
  },
];

export default function NewPatientPaths() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <FadeInOnScroll>
          <h2 className="text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
            New to Rani?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center font-body text-base text-rani-muted">
            However you like to get started, we make it easy.
          </p>
        </FadeInOnScroll>

        <StaggerChildren className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {paths.map((path) => (
            <div
              key={path.title}
              className={`flex flex-col items-center rounded-xl border p-8 text-center transition-all hover:shadow-md ${
                path.primary
                  ? "border-rani-gold bg-rani-gold/5"
                  : "border-rani-border bg-white"
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rani-cream">
                <path.icon size={24} className="text-rani-gold" />
              </div>
              <h3 className="mt-5 font-body text-lg font-bold text-rani-navy">
                {path.title}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-rani-muted">
                {path.description}
              </p>
              <a
                href={path.href}
                target={path.target}
                rel={path.target ? "noopener noreferrer" : undefined}
                className={`mt-6 inline-flex items-center justify-center rounded-lg px-6 py-3 font-body text-sm font-semibold transition-all ${
                  path.primary
                    ? "bg-rani-gold text-rani-navy hover:bg-rani-gold-light"
                    : "border-2 border-rani-navy bg-transparent text-rani-navy hover:bg-rani-navy hover:text-white"
                }`}
              >
                {path.cta}
              </a>
            </div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
