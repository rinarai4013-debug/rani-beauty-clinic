'use client';

import { motion } from 'framer-motion';
import type { TreatmentSequenceItem } from '@/types/mastermind';

const phaseIcons: Record<number, string> = {
  1: '🏗️',
  2: '✨',
  3: '💎',
  4: '🛡️',
};

const phaseColors: Record<number, string> = {
  1: '#7EC8A0',
  2: '#C9A96E',
  3: '#E8D5A8',
  4: '#A8C4E0',
};

interface SlideTreatmentJourneyProps {
  sequencing: TreatmentSequenceItem[];
  treatments: { id: string; treatmentName: string }[];
}

export default function SlideTreatmentJourney({ sequencing, treatments }: SlideTreatmentJourneyProps) {
  const getTreatmentName = (id: string) => treatments.find((t) => t.id === id)?.treatmentName || id;

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0F1D2C] px-8 py-10 overflow-hidden">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl md:text-3xl text-[#C9A96E] tracking-[0.15em] uppercase mb-8 text-center"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Your Treatment Journey
      </motion.h2>

      {/* Horizontal timeline */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-5xl overflow-x-auto pb-4 hide-scrollbar">
          {/* Connecting line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.4, duration: 1.5, ease: 'easeOut' }}
            className="absolute top-[60px] left-0 h-[2px] bg-gradient-to-r from-[#7EC8A0] via-[#C9A96E] to-[#A8C4E0]"
            style={{ opacity: 0.4 }}
          />

          <div className="flex gap-6 min-w-max px-4">
            {sequencing.map((phase, i) => {
              const color = phaseColors[phase.phase] || '#C9A96E';
              const treatmentNames = phase.treatments.map((t) => getTreatmentName(t.treatmentId));
              const uniqueTreatments = [...new Set(treatmentNames)];

              return (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex-shrink-0 w-[260px]"
                >
                  {/* Phase node */}
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2"
                      style={{ borderColor: color, background: `${color}15` }}
                      animate={{
                        boxShadow: [
                          `0 0 0px ${color}00`,
                          `0 0 20px ${color}30`,
                          `0 0 0px ${color}00`,
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                    >
                      <span className="text-sm font-bold" style={{ color }}>{phase.phase}</span>
                    </motion.div>
                    <div>
                      <h3 className="text-base font-semibold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                        {phase.phaseName}
                      </h3>
                      <p className="text-xs text-white/40" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {phase.duration}
                      </p>
                    </div>
                  </div>

                  {/* Phase card */}
                  <div
                    className="rounded-xl p-5 border backdrop-blur-sm"
                    style={{
                      background: `linear-gradient(135deg, ${color}08, transparent)`,
                      borderColor: `${color}20`,
                    }}
                  >
                    <div className="space-y-2 mb-4">
                      {uniqueTreatments.map((name) => (
                        <div key={name} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                          <span className="text-sm text-white/70" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/[0.06] pt-3">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Milestone
                      </p>
                      <p className="text-sm text-white/60 italic" style={{ fontFamily: 'Playfair Display, serif' }}>
                        {phase.expectedMilestone}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phase labels at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.8 }}
        className="flex justify-center gap-2 mt-4 flex-wrap"
      >
        {sequencing.map((phase, i) => {
          const color = phaseColors[phase.phase] || '#C9A96E';
          const isLast = i === sequencing.length - 1;
          return (
            <span key={phase.phase} className="text-xs text-white/30" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <span style={{ color }}>{phase.phaseName}</span>
              {!isLast && <span className="mx-2 text-white/15">&rarr;</span>}
            </span>
          );
        })}
      </motion.div>
    </div>
  );
}
