'use client';

import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Camera, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { TreatmentRecord } from '@/types/mobile';
import Link from 'next/link';

interface TreatmentCardProps {
  treatment: TreatmentRecord;
}

const categoryIcons: Record<string, string> = {
  injectables: '💉',
  laser: '✨',
  facial: '🧖‍♀️',
  body: '🦋',
  wellness: '💚',
  'skin-tightening': '🔬',
  'hair-restoration': '💇',
  'weight-loss': '🏃',
};

export default function TreatmentCard({ treatment }: TreatmentCardProps) {
  const latestRating = treatment.results.length > 0
    ? treatment.results[treatment.results.length - 1]
    : null;

  return (
    <Link href={`/m/treatments/${treatment.id}`}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-2xl p-4 shadow-sm border border-rani-border/30"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Category icon */}
            <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center text-lg flex-shrink-0">
              {categoryIcons[treatment.serviceCategory] || '✨'}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-rani-navy text-sm font-semibold truncate">
                {treatment.service}
              </h3>
              <p className="text-xs text-rani-muted font-body mt-0.5">
                {treatment.provider} &middot; {format(parseISO(treatment.date), 'MMM d, yyyy')}
              </p>

              {/* Tags row */}
              <div className="flex items-center gap-2 mt-2">
                {treatment.photos.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-rani-muted bg-rani-cream px-1.5 py-0.5 rounded-full">
                    <Camera size={10} />
                    {treatment.photos.length}
                  </span>
                )}
                {latestRating && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                    <Star size={10} fill="currentColor" />
                    {latestRating.rating}/5
                  </span>
                )}
                {treatment.aftercareInstructions.some((a) => !a.completed) && (
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                    Aftercare active
                  </span>
                )}
              </div>
            </div>
          </div>

          <ChevronRight size={16} className="text-rani-muted mt-1 flex-shrink-0" />
        </div>
      </motion.div>
    </Link>
  );
}
