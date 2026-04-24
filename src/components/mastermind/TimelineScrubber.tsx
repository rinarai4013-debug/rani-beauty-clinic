'use client';

import { motion } from 'framer-motion';

interface TimelineScrubberProps {
  timepoints: string[];
  activeIndex: number;
  onChange: (_index: number) => void;
  color?: string;
}

export default function TimelineScrubber({
  timepoints,
  activeIndex,
  onChange,
  color = '#C9A96E',
}: TimelineScrubberProps) {
  return (
    <div className="relative px-4">
      {/* Track line */}
      <div className="absolute top-3 left-8 right-8 h-0.5 bg-[#E8E4DF]" />

      {/* Progress fill */}
      <motion.div
        className="absolute top-3 left-8 h-0.5 rounded-full"
        style={{ backgroundColor: color }}
        animate={{
          width: `${(activeIndex / Math.max(1, timepoints.length - 1)) * 100}%`,
          maxWidth: 'calc(100% - 4rem)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />

      {/* Markers */}
      <div className="flex justify-between relative">
        {timepoints.map((label, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(i)}
              className="flex flex-col items-center gap-1.5 group"
            >
              {/* Dot */}
              <motion.div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
                style={{
                  borderColor: isActive || isPast ? color : '#E8E4DF',
                  backgroundColor: isActive ? color : isPast ? color + '30' : 'white',
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="scrubberDot"
                    className="w-2 h-2 rounded-full bg-white"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <span
                className={`font-body text-xs transition-colors ${
                  isActive
                    ? 'font-semibold text-[#0F1D2C]'
                    : isPast
                      ? 'text-[#0F1D2C]/60'
                      : 'text-[#0F1D2C]/30 group-hover:text-[#0F1D2C]/50'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
