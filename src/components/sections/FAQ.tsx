"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "What makes Rani Beauty Clinic different from other medspas?",
    answer:
      "Every medical treatment at Rani is supervised by Dr. Alexander Landfield, a board-certified neurologist. His expertise in neuroscience and muscle anatomy means more precise injections, safer protocols, and better outcomes. We also combine aesthetics and medical wellness under one roof, so your care is truly comprehensive.",
  },
  {
    question: "How does the consultation deposit work?",
    answer:
      "Your consultation requires a $150 deposit to secure your appointment. The great news is that this deposit applies directly toward any treatment or product you choose — so it's not an extra cost, it's a credit toward your care. During your visit, our team will assess your skin, discuss your goals, and create a personalized treatment roadmap.",
  },
  {
    question: "How do I know which treatment is right for me?",
    answer:
      "That's exactly what your consultation is for. We evaluate your skin type, concerns, medical history, and goals to recommend the most effective plan. You can also take our Treatment Quiz on this page for a quick preliminary recommendation.",
  },
  {
    question: "Is laser hair removal painful?",
    answer:
      "Our Candela GentleMax Pro Plus uses an integrated cooling system that makes treatments virtually pain-free. Most patients describe it as a light snapping sensation. The dual-wavelength technology is safe for all skin types, including darker skin tones.",
  },
  {
    question: "What is GLP-1 weight management and am I a candidate?",
    answer:
      "GLP-1 programs use FDA-approved medications like Semaglutide and Tirzepatide to support weight loss alongside lifestyle changes. Candidates typically have a BMI of 27+ with a weight-related condition, or 30+. We include comprehensive blood work and physician monitoring in every program.",
  },
  {
    question: "How soon will I see results?",
    answer:
      "It depends on the treatment. HydraFacial gives an immediate glow. Botox takes 3-7 days to show full effect. RF microneedling results build over 3-6 months as collagen regenerates. During your consultation, we'll set realistic expectations for your specific treatment plan.",
  },
  {
    question: "Do you accept insurance or HSA/FSA?",
    answer:
      "While most aesthetic treatments are not covered by insurance, we do accept HSA and FSA cards for eligible medical wellness services. We also offer flexible financing options to make treatments accessible.",
  },
  {
    question: "What are your hours and do I need an appointment?",
    answer:
      "We're open 7 days a week, Monday through Sunday, 10 AM to 7 PM. While appointments are recommended to ensure availability, we do our best to accommodate walk-ins when possible. Book online or call us at (425) 539-4440.",
  },
];

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-rani-border last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-rani-gold"
        aria-expanded={isOpen}
      >
        <span className="pr-4 font-body text-base font-semibold text-rani-navy">
          {item.question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown size={20} className="text-rani-gold" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 font-body text-sm leading-relaxed text-rani-muted">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll>
          <SectionLabel label="FAQ" />
          <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
            Everything you need to know before your first visit.
          </p>
        </FadeInOnScroll>

        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-x-12 lg:grid-cols-2">
          {/* Left column */}
          <FadeInOnScroll delay={0.1}>
            <div className="rounded-xl border border-rani-border bg-white px-6">
              {faqItems.slice(0, 4).map((item, i) => (
                <FAQAccordionItem
                  key={i}
                  item={item}
                  isOpen={openIndex === i}
                  onToggle={() =>
                    setOpenIndex(openIndex === i ? null : i)
                  }
                />
              ))}
            </div>
          </FadeInOnScroll>

          {/* Right column */}
          <FadeInOnScroll delay={0.2}>
            <div className="mt-6 rounded-xl border border-rani-border bg-white px-6 lg:mt-0">
              {faqItems.slice(4).map((item, i) => {
                const idx = i + 4;
                return (
                  <FAQAccordionItem
                    key={idx}
                    item={item}
                    isOpen={openIndex === idx}
                    onToggle={() =>
                      setOpenIndex(openIndex === idx ? null : idx)
                    }
                  />
                );
              })}
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
}
