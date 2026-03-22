'use client';

import { motion } from 'framer-motion';

interface WizardProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export default function WizardProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
}: WizardProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Desktop: step labels */}
      <div className="hidden md:flex items-center justify-between mb-3 px-1">
        {stepLabels.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div
              key={label}
              className="flex flex-col items-center flex-1 min-w-0"
            >
              {/* Step dot */}
              <div className="relative flex items-center justify-center mb-1.5">
                <motion.div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-body font-semibold transition-colors duration-300 ${
                    isCompleted
                      ? 'bg-[#C9A96E] text-white'
                      : isCurrent
                        ? 'bg-[#C9A96E] text-white ring-2 ring-[#C9A96E]/30 ring-offset-2 ring-offset-[#0F1D2C]'
                        : 'bg-[#0F1D2C]/40 text-white/40'
                  }`}
                  layout
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  {isCompleted ? (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </motion.div>
              </div>

              {/* Step label */}
              <span
                className={`text-[10px] leading-tight font-body text-center truncate max-w-[72px] transition-colors duration-300 ${
                  isCurrent
                    ? 'text-[#C9A96E] font-semibold'
                    : isCompleted
                      ? 'text-white/70'
                      : 'text-white/30'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile: step counter text */}
      <div className="flex md:hidden items-center justify-between mb-2 px-1">
        <span className="text-xs font-body text-white/60">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-xs font-body text-[#C9A96E] font-semibold">
          {stepLabels[currentStep]}
        </span>
      </div>

      {/* Progress bar track */}
      <div className="relative w-full h-1.5 rounded-full bg-[#0F1D2C]/60 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, #C9A96E 0%, #DFC090 50%, #C9A96E 100%)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full opacity-30"
          style={{
            width: `${progress}%`,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
