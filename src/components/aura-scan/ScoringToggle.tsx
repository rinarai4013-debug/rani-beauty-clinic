'use client';

import { motion } from 'framer-motion';
import type { ScoringMode } from '@/types/mastermind';

interface ScoringToggleProps {
  mode: ScoringMode;
  onChange: (mode: ScoringMode) => void;
}

export default function ScoringToggle({ mode, onChange }: ScoringToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F8F6F1] border border-[#E8E4DF]">
      <button
        type="button"
        onClick={() => onChange('absolute')}
        className={`
          relative px-4 py-2 rounded-lg font-body text-xs font-medium transition-colors
          ${mode === 'absolute' ? 'text-white' : 'text-[#0F1D2C]/60 hover:text-[#0F1D2C]'}
        `}
      >
        {mode === 'absolute' && (
          <motion.div
            layoutId="scoringToggle"
            className="absolute inset-0 bg-[#0F1D2C] rounded-lg"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10">Absolute</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('peerComparative')}
        className={`
          relative px-4 py-2 rounded-lg font-body text-xs font-medium transition-colors
          ${mode === 'peerComparative' ? 'text-white' : 'text-[#0F1D2C]/60 hover:text-[#0F1D2C]'}
        `}
      >
        {mode === 'peerComparative' && (
          <motion.div
            layoutId="scoringToggle"
            className="absolute inset-0 bg-[#0F1D2C] rounded-lg"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10">vs Peers</span>
      </button>
    </div>
  );
}
