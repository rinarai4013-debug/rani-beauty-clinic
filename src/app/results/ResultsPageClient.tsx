"use client";

import { motion } from "framer-motion";
import { Zap, Droplets, Sparkles, Syringe, Layers, Heart } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Button from "@/components/ui/Button";
import { clinicInfo } from "@/data/clinic-info";

const treatmentHighlights = [
  {
    icon: Zap,
    title: "Laser Hair Removal",
    description:
      "Smooth, hair-free skin with our advanced Candela GentleMax Pro Plus laser technology.",
  },
  {
    icon: Droplets,
    title: "HydraFacial",
    description:
      "Deep cleansing, exfoliation, and hydration for an instant glow with zero downtime.",
  },
  {
    icon: Sparkles,
    title: "RF Microneedling",
    description:
      "Stimulate collagen production to improve skin texture, acne scars, and fine lines.",
  },
  {
    icon: Syringe,
    title: "Botox & Dysport",
    description:
      "Natural-looking results that enhance your features while maintaining facial harmony.",
  },
  {
    icon: Layers,
    title: "Chemical Peels",
    description:
      "Medical-grade peels to target hyperpigmentation, sun damage, and uneven skin tone.",
  },
  {
    icon: Heart,
    title: "Wellness Treatments",
    description:
      "GLP-1 weight management, NAD+ therapy, peptides, and vitamin injections.",
  },
];

export default function ResultsPageClient() {
  return (
    <>
      {/* Hero */}
      <Hero
        label="OUR RESULTS"
        title="Transformations You Can Trust"
        subtitle="Every treatment at Rani Beauty Clinic is performed by world-trained providers under physician supervision. Schedule a consultation to see how we can help you achieve your goals."
        dark={false}
        badge="Physician-Supervised Care"
      />

      {/* What We Treat Section */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="WHAT WE TREAT" />
            <h2 className="mt-6 text-center font-heading text-3xl font-bold text-rani-navy md:text-4xl">
              Treatments Tailored to You
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
              From skin rejuvenation to body wellness, our expert team creates
              customized treatment plans based on your unique anatomy, skin type,
              and personal goals.
            </p>
          </FadeInOnScroll>

          {/* Treatment Grid */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {treatmentHighlights.map((item, index) => (
              <FadeInOnScroll key={item.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-rani-border bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rani-cream">
                    <item.icon size={24} className="text-rani-gold" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-rani-navy">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-rani-muted">
                    {item.description}
                  </p>
                </motion.div>
              </FadeInOnScroll>
            ))}
          </div>

          {/* Consultation CTA */}
          <FadeInOnScroll delay={0.3}>
            <div className="mt-16 rounded-2xl bg-gradient-to-br from-rani-navy to-rani-navy-light p-8 text-center md:p-12">
              <h3 className="font-heading text-2xl font-bold text-white md:text-3xl">
                See What&apos;s Possible for You
              </h3>
              <p className="mx-auto mt-4 max-w-xl font-body text-base text-white/80">
                Every patient is unique. Book a complimentary consultation and
                our expert providers will create a personalized treatment plan
                tailored to your goals.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button
                  href={clinicInfo.consultation.url}
                  className="!bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light"
                >
                  Book Your Consultation
                </Button>
                <Button
                  variant="ghost"
                  href="/services"
                  className="!border-white/30 !text-white hover:!bg-white/10"
                >
                  Explore Services
                </Button>
              </div>
            </div>
          </FadeInOnScroll>

          {/* Trust indicators */}
          <FadeInOnScroll delay={0.2}>
            <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { value: "4.9★", label: "Google Rating" },
                { value: "127+", label: "5-Star Reviews" },
                { value: "3+", label: "Countries Trained In" },
                { value: "100%", label: "Physician Supervised" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-rani-border bg-rani-cream p-4 text-center"
                >
                  <p className="font-heading text-2xl font-bold text-rani-gold">
                    {stat.value}
                  </p>
                  <p className="mt-1 font-body text-xs text-rani-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </FadeInOnScroll>

          {/* Disclaimer */}
          <FadeInOnScroll delay={0.3}>
            <div className="mt-12 rounded-xl border border-rani-border bg-rani-cream p-6 text-center">
              <p className="font-body text-sm text-rani-muted">
                <strong className="text-rani-navy">Disclaimer:</strong>{" "}
                Individual results may vary and depend on factors such as skin
                type, treatment plan, and adherence to post-treatment care
                instructions. All treatments are performed by licensed
                professionals under the supervision of Dr. Alexander Landfield.
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
