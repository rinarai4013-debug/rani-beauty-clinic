"use client";

import { motion } from "framer-motion";
import { Sparkles, Star, TrendingUp } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";

const packages = [
  {
    name: "The Glow Package",
    tagline: "Most Popular",
    icon: Sparkles,
    treatments: [
      "HydraFacial MD Signature",
      "LED Red Light Therapy Add-On",
      "AI Skin Analysis",
    ],
    price: "$299",
    originalPrice: "$425",
    savings: "Save $126",
    href: "/pricing",
    featured: true,
  },
  {
    name: "Anti-Aging Essentials",
    tagline: "Best Value",
    icon: Star,
    treatments: [
      "Botox (1 Area)",
      "HydraFacial Express",
      "Complimentary Follow-Up",
    ],
    price: "$449",
    originalPrice: "$575",
    savings: "Save $126",
    href: "/pricing",
    featured: false,
  },
  {
    name: "Wellness Kickstart",
    tagline: "New Patient Favorite",
    icon: TrendingUp,
    treatments: [
      "Comprehensive Blood Panel",
      "GLP-1 First Month Supply",
      "Physician Consultation",
    ],
    price: "$499",
    originalPrice: "$649",
    savings: "Save $150",
    href: "/pricing",
    featured: false,
  },
];

export default function PopularPackages() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll>
          <SectionLabel label="VALUE PACKAGES" />
          <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
            Popular Treatment Packages
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
            Curated by our medical team. Save when you bundle treatments for
            optimal results.
          </p>
        </FadeInOnScroll>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {packages.map((pkg, i) => (
            <FadeInOnScroll key={pkg.name} delay={i * 0.15}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className={`relative flex h-full flex-col overflow-hidden rounded-xl border-2 bg-white p-8 transition-shadow duration-300 hover:shadow-lg ${
                  pkg.featured
                    ? "border-rani-gold shadow-md"
                    : "border-rani-border"
                }`}
              >
                {pkg.featured && (
                  <div className="absolute right-0 top-0 rounded-bl-lg bg-rani-gold px-3 py-1">
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
                    <h3 className="font-body text-lg font-bold text-rani-navy">
                      {pkg.name}
                    </h3>
                    {!pkg.featured && (
                      <span className="font-body text-xs text-rani-muted">
                        {pkg.tagline}
                      </span>
                    )}
                  </div>
                </div>

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
                  <div className="flex items-baseline gap-2">
                    <span className="font-body text-3xl font-bold text-rani-navy">
                      {pkg.price}
                    </span>
                    <span className="font-body text-sm text-rani-muted line-through">
                      {pkg.originalPrice}
                    </span>
                  </div>
                  <span className="mt-1 inline-block rounded-full bg-green-50 px-2 py-0.5 font-body text-xs font-semibold text-green-700">
                    {pkg.savings}
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
                    View Package
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
