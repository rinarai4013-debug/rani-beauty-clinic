"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Phone, Star } from "lucide-react";
import { clinicInfo } from "@/data/clinic-info";

const SESSION_KEY = "rani-exit-intent-shown";
const MIN_TIME_ON_PAGE_MS = 10_000;

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Mark ready after user has been on the page for at least 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, MIN_TIME_ON_PAGE_MS);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleQuizClick = useCallback(() => {
    setIsVisible(false);
    const quizSection = document.getElementById("treatment-quiz");
    if (quizSection) {
      quizSection.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Listen for exit intent (mouse moving toward the top of the viewport)
  useEffect(() => {
    // Check if popup was already shown this session
    if (sessionStorage.getItem(SESSION_KEY)) {
      setHasTriggered(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when cursor leaves through the top of the viewport
      if (e.clientY <= 0 && isReady && !hasTriggered) {
        setIsVisible(true);
        setHasTriggered(true);
        sessionStorage.setItem(SESSION_KEY, "true");
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isReady, hasTriggered]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisible, handleClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-rani-navy/70 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Modal Card */}
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border-t-4 border-rani-gold bg-white p-8 shadow-2xl sm:p-10"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-rani-navy"
              aria-label="Close popup"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Sparkles Icon */}
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rani-gold/20">
                <Phone className="h-7 w-7 text-rani-gold" />
              </div>

              {/* Headline */}
              <h2 className="font-heading text-2xl font-bold leading-tight text-rani-navy sm:text-3xl">
                Before You Go — Free Phone Consultation
              </h2>

              {/* Subtext */}
              <p className="mt-4 font-body text-base leading-relaxed text-gray-600">
                Not sure which treatment is right for you? Schedule a free phone
                consultation with our team — no commitment, no pressure.
              </p>

              {/* Social proof */}
              <div className="mt-4 flex items-center justify-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-rani-gold text-rani-gold" />
                  ))}
                </div>
                <span className="font-body text-sm font-semibold text-rani-navy">
                  {clinicInfo.reviews.aggregateRating}
                </span>
                <span className="font-body text-sm text-gray-500">
                  ({clinicInfo.reviews.reviewCount}+ reviews)
                </span>
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href={clinicInfo.consultation.url}
                  onClick={handleClose}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-rani-gold px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-wider text-rani-navy transition-all hover:bg-rani-gold/90 hover:shadow-lg"
                >
                  <Sparkles className="h-4 w-4" />
                  Book Free Consultation
                </a>

                <a
                  href={clinicInfo.phoneTel}
                  onClick={handleClose}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-rani-navy/20 bg-transparent px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-wider text-rani-navy transition-all hover:border-rani-navy hover:bg-rani-navy/5"
                >
                  <Phone className="h-4 w-4" />
                  Call Now
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
