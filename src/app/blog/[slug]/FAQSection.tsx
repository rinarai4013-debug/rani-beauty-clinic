"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
}

export default function FAQSection({ faqs }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <FadeInOnScroll key={index} delay={index * 0.1}>
          <div className="overflow-hidden rounded-xl border border-rani-border bg-white transition-shadow duration-300 hover:shadow-sm">
            <button
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <h3 className="font-body text-base font-bold text-rani-navy pr-4">
                {faq.question}
              </h3>
              <ChevronDown
                size={18}
                className={`shrink-0 text-rani-gold transition-transform duration-300 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                openIndex === index
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 font-body text-sm leading-relaxed text-rani-muted">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        </FadeInOnScroll>
      ))}
    </div>
  );
}
