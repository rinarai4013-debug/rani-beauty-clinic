"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import { clinicInfo } from "@/data/clinic-info";
import { faqItems, type FAQItem } from "@/data/faqs";

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
  index,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  const headingId = `faq-heading-${index}`;
  const panelId = `faq-panel-${index}`;

  return (
    <div className="border-b border-rani-border last:border-b-0">
      <h3>
        <button
          id={headingId}
          onClick={onToggle}
          className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-rani-gold"
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className="pr-4 font-body text-base font-semibold text-rani-navy">
            {item.question}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
            aria-hidden="true"
          >
            <ChevronDown size={20} className="text-rani-gold" />
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headingId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="faq-answer pb-5 font-body text-sm leading-relaxed text-rani-muted" data-speakable>
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
                  href={clinicInfo.phoneTel}
                  className="font-body text-sm font-semibold text-rani-gold hover:text-rani-gold-light transition-colors"
                >
                  Call {clinicInfo.phone} &rarr;
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
                  index={i}
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
