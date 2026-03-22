"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";

// ── Data pools for generating realistic notifications ──────────────────────

const FIRST_NAMES = [
  "Sarah", "Maria", "Priya", "Jennifer", "Angela", "Michelle", "Lisa",
  "Aisha", "Emily", "Nadia", "Rachel", "Deepika", "Sophia", "Hana",
  "Jessica", "Amanda", "Grace", "Fatima", "Christina", "Yumi",
  "Lauren", "Meera", "Olivia", "Diana", "Samantha",
];

const CITIES = [
  "Bellevue", "Kirkland", "Redmond", "Seattle", "Kent",
  "Auburn", "Sammamish", "Issaquah", "Renton", "Federal Way",
];

const SERVICES = [
  "HydraFacial",
  "Laser Hair Removal",
  "Botox",
  "RF Microneedling",
  "GLP-1",
  "NAD+ Injection",
  "Chemical Peel",
  "Sofwave",
];

const REVIEW_QUOTES = [
  "Best medspa in the Seattle area!",
  "My skin has never looked better!",
  "The staff is so professional and kind.",
  "Finally found a clinic I trust completely.",
  "Life-changing results — highly recommend!",
  "Dr. Landfield's supervision gives me peace of mind.",
  "Worth every penny. I'm a client for life.",
  "The most thorough consultation I've ever had.",
];

type NotificationType = "booking" | "session" | "review";

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  detail: string;
}

// ── Deterministic pseudo-random using a seed ────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randomMinutes(rng: () => number): string {
  const mins = Math.floor(rng() * 55) + 3;
  return `${mins} minutes ago`;
}

// ── Generate a pool of notifications ────────────────────────────────────────

function generateNotifications(count: number): Notification[] {
  const rng = seededRandom(Date.now() % 100000);
  const notifications: Notification[] = [];

  for (let i = 0; i < count; i++) {
    const roll = rng();
    const name = pickRandom(FIRST_NAMES, rng);
    const city = pickRandom(CITIES, rng);
    const service = pickRandom(SERVICES, rng);

    if (roll < 0.45) {
      // Booking notification
      notifications.push({
        id: i,
        type: "booking",
        message: `${name} from ${city} booked a ${service}`,
        detail: randomMinutes(rng),
      });
    } else if (roll < 0.75) {
      // Session completion notification
      const sessionNum = Math.floor(rng() * 5) + 2;
      const ordinal =
        sessionNum === 2 ? "2nd" : sessionNum === 3 ? "3rd" : `${sessionNum}th`;
      notifications.push({
        id: i,
        type: "session",
        message: `${name} from ${city} just completed her ${ordinal} ${service} session`,
        detail: randomMinutes(rng),
      });
    } else {
      // Review notification
      const quote = pickRandom(REVIEW_QUOTES, rng);
      notifications.push({
        id: i,
        type: "review",
        message: `New 5-star review: "${quote}"`,
        detail: `— ${name} from ${city}`,
      });
    }
  }

  return notifications;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function SocialProofToast() {
  const [notifications] = useState(() => generateNotifications(20));
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * 20));
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const advance = useCallback(() => {
    setIsVisible(false);
    // Wait for exit animation then show next
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % notifications.length);
      setIsVisible(true);
    }, 400);
  }, [notifications.length]);

  // Initial delay before first toast appears
  useEffect(() => {
    if (dismissed) return;

    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 6000);

    return () => clearTimeout(showTimer);
  }, [dismissed]);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (dismissed || !isVisible) return;

    const rotateTimer = setInterval(() => {
      advance();
    }, 8000);

    return () => clearInterval(rotateTimer);
  }, [dismissed, isVisible, advance]);

  if (dismissed) return null;

  const notification = notifications[currentIndex];

  const iconForType = (type: NotificationType) => {
    switch (type) {
      case "review":
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <Star size={16} className="fill-amber-400 text-amber-400" />
          </div>
        );
      case "session":
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
            <svg
              className="h-4 w-4 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <svg
              className="h-4 w-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-20 left-4 z-40 max-w-[340px] rounded-lg border-l-4 border-l-[#C9A96E] bg-[#FAF8F5] p-4 shadow-lg lg:bottom-6"
          role="status"
          aria-live="polite"
        >
          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-2 rounded p-1 text-rani-muted hover:text-rani-navy transition-colors"
            aria-label="Dismiss notifications"
          >
            <X size={14} />
          </button>

          <div className="flex items-start gap-3 pr-5">
            {iconForType(notification.type)}
            <div className="min-w-0">
              <p className="font-body text-sm leading-snug text-rani-navy">
                {notification.message}
              </p>
              <p className="mt-1 font-body text-xs text-rani-muted">
                {notification.detail}
              </p>
            </div>
          </div>

          {/* Subtle progress bar */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-[#C9A96E]/40 rounded-b-lg"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 8, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
