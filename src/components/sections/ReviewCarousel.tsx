"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TestimonialCard from "@/components/ui/TestimonialCard";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Button from "@/components/ui/Button";

interface Review {
  id: number;
  name: string;
  rating: number;
  text: string;
  treatment?: string;
  date?: string;
}

interface ReviewCarouselProps {
  reviews: Review[];
}

export default function ReviewCarousel({ reviews }: ReviewCarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  return (
    <section className="bg-rani-cream py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll>
          <SectionLabel label="TESTIMONIALS" />
          <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
            What Our Patients Say
          </h2>
        </FadeInOnScroll>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Show 3 at a time on desktop, cycle through on mobile */}
          {reviews.slice(0, 3).map((review, i) => (
            <FadeInOnScroll key={review.id} delay={i * 0.15}>
              <TestimonialCard
                name={review.name}
                text={review.text}
                rating={review.rating}
                treatment={review.treatment}
                date={review.date}
              />
            </FadeInOnScroll>
          ))}
        </div>

        {/* Mobile carousel indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 md:hidden">
          {reviews.slice(0, 3).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                current === i ? "w-6 bg-rani-gold" : "w-2 bg-rani-gold/30"
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>

        <FadeInOnScroll delay={0.3}>
          <div className="mt-10 text-center">
            <Button variant="ghost" href="https://g.page/ranibeautyclinic" target="_blank">
              Read More Reviews
            </Button>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
