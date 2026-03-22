"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { clinicInfo } from "@/data/clinic-info";

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
  backgroundImage?: string;
  backgroundOverlay?: number;
  stats?: HeroStat[];
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
  const textColor = dark ? "text-white" : "text-rani-navy";

  // ── Split Layout ────────────────────────────────────────────────────────
  if (layout === "split") {
    return (
      <section className="relative bg-rani-navy min-h-screen overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] min-h-screen">
          {/* Left: Editorial Image — edge-to-edge, no overlay */}
          <div className="relative min-h-[35vh] lg:min-h-screen">
            {backgroundImage && (
              <Image
                src={backgroundImage}
                alt={`${title} — Rani Beauty Clinic`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 58vw"
                quality={85}
              />
            )}
          </div>

          {/* Right: Content Panel */}
          <div className="flex items-center bg-rani-navy px-6 py-12 lg:px-16 xl:px-20">
            <div className="w-full max-w-lg">
              {label && (
                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-rani-gold/70 mb-3">
                  {label}
                </p>
              )}

              <div className="mb-5 h-[1px] w-8 bg-rani-gold/60" />

              <h1 className={`font-heading text-[28px] font-bold leading-[1.15] md:text-4xl lg:text-[44px] xl:text-5xl ${textColor}`}>
                {title}
              </h1>

              {subtitle && (
                <p className="mt-5 max-w-[380px] font-body text-[15px] leading-[1.7] text-white/60">
                  {subtitle}
                </p>
              )}

              {badges && badges.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {badges.map((b) => (
                    <Badge key={b} variant="dark" icon="check">
                      {b}
                    </Badge>
                  ))}
                </div>
              )}

              {primaryCTA && (
                <div className="mt-8">
                  <Button
                    href={primaryCTA.href}
                    target={primaryCTA.target}
                    className="!bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light !rounded-full !px-8 w-full sm:w-auto"
                  >
                    {primaryCTA.text}
                  </Button>
                </div>
              )}

              <a
                href={clinicInfo.phoneTel}
                className="mt-4 inline-block font-body text-[15px] text-white/55 transition-colors hover:text-white/80 hover:underline"
              >
                Or call {clinicInfo.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Full Layout (original, kept for other pages) ─────────────────────────
  const bg = dark ? "bg-rani-navy" : "bg-rani-cream";

  return (
    <section
      className={`relative ${bg} ${
        fullHeight
          ? "min-h-screen flex items-center"
          : "pt-32 pb-20 md:pt-40 md:pb-28"
      } overflow-hidden`}
    >
      {backgroundImage && (
        <div className="absolute inset-0">
          <Image
            src={backgroundImage}
            alt={`${title} — Rani Beauty Clinic`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={85}
          />
          {backgroundOverlay > 0 && (
            <div
              className="absolute inset-0 bg-rani-navy"
              style={{ opacity: backgroundOverlay / 100 }}
            />
          )}
          {backgroundOverlay > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-rani-navy/90 via-rani-navy/60 to-transparent" />
          )}
        </div>
      )}

      {!backgroundImage && dark && (
        <div className="absolute inset-0 bg-gradient-to-br from-rani-navy via-rani-navy to-rani-navy-light opacity-80" />
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
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`font-heading text-4xl font-bold leading-tight md:text-5xl lg:text-6xl ${textColor}`}
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={`mt-6 max-w-xl font-body text-lg leading-relaxed ${
                dark ? "text-gray-300" : "text-rani-muted"
              }`}
            >
              {subtitle}
            </motion.p>
          )}

          {badge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
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
              transition={{ duration: 0.6, delay: 0.5 }}
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
              transition={{ duration: 0.6, delay: 0.6 }}
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

        {stats && stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
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
