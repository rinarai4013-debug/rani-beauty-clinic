"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { staggerItem } from "@/components/animations/StaggerChildren";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
}

export default function ServiceCard({
  title,
  description,
  icon,
  href,
}: ServiceCardProps) {
  const icons: Record<string, typeof LucideIcons.Sparkles> = LucideIcons as unknown as Record<string, typeof LucideIcons.Sparkles>;
  const IconComponent = icons[icon] || LucideIcons.Sparkles;

  return (
    <motion.div variants={staggerItem}>
      <Link href={href} className="group block">
        <div className="relative overflow-hidden rounded-xl border border-rani-border bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_10px_40px_rgba(15,29,44,0.08)] hover:-translate-y-1 hover:border-b-2 hover:border-b-rani-gold">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-rani-cream">
            <IconComponent size={24} className="text-rani-gold" />
          </div>
          <h3 className="font-body text-lg font-bold text-rani-navy transition-colors group-hover:text-rani-gold">
            {title}
          </h3>
          <p className="mt-2 font-body text-sm text-rani-muted leading-relaxed">
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
      </Link>
    </motion.div>
  );
}
