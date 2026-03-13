"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { staggerItem } from "@/components/animations/StaggerChildren";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  /** Primary image path */
  image?: string;
  /** Hover image path (swap on hover) */
  hoverImage?: string;
  /** Price display e.g. "From $199" */
  price?: string;
  /** Duration e.g. "30 min" */
  duration?: string;
}

export default function ServiceCard({
  title,
  description,
  icon,
  href,
  image,
  hoverImage,
  price,
  duration,
}: ServiceCardProps) {
  const icons: Record<string, typeof LucideIcons.Sparkles> =
    LucideIcons as unknown as Record<string, typeof LucideIcons.Sparkles>;
  const IconComponent = icons[icon] || LucideIcons.Sparkles;

  return (
    <motion.div variants={staggerItem}>
      <Link href={href} className="group block h-full">
        <div className="relative h-full overflow-hidden rounded-xl border border-rani-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_10px_40px_rgba(15,29,44,0.08)] hover:-translate-y-1 hover:border-b-2 hover:border-b-rani-gold">
          {/* Image area */}
          {image && image.length > 0 ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-rani-cream">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              {/* Hover image overlay */}
              {hoverImage && (
                <Image
                  src={hoverImage}
                  alt={title}
                  fill
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              )}
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
              {/* Price / Duration badges */}
              {(price || duration) && (
                <div className="absolute bottom-3 left-3 flex gap-2">
                  {price && (
                    <span className="rounded-full bg-rani-gold px-3 py-1 font-body text-xs font-semibold text-rani-navy">
                      {price}
                    </span>
                  )}
                  {duration && (
                    <span className="rounded-full bg-white/90 px-3 py-1 font-body text-xs font-semibold text-rani-navy backdrop-blur-sm">
                      {duration}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Fallback: elegant gradient card for wellness services */
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-rani-navy via-rani-navy-light to-rani-navy">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(243,214,190,0.12)_0%,transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(243,214,190,0.06)_0%,transparent_50%)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-rani-gold/20 bg-white/5 backdrop-blur-sm">
                  <IconComponent size={28} className="text-rani-gold" />
                </div>
                <div className="mt-3 h-px w-8 bg-rani-gold/30" />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
              {(price || duration) && (
                <div className="absolute bottom-3 left-3 flex gap-2">
                  {price && (
                    <span className="rounded-full bg-rani-gold px-3 py-1 font-body text-xs font-semibold text-rani-navy">
                      {price}
                    </span>
                  )}
                  {duration && (
                    <span className="rounded-full bg-white/90 px-3 py-1 font-body text-xs font-semibold text-rani-navy backdrop-blur-sm">
                      {duration}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Text content */}
          <div className={image && image.length > 0 ? "p-5" : "p-5"}>
            {/* Show small icon next to title when image is present */}
            {image && image.length > 0 && (
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-rani-cream">
                <IconComponent size={16} className="text-rani-gold" />
              </div>
            )}
            <h3 className="font-body text-lg font-bold text-rani-navy transition-colors group-hover:text-rani-gold">
              {title}
            </h3>
            <p className="mt-2 line-clamp-2 font-body text-sm leading-relaxed text-rani-muted">
              {description}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 font-body text-sm font-semibold text-rani-navy transition-colors group-hover:text-rani-gold">
              Learn More
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
