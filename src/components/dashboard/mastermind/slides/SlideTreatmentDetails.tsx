'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { MastermindTreatment } from '@/types/mastermind';

function ConfidenceBadge({ confidence }: { confidence: number }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        background: 'rgba(201,169,110,0.12)',
        color: '#C9A96E',
        fontFamily: 'Montserrat, sans-serif',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 1l1.545 3.13L11 4.635 8.5 7.07l.59 3.43L6 8.885 2.91 10.5l.59-3.43L1 4.635l3.455-.505L6 1z" fill="#C9A96E" />
      </svg>
      {confidence}% match for your skin
    </div>
  );
}

function TreatmentCard({ treatment, index }: { treatment: MastermindTreatment; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const priorityColor =
    treatment.priority === 'essential'
      ? '#C9A96E'
      : treatment.priority === 'recommended'
      ? '#7EC8A0'
      : '#A8C4E0';

  const priorityLabel =
    treatment.priority === 'essential'
      ? 'Essential'
      : treatment.priority === 'recommended'
      ? 'Recommended'
      : 'Optional Enhancement';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      layout
      className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden cursor-pointer hover:border-[#C9A96E]/30 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-lg text-white font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                {treatment.treatmentName}
              </h4>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold"
                style={{
                  background: `${priorityColor}18`,
                  color: priorityColor,
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                {priorityLabel}
              </span>
            </div>
            <ConfidenceBadge confidence={treatment.aiConfidence} />
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-white/30 mt-1"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </motion.div>
        </div>

        {/* Quick stats row */}
        <div className="flex gap-6 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <div>
            <span className="text-white/40">Sessions: </span>
            <span className="text-white/80 font-medium">{treatment.sessionsRequired}</span>
          </div>
          <div>
            <span className="text-white/40">Results in: </span>
            <span className="text-white/80 font-medium">{treatment.timeToResults}</span>
          </div>
          <div>
            <span className="text-white/40">Improvement: </span>
            <span className="text-[#C9A96E] font-medium">{treatment.expectedImprovement}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4">
              {/* Why recommended */}
              <div>
                <h5 className="text-xs text-[#C9A96E] uppercase tracking-wider mb-1.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Why This Is Right for You
                </h5>
                <p className="text-sm text-white/60 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {treatment.aiReasoning}
                </p>
              </div>

              {/* Target zones and concerns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs text-white/40 uppercase tracking-wider mb-1.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Target Concerns
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {treatment.targetConcerns.map((c) => (
                      <span key={c} className="text-xs bg-white/[0.06] text-white/60 px-2 py-0.5 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-xs text-white/40 uppercase tracking-wider mb-1.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Details
                  </h5>
                  <div className="space-y-1 text-xs text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <p>Interval: {treatment.intervalBetweenSessions}</p>
                    <p>Longevity: {treatment.longevity}</p>
                    <p>Downtime: {treatment.downtime}</p>
                    <p>Risk: {treatment.riskLevel}</p>
                  </div>
                </div>
              </div>

              {/* Synergies */}
              {treatment.synergiesWith.length > 0 && (
                <div>
                  <h5 className="text-xs text-white/40 uppercase tracking-wider mb-1.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Works Best With
                  </h5>
                  <p className="text-sm text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {treatment.synergiesWith.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SlideTreatmentDetailsProps {
  treatments: MastermindTreatment[];
}

export default function SlideTreatmentDetails({ treatments }: SlideTreatmentDetailsProps) {
  // Sort: essential first, then recommended, then optional
  const sorted = [...treatments].sort((a, b) => {
    const order = { essential: 0, recommended: 1, optional: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0F1D2C] px-8 py-10 overflow-hidden">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl md:text-3xl text-[#C9A96E] tracking-[0.15em] uppercase mb-2 text-center"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Treatment Details
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-sm text-white/40 text-center mb-6"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Tap any treatment to learn more
      </motion.p>

      <div className="flex-1 overflow-y-auto space-y-3 max-w-3xl mx-auto w-full pr-2 hide-scrollbar">
        {sorted.map((treatment, i) => (
          <TreatmentCard key={treatment.id} treatment={treatment} index={i} />
        ))}
      </div>
    </div>
  );
}
