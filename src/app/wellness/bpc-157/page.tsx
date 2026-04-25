import Link from "next/link";
import { Metadata } from "next";
import { clinicInfo } from "@/data/clinic-info";

export const metadata: Metadata = {
  title: {
    absolute: "BPC-157 Program | Rani Beauty Clinic",
  },
  description:
    "Learn about the BPC-157 program at Rani Beauty Clinic and begin enrollment through our self-serve intake flow.",
  alternates: {
    canonical: `${clinicInfo.website}/wellness/bpc-157`,
  },
};

export default function Bpc157ProgramPage() {
  return (
    <main className="min-h-screen bg-[#0F1D2C] text-white">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <p className="text-[#C9A96E] uppercase tracking-widest text-xs sm:text-sm font-semibold">
          Peptide Program
        </p>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-serif font-bold">
          BPC-157
        </h1>
        <p className="mt-6 text-white/80 leading-relaxed">
          Begin with a structured intake so our provider team can review your
          goals, confirm candidacy, and determine prescription next steps.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/wellness/bpc-157/enroll"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-[#C9A96E] text-[#0F1D2C] font-semibold hover:bg-[#C9A96E]/90 transition-colors"
          >
            Start BPC-157 Enrollment
          </Link>
          <Link
            href="/wellness/peptide-therapy"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-white/30 text-white font-semibold hover:bg-white/5 transition-colors"
          >
            View Peptide Therapy
          </Link>
        </div>
      </section>
    </main>
  );
}
