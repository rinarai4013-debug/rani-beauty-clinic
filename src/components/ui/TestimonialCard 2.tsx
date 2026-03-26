"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface TestimonialCardProps {
  name: string;
  text: string;
  rating: number;
  treatment?: string;
  date?: string;
}

export default function TestimonialCard({
  name,
  text,
  rating,
  treatment,
  date,
}: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative border-l-[3px] border-l-rani-gold bg-white p-8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
    >
      <span className="absolute -top-2 left-6 font-heading text-6xl text-rani-gold leading-none select-none">
        &ldquo;
      </span>
      <div className="mt-4">
        <p className="font-body text-lg text-rani-text italic leading-relaxed">
          {text}
        </p>
        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="font-body text-sm font-semibold text-rani-navy">
              {name}
            </p>
            {treatment && (
              <p className="font-body text-xs text-rani-muted mt-0.5">
                {treatment}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: rating }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className="fill-rani-gold text-rani-gold"
              />
            ))}
          </div>
        </div>
        {date && (
          <p className="mt-2 font-body text-xs text-rani-muted">{date}</p>
        )}
      </div>
    </motion.div>
  );
}
