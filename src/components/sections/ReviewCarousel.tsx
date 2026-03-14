"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const [desktopPage, setDesktopPage] = useState(0);
  const reviewsPerPage = 3;
  const totalDesktopPages = Math.ceil(reviews.length / reviewsPerPage);

  const nextDesktopPage = useCallback(() => {
    setDesktopPage((prev) => (prev + 1) % totalDesktopPages);
  }, [totalDesktopPages]);

  const prevDesktopPage = useCallback(() => {
    setDesktopPage((prev) => (prev - 1 + totalDesktopPages) % totalDesktopPages);
  }, [totalDesktopPages]);

  // Auto-advance mobile carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  // Auto-advance desktop carousel
  useEffect(() => {
    const timer = setInterval(() => {
      nextDesktopPage();
    }, 8000);
    return () => clearInterval(timer);
  }, [nextDesktopPage]);

  const desktopReviews = reviews.slice(
    desktopPage * reviewsPerPage,
    desktopPage * reviewsPerPage + reviewsPerPage
  );

  return (
    <section className="bg-rani-cream py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll>
          <SectionLabel label="TESTIMONIALS" />
          <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
            What Our Patients Say
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-body text-base text-rani-muted">
            Trusted by 127+ patients with a 4.9-star Google rating. Hear directly from the people who have experienced the Rani difference.
          </p>
        </FadeInOnScroll>

        {/* Desktop: paginated grid of 3 with navigation */}
        <div className="mt-12 hidden md:block">
          <AnimatePresence mode="wait">
            <motion.div
              key={desktopPage}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="grid gap-8 md:grid-cols-3"
            >
              {desktopReviews.map((review, i) => (
                <TestimonialCard
                  key={review.id}
                  name={review.name}
                  text={review.text}
                  rating={review.rating}
                  treatment={review.treatment}
                  date={review.date}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Desktop pagination controls */}
          {totalDesktopPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={prevDesktopPage}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-rani-gold/30 bg-white text-rani-navy transition-all hover:border-rani-gold hover:bg-rani-gold hover:text-rani-navy"
                aria-label="Previous reviews"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalDesktopPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setDesktopPage(i)}
                    className={`h-2 rounded-full transition-all ${
                      desktopPage === i ? "w-6 bg-rani-gold" : "w-2 bg-rani-gold/30"
                    }`}
                    aria-label={`Go to review page ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={nextDesktopPage}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-rani-gold/30 bg-white text-rani-navy transition-all hover:border-rani-gold hover:bg-rani-gold hover:text-rani-navy"
                aria-label="Next reviews"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile: single card carousel */}
        <div className="mt-12 md:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <TestimonialCard
                name={reviews[current]?.name ?? ""}
                text={reviews[current]?.text ?? ""}
                rating={reviews[current]?.rating ?? 5}
                treatment={reviews[current]?.treatment}
                date={reviews[current]?.date}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile carousel indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 md:hidden">
          {reviews.map((_, i) => (
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
              Read All 127+ Reviews on Google
            </Button>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
