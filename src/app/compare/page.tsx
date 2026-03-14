import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/sections/Hero";
import CTABanner from "@/components/sections/CTABanner";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import StaggerChildren from "@/components/animations/StaggerChildren";
import Card from "@/components/ui/Card";
import { comparisonPages } from "@/data/comparisons";

export const metadata: Metadata = {
  title: "Treatment Comparisons | Rani Beauty Clinic",
  description:
    "Compare popular aesthetic treatments and medical wellness programs side by side. Make informed decisions about Botox vs Dysport, Semaglutide vs Tirzepatide, and more.",
};

export default function ComparePage() {
  return (
    <>
      <Hero
        label="INFORMED DECISIONS"
        title="Treatment Comparisons"
        subtitle="Compare popular treatments side by side to find the right option for your goals."
        dark={false}
      />

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInOnScroll>
            <SectionLabel label="ALL COMPARISONS" />
            <h2 className="mt-4 text-center font-body text-2xl font-bold text-rani-navy md:text-3xl">
              Side-by-Side Treatment Guides
            </h2>
          </FadeInOnScroll>

          <StaggerChildren className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comparisonPages.map((page) => (
              <Card key={page.slug} className="!p-0">
                <Link href={`/compare/${page.slug}`} className="group block p-6">
                  <h3 className="font-body text-base font-bold text-rani-navy group-hover:text-rani-gold transition-colors">
                    {page.treatmentA} vs {page.treatmentB}
                  </h3>
                  <p className="mt-2 line-clamp-2 font-body text-sm text-rani-muted">
                    {page.metaDescription}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 font-body text-sm font-semibold text-rani-navy group-hover:text-rani-gold transition-colors">
                    Compare
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Card>
            ))}
          </StaggerChildren>
        </div>
      </section>

      <CTABanner
        title="Need Help Choosing?"
        subtitle="Book a consultation and our team will recommend the best treatment for your specific goals. Your $150 deposit applies toward treatment."
      />
    </>
  );
}
