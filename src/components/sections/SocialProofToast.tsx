"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const proofMessages = [
  { name: "Sarah M.", action: "booked Laser Hair Removal", time: "2 hours ago", city: "Bellevue" },
  { name: "Jennifer L.", action: "booked a Botox consultation", time: "3 hours ago", city: "Renton" },
  { name: "David K.", action: "started GLP-1 Weight Management", time: "5 hours ago", city: "Kent" },
  { name: "Priya R.", action: "booked a HydraFacial", time: "1 hour ago", city: "Seattle" },
  { name: "Michelle T.", action: "booked RF Microneedling", time: "4 hours ago", city: "Newcastle" },
  { name: "Angela W.", action: "booked a Filler consultation", time: "6 hours ago", city: "Mercer Island" },
  { name: "Lisa K.", action: "booked a Chemical Peel", time: "45 minutes ago", city: "Tukwila" },
];

export default function SocialProofToast() {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    // Show first toast after 12 seconds
    const initialDelay = setTimeout(() => {
      setVisible(true);
    }, 12000);

    return () => clearTimeout(initialDelay);
  }, [dismissed]);

  useEffect(() => {
    if (!visible || dismissed) return;

    // Hide after 5 seconds
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    // Show next toast after 30 seconds
    const nextTimer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % proofMessages.length);
      setVisible(true);
    }, 35000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [visible, currentIndex, dismissed]);

  if (dismissed) return null;

  const message = proofMessages[currentIndex];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-20 left-4 z-30 max-w-xs rounded-xl bg-white p-4 shadow-lg border border-rani-border lg:bottom-6"
        >
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-2 rounded p-1 text-rani-muted hover:text-rani-navy transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-3 pr-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
              <svg className="h-4 w-4 text-green-600 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-body text-sm text-rani-navy">
                <span className="font-semibold">{message.name}</span> from{" "}
                {message.city} {message.action}
              </p>
              <p className="mt-0.5 font-body text-xs text-rani-muted">
                {message.time}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
