"use client";

import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface HeroProps {
  label?: string;
  title: string;
  subtitle?: string;
  primaryCTA?: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
  badges?: string[];
  dark?: boolean;
  fullHeight?: boolean;
  badge?: string;
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
}: HeroProps) {
  const bg = dark ? "bg-rani-navy" : "bg-rani-cream";
  const textColor = dark ? "text-white" : "text-rani-navy";

  return (
    <section
      className={`relative ${bg} ${
        fullHeight ? "min-h-screen flex items-center" : "pt-32 pb-20 md:pt-40 md:pb-28"
      } overflow-hidden`}
    >
      {/* Subtle gradient overlay */}
      {dark && (
        <div className="absolute inset-0 bg-gradient-to-br from-rani-navy via-rani-navy to-rani-navy-light opacity-80" />
      )}

      {/* Decorative gold circle */}
      {dark && (
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-rani-gold/5 blur-3xl" />
      )}

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
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
                  className="!bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light"
                >
                  {primaryCTA.text}
                </Button>
              )}
              {secondaryCTA && (
                <Button variant="ghost" href={secondaryCTA.href} className="!text-white">
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
      </div>
    </section>
  );
}
