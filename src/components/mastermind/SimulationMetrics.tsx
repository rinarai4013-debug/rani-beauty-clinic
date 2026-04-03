'use client';

import { motion } from 'framer-motion';
import type { SimulationFrame, SimulationComparison } from '@/types/mastermind';

interface SimulationMetricsProps {
  comparison: SimulationComparison;
  withFrame: SimulationFrame | null;
  withoutFrame: SimulationFrame | null;
  currentScore: number;
}

export default function SimulationMetrics({
  comparison,
  withFrame,
  withoutFrame,
  currentScore,
}: SimulationMetricsProps) {
  const keyDiffs = comparison?.comparison?.keyDifferentiators || [];
  const costOfDelay = comparison?.costOfDelay;

  return (
    <div className="space-y-4">
      {/* Score Comparison */}
      {withFrame && withoutFrame && (
        <div className="grid grid-cols-3 gap-3">
          {/* With Treatment */}
          <div className="p-3 rounded-xl bg-[#059669]/5 border border-[#059669]/20 text-center">
            <p className="font-body text-xs text-[#059669]/60">With Plan</p>
            <p className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#059669]">
              {withFrame.auraScoreProjection ?? '—'}
            </p>
            <p className="font-body text-xs text-[#059669]/60">
              Age: {withFrame.skinAgeProjection ?? '—'}
            </p>
          </div>

          {/* Current */}
          <div className="p-3 rounded-xl bg-[#F8F6F1] border border-[#E8E4DF] text-center">
            <p className="font-body text-xs text-[#0F1D2C]/40">Current</p>
            <p className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#0F1D2C]">
              {currentScore}
            </p>
            <p className="font-body text-xs text-[#0F1D2C]/40">Today</p>
          </div>

          {/* Without Treatment */}
          <div className="p-3 rounded-xl bg-[#DC2626]/5 border border-[#DC2626]/20 text-center">
            <p className="font-body text-xs text-[#DC2626]/60">No Treatment</p>
            <p className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#DC2626]">
              {withoutFrame.auraScoreProjection ?? '—'}
            </p>
            <p className="font-body text-xs text-[#DC2626]/60">
              Age: {withoutFrame.skinAgeProjection ?? '—'}
            </p>
          </div>
        </div>
      )}

      {/* Key Differentiators */}
      {keyDiffs.length > 0 && (
        <div className="space-y-2">
          {keyDiffs.map((diff, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#C9A96E]/5 border border-[#C9A96E]/15"
            >
              <span className="font-body text-sm text-[#C9A96E]">&#10024;</span>
              <span className="font-body text-xs text-[#0F1D2C]/70">{diff}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Cost of Delay */}
      {costOfDelay && (
        <div className="p-4 rounded-xl bg-[#0F1D2C]/5 border border-[#0F1D2C]/10">
          <h4 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide mb-3">
            Cost of Waiting
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-body text-xs text-[#0F1D2C]/40">Now</p>
              <p className="font-body text-sm font-bold text-[#059669]">
                ${(costOfDelay.currentPlanCost ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-body text-xs text-[#0F1D2C]/40">In 1 Year</p>
              <p className="font-body text-sm font-bold text-[#D97706]">
                ${(costOfDelay.costIfDelayed1Year ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-body text-xs text-[#0F1D2C]/40">In 3 Years</p>
              <p className="font-body text-sm font-bold text-[#DC2626]">
                ${(costOfDelay.costIfDelayed3Years ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
          {costOfDelay.reasoning && (
            <p className="font-body text-xs text-[#0F1D2C]/50 mt-3 leading-relaxed">
              {costOfDelay.reasoning}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
