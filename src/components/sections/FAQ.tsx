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
      "Your consultation requires a $150 deposit to secure your appointment. This deposit applies directly toward any treatment or product you choose — so it's not an extra cost, it's a credit toward your care. During your visit, our team will assess your skin, discuss your goals, and create a personalized treatment roadmap.",
  },
  {
    question: "How do I know which treatment is right for me?",
    answer:
      "That's exactly what your consultation is for. We evaluate your skin type, concerns, medical history, and goals to recommend the most effective plan. You can also take our Treatment Quiz for a quick preliminary recommendation.",
  },
  {
    question: "Is laser hair removal painful?",
    answer:
      "Our Candela GentleMax Pro Plus uses an integrated cooling system that makes treatments virtually pain-free. Most patients describe it as a light snapping sensation. The dual-wavelength technology is safe for all skin types, including darker skin tones.",
  },
  {
    question: "How soon will I see results?",
    answer:
      "It depends on the treatment. HydraFacial gives an immediate glow. Botox takes 3-7 days to show full effect. RF microneedling results build over 3-6 months as collagen regenerates. During your consultation, we'll set realistic expectations for your specific treatment plan.",
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
    <section className="bg-rani-cream py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-16 lg:grid-cols-[1fr_1.8fr]">
          {/* Left: heading */}
          <FadeInOnScroll>
            <div className="mb-8 lg:mb-0">
              <SectionLabel label="FAQ" className="!items-start" />
              <h2 className="mt-6 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
                Common Questions
              </h2>
              <p className="mt-4 font-body text-sm text-rani-muted">
                Can&apos;t find your answer?
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href="/faq"
                  className="font-body text-sm font-semibold text-rani-gold hover:text-rani-gold-light transition-colors"
                >
                  See All FAQs &rarr;
                </a>
                <a
                  href="tel:+14255394440"
                  className="font-body text-sm font-semibold text-rani-gold hover:text-rani-gold-light transition-colors"
                >
                  Call Us &rarr;
                </a>
              </div>
            </div>
          </FadeInOnScroll>

          {/* Right: accordion */}
          <FadeInOnScroll delay={0.1}>
            <div className="rounded-xl border border-rani-border bg-white px-6">
              {faqItems.map((item, i) => (
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
        </div>
      </div>
    </section>
  );
}
