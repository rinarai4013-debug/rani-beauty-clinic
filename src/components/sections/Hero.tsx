"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface HeroStat {
  value: string;
  label: string;
}

interface HeroProps {
  label?: string;
  title: string;
  subtitle?: string;
  primaryCTA?: { text: string; href: string; target?: string };
  secondaryCTA?: { text: string; href: string; target?: string };
  badges?: string[];
  dark?: boolean;
  fullHeight?: boolean;
  badge?: string;
  /** Background image path (local or remote) */
  backgroundImage?: string;
  /** Overlay opacity 0-100 (default 60) */
  backgroundOverlay?: number;
  /** Stats bar below CTA */
  stats?: HeroStat[];
  /** Layout: full-bleed image vs split */
  layout?: "full" | "split";
}

export default function Hero({
  label,
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  badges,
  dark = true,
  fullHeight = false,
  badge,
  backgroundImage,
  backgroundOverlay = 60,
  stats,
  layout = "full",
}: HeroProps) {
  const bg = dark ? "bg-rani-navy" : "bg-rani-cream";
  const textColor = dark ? "text-white" : "text-rani-navy";

  return (
    <section
      className={`relative ${bg} ${
        fullHeight
          ? "min-h-screen flex items-center"
          : "pt-32 pb-20 md:pt-40 md:pb-28"
      } overflow-hidden`}
    >
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0">
          <Image
            src={backgroundImage}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={85}
          />
          <div
            className="absolute inset-0 bg-rani-navy"
            style={{ opacity: backgroundOverlay / 100 }}
          />
          {/* Gradient fade for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-rani-navy/90 via-rani-navy/60 to-transparent" />
        </div>
      )}

      {/* Fallback gradient overlay (no background image) */}
      {!backgroundImage && dark && (
        <div className="absolute inset-0 bg-gradient-to-br from-rani-navy via-rani-navy to-rani-navy-light opacity-80" />
      )}

      {/* Decorative gold circle */}
      {dark && (
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-rani-gold/5 blur-3xl" />
      )}

      <div className="relative mx-auto max-w-7xl px-6">
        <div className={layout === "split" ? "max-w-xl" : "max-w-3xl"}>
          {label && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0 }}
              className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-rani-gold mb-4"
            >
              {label}
            </motion.p>
          )}

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-6 h-0.5 w-[60px] origin-center bg-rani-gold"
          />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`font-heading text-4xl font-bold leading-tight md:text-5xl lg:text-6xl ${textColor}`}
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={`mt-6 max-w-xl font-body text-lg leading-relaxed ${
                dark ? "text-gray-300" : "text-rani-muted"
              }`}
            >
              {subtitle}
            </motion.p>
          )}

          {badge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-4"
            >
              <Badge icon="shield" variant={dark ? "dark" : "light"}>
                {badge}
              </Badge>
            </motion.div>
          )}

          {(primaryCTA || secondaryCTA) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              {primaryCTA && (
                <Button
                  href={primaryCTA.href}
                  target={primaryCTA.target}
                  className="!bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light"
                >
                  {primaryCTA.text}
                </Button>
              )}
              {secondaryCTA && (
                <Button
                  variant="ghost"
                  href={secondaryCTA.href}
                  className="!text-white"
                >
                  {secondaryCTA.text}
                </Button>
              )}
            </motion.div>
          )}

          {badges && badges.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              {badges.map((b) => (
                <Badge key={b} variant={dark ? "dark" : "light"} icon="check">
                  {b}
                </Badge>
              ))}
            </motion.div>
          )}
        </div>

        {/* Stats Bar */}
        {stats && stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-12 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 md:grid-cols-4"
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-heading text-3xl font-bold text-rani-gold md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 font-body text-sm text-gray-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
