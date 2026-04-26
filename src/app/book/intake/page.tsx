import { Metadata } from "next";
import ConsultationEmbed from "@/components/sections/ConsultationEmbed";

export const metadata: Metadata = {
  title: "Patient Intake Form",
  description: "Complete your patient intake form before your appointment at Rani Beauty Clinic.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookIntakePage() {
  return (
    <main className="min-h-screen bg-rani-cream">
      <section className="bg-[#0F1D2C] px-6 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-[#C9A96E]">
            Patient Intake
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold md:text-5xl">
            Complete Your AI Assessment
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-base text-white/70">
            Share your goals, history, and preferences so the care team can
            prepare a safer, more personalized plan before your visit.
          </p>
        </div>
      </section>

      <ConsultationEmbed />
    </main>
  );
}
