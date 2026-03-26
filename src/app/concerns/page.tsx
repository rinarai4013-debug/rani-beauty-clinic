import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import { skinConcerns } from "@/data/skin-concerns";

export const metadata: Metadata = {
  title: "Skin Concerns We Treat",
  description:
    "From acne and aging skin to hyperpigmentation and unwanted hair - explore the skin concerns we treat at Rani Beauty Clinic in Renton, WA. Physician-supervised, all skin types.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/concerns",
  },
  openGraph: {
    title: "Skin Concerns We Treat | Rani Beauty Clinic",
    description:
      "Acne, aging, hyperpigmentation, unwanted hair & more - physician-supervised treatments for all skin types in Renton, WA.",
    url: "https://www.ranibeautyclinic.com/concerns",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rani Beauty Clinic - Skin Concerns" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skin Concerns We Treat | Rani Beauty Clinic",
    description:
      "Acne, aging, hyperpigmentation, unwanted hair & more - physician-supervised treatments for all skin types.",
  },
};

export default function ConcernsPage() {
  return (
    <>
      <Hero
        label="SKIN CONCERNS"
        title="Conditions We Treat"
        subtitle="Every skin concern has a solution. Explore our physician-supervised treatment options for your specific needs - personalized for your skin type and goals."
        dark={false}
      />

      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="FIND YOUR SOLUTION" />
            <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
              What Brings You In?
            </h2>
          </FadeInOnScroll>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {skinConcerns.map((concern, i) => (
              <FadeInOnScroll key={concern.slug} delay={i * 0.1}>
                <Link
                  href={`/concerns/${concern.slug}`}
                  className="group flex flex-col rounded-xl border border-rani-border bg-white p-6 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(15,29,44,0.08)] hover:-translate-y-1 hover:border-rani-gold/30 h-full"
                >
                  <h3 className="font-body text-lg font-bold text-rani-navy group-hover:text-rani-gold transition-colors">
                    {concern.title}
                  </h3>
                  <p className="mt-3 font-body text-sm text-rani-muted leading-relaxed line-clamp-3 flex-1">
                    {concern.heroDescription}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-body text-xs text-rani-muted">
                      {concern.treatments.length} treatment
                      {concern.treatments.length !== 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1 font-body text-xs font-semibold text-rani-gold group-hover:gap-2 transition-all">
                      Explore
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        label="NOT SURE WHERE TO START?"
        title="Book a Free Phone Consultation"
        subtitle="Our team will help you identify the best treatment plan for your specific concerns."
      />
    </>
  );
}
