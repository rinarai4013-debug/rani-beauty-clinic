"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";

const filterCategories = [
  "All",
  "Laser",
  "HydraFacial",
  "RF Microneedling",
  "Botox",
  "Fillers",
  "Peels",
] as const;

type FilterCategory = (typeof filterCategories)[number];

// Placeholder gallery items — replace with real before & after photos
const galleryItems = [
  { id: 1, category: "Laser", title: "Laser Hair Removal — Full Legs" },
  { id: 2, category: "Laser", title: "Laser Hair Removal — Underarms" },
  { id: 3, category: "HydraFacial", title: "HydraFacial Platinum — Glow" },
  { id: 4, category: "HydraFacial", title: "HydraFacial Deluxe — Acne" },
  { id: 5, category: "RF Microneedling", title: "RF Microneedling — Acne Scars" },
  { id: 6, category: "RF Microneedling", title: "RF Microneedling — Skin Tightening" },
  { id: 7, category: "Botox", title: "Botox — Forehead Lines" },
  { id: 8, category: "Botox", title: "Botox — Crow's Feet" },
  { id: 9, category: "Fillers", title: "Lip Filler — Natural Enhancement" },
  { id: 10, category: "Fillers", title: "Cheek Filler — Volume Restoration" },
  { id: 11, category: "Peels", title: "Chemical Peel — Hyperpigmentation" },
  { id: 12, category: "Peels", title: "Chemical Peel — Sun Damage" },
];

export default function ResultsPageClient() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All");

  const filteredItems =
    activeFilter === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeFilter);

  return (
    <>
      {/* Hero */}
      <Hero
        label="REAL RESULTS"
        title="Before & After Results"
        subtitle="See the real transformations our patients have experienced. All results shown are from actual Rani Beauty Clinic patients treated under physician supervision."
        dark={false}
        badge="Physician-Supervised Results"
      />

      {/* Gallery Section */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="TRANSFORMATIONS" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              Real Patients. Real Results.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
              Individual results may vary. All treatments performed at Rani Beauty
              Clinic by licensed professionals under the supervision of Dr. Alexander
              Landfield.
            </p>
          </FadeInOnScroll>

          {/* Filter Tabs */}
          <FadeInOnScroll delay={0.2}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
              {filterCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`rounded-full px-5 py-2 font-body text-sm font-semibold transition-all duration-300 ${
                    activeFilter === category
                      ? "bg-rani-navy text-white shadow-sm"
                      : "bg-rani-cream text-rani-muted hover:bg-rani-gold/20 hover:text-rani-navy"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </FadeInOnScroll>

          {/* Gallery Grid */}
          <div className="mt-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="group relative overflow-hidden rounded-xl border border-rani-border bg-gradient-to-br from-rani-navy to-rani-navy-light shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                  >
                    {/* Placeholder content */}
                    <div className="flex aspect-[4/3] flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-rani-gold/20 bg-rani-navy-light">
                        <span className="font-heading text-2xl text-rani-gold/30">R</span>
                      </div>
                      <p className="mt-4 font-body text-sm font-semibold text-white/80">
                        {item.title}
                      </p>
                      <p className="mt-2 font-body text-xs text-gray-400">
                        Before &amp; After photos coming soon
                      </p>
                    </div>

                    {/* Category tag */}
                    <div className="absolute left-3 top-3">
                      <span className="inline-flex items-center rounded-full bg-rani-gold/90 px-3 py-1 font-body text-xs font-semibold text-rani-navy">
                        {item.category}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Disclaimer */}
          <FadeInOnScroll delay={0.3}>
            <div className="mt-16 rounded-xl border border-rani-border bg-rani-cream p-6 text-center">
              <p className="font-body text-sm text-rani-muted">
                <strong className="text-rani-navy">Disclaimer:</strong> Individual
                results may vary. Before and after photos are unretouched and shown
                with patient consent. These results are not guaranteed and depend on
                individual factors such as skin type, treatment plan, and adherence
                to post-treatment care instructions.
              </p>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner
        title="Ready for Your Transformation?"
        subtitle="Book a complimentary consultation to discuss your goals and see what treatments are right for you."
      />
    </>
  );
}
