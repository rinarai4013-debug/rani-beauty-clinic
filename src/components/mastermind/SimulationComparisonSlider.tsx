'use client';

/**
 * SimulationComparisonSlider
 *
 * Displays a with-treatment vs without-treatment comparison across
 * standard timeline points with an interactive timeframe selector.
 *
 * ⚠️ SAFETY: Disclaimer is always visible. No deterministic clinical claims.
 * No irreversible coupling with existing plan flow — purely presentational.
 */

import { useState } from 'react';
import type {
  TrajectoryScenario,
  SimulationTimeframe,
} from '@/lib/photo-simulation/trajectory-scenarios';

const TIMEFRAME_LABELS: Record<SimulationTimeframe, string> = {
  '1m': '1 Month',
  '3m': '3 Months',
  '6m': '6 Months',
  '12m': '12 Months',
};

const TIMEFRAMES: SimulationTimeframe[] = ['1m', '3m', '6m', '12m'];

interface SimulationComparisonSliderProps {
  scenario: TrajectoryScenario;
  className?: string;
}

export default function SimulationComparisonSlider({
  scenario,
  className = '',
}: SimulationComparisonSliderProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<SimulationTimeframe>('3m');

  const withT = scenario.withTreatment.find((p) => p.timeframe === selectedTimeframe);
  const withoutT = scenario.withoutTreatment.find((p) => p.timeframe === selectedTimeframe);

  if (!withT || !withoutT) return null;

  const delta = withT.improvementScore - withoutT.improvementScore;

  return (
    <div
      className={`bg-white/5 rounded-2xl p-6 border border-white/10 ${className}`}
      data-testid="simulation-comparison-slider"
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-[family-name:var(--font-heading)] text-lg text-white">
          {scenario.displayName}
        </h3>
        <p className="text-xs text-white/40 font-body mt-0.5">
          {scenario.isVisual
            ? 'Illustrative visual progression estimate'
            : 'Non-visual metabolic progress factor'}
        </p>
      </div>

      {/* Timeline Tabs */}
      <div
        className="flex gap-2 mb-6"
        role="group"
        aria-label="Select timeframe"
      >
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            type="button"
            data-testid={`timeframe-tab-${tf}`}
            onClick={() => setSelectedTimeframe(tf)}
            aria-pressed={selectedTimeframe === tf}
            className={`flex-1 py-1.5 rounded-lg text-xs font-body font-medium transition-colors ${
              selectedTimeframe === tf
                ? 'bg-[#C9A96E] text-[#0F1D2C]'
                : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            {TIMEFRAME_LABELS[tf]}
          </button>
        ))}
      </div>

      {/* Comparison bars */}
      <div className="space-y-4">
        {/* With Treatment */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-body text-green-400">With Treatment</span>
            <span
              className="text-xs font-body text-white/60"
              data-testid="with-treatment-score"
            >
              {withT.improvementScore}/100
            </span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500/60 rounded-full transition-all duration-500"
              style={{ width: `${withT.improvementScore}%` }}
              data-testid="with-treatment-bar"
            />
          </div>
          <p className="text-[10px] text-white/30 font-body mt-1">{withT.label}</p>
        </div>

        {/* Without Treatment */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-body text-red-400">Without Treatment</span>
            <span
              className="text-xs font-body text-white/60"
              data-testid="without-treatment-score"
            >
              {withoutT.improvementScore}/100
            </span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500/40 rounded-full transition-all duration-500"
              style={{ width: `${withoutT.improvementScore}%` }}
              data-testid="without-treatment-bar"
            />
          </div>
          <p className="text-[10px] text-white/30 font-body mt-1">{withoutT.label}</p>
        </div>
      </div>

      {/* Delta summary */}
      <div className="mt-4 p-3 bg-[#C9A96E]/10 rounded-xl border border-[#C9A96E]/20">
        <p className="text-xs font-body text-[#C9A96E]">
          Illustrative difference at {TIMEFRAME_LABELS[selectedTimeframe]}:{' '}
          <span className="font-semibold" data-testid="delta-value">
            +{delta} points
          </span>
        </p>
        <p className="text-[10px] font-body text-white/30 mt-1">
          Confidence level: {Math.round(withT.confidenceLevel * 100)}%
        </p>
      </div>

      {/* Required safety disclaimer */}
      <p
        className="mt-4 text-[10px] font-body text-white/20 text-center leading-relaxed"
        data-testid="simulation-disclaimer"
      >
        {scenario.disclaimer}
      </p>
    </div>
  );
}
