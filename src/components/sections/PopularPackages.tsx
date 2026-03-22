"use client";

import { motion } from "framer-motion";
import { Sparkles, Star, TrendingUp } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";

const packages = [
  {
    name: "The First Glow",
    tagline: "Most Popular",
    icon: Sparkles,
    description: "For those seeking their first visible glow.",
    treatments: [
      "HydraFacial MD Signature",
      "LED Red Light Therapy Add-On",
      "AI Skin Analysis",
    ],
    price: "$299",
    href: "/pricing",
    featured: false,
  },
  {
    name: "Precision Anti-Aging",
    tagline: "Signature",
    icon: Star,
    description: "For those who want visible, lasting anti-aging results.",
    treatments: [
      "Botox (1 Area)",
      "HydraFacial Express",
      "Complimentary Follow-Up",
    ],
    price: "$449",
    href: "/pricing",
    featured: true,
  },
  {
    name: "The Full Picture",
    tagline: "Curated",
    icon: TrendingUp,
    description: "For those seeking whole-body wellness from the inside out.",
    treatments: [
      "Comprehensive Blood Panel",
      "GLP-1 First Month Supply",
      "Physician Consultation",
    ],
    price: "$499",
    href: "/pricing",
    featured: false,
  },
];

export default function PopularPackages() {
  return (
    <section className="bg-rani-cream py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll>
          <SectionLabel label="CURATED PACKAGES" />
          <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
            Signature Experiences, Curated for You
          </h2>
          <p className="mx-auto mt-3 text-center font-body text-sm font-semibold text-rani-gold">
            127+ five-star reviews
          </p>
        </FadeInOnScroll>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.1fr_1fr] md:items-start">
          {packages.map((pkg, i) => (
            <FadeInOnScroll key={pkg.name} delay={i * 0.15}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className={`relative flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-white p-8 transition-shadow duration-300 hover:shadow-lg ${
                  pkg.featured
                    ? "border-rani-gold shadow-lg"
                    : "border-rani-border"
                }`}
              >
                {pkg.featured && (
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-rani-gold px-4 py-1.5">
                    <span className="font-body text-xs font-bold text-rani-navy">
                      {pkg.tagline}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      pkg.featured
                        ? "bg-rani-gold/20"
                        : "bg-rani-cream"
                    }`}
                  >
                    <pkg.icon
                      size={20}
                      className={
                        pkg.featured ? "text-rani-gold" : "text-rani-navy"
                      }
                    />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-rani-navy">
                      {pkg.name}
                    </h3>
                    {!pkg.featured && (
                      <span className="font-body text-xs text-rani-muted">
                        {pkg.tagline}
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-4 font-body text-sm text-rani-muted leading-relaxed">
                  {pkg.description}
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {pkg.treatments.map((treatment) => (
                    <li
                      key={treatment}
                      className="flex items-start gap-2 font-body text-sm text-rani-text"
                    >
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rani-gold/15">
                        <svg
                          className="h-3 w-3 text-rani-gold"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      {treatment}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 border-t border-rani-border pt-6">
                  <span className="font-heading text-3xl font-bold text-rani-navy">
                    {pkg.price}
                  </span>
                </div>

                <div className="mt-6">
                  <Button
                    href={pkg.href}
                    className={`w-full justify-center ${
                      pkg.featured
                        ? "!bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light"
                        : ""
                    }`}
                    variant={pkg.featured ? "primary" : "ghost"}
                  >
                    {pkg.featured ? "Start This Journey" : "Learn More"}
                  </Button>
                </div>
              </motion.div>
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
