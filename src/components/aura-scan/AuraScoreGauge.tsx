'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { AuraScore } from '@/types/mastermind';

interface AuraScoreGaugeProps {
  score: AuraScore;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const SIZE_MAP = {
  sm: { outer: 120, stroke: 8, fontSize: 'text-2xl', gradeSize: 'text-sm' },
  md: { outer: 180, stroke: 10, fontSize: 'text-4xl', gradeSize: 'text-lg' },
  lg: { outer: 240, stroke: 12, fontSize: 'text-5xl', gradeSize: 'text-xl' },
};

function getScoreColor(score: number): string {
  if (score >= 85) return '#059669'; // rani-success green
  if (score >= 70) return '#C9A96E'; // rani-gold
  if (score >= 55) return '#D97706'; // amber
  if (score >= 40) return '#EA580C'; // orange
  return '#DC2626'; // red
}

export default function AuraScoreGauge({
  score,
  size = 'md',
  animate = true,
}: AuraScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score.overall);
  const config = SIZE_MAP[size];
  const radius = (config.outer - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;
  const strokeDashoffset = circumference - progress;
  const color = getScoreColor(score.overall);

  // Animate counter
  useEffect(() => {
    if (!animate) return;
    const duration = 1500;
    const startTime = Date.now();
    const target = score.overall;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score.overall, animate]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.outer, height: config.outer }}>
        <svg
          width={config.outer}
          height={config.outer}
          viewBox={`0 0 ${config.outer} ${config.outer}`}
          className="-rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke="#E8E4DF"
            strokeWidth={config.stroke}
          />
          {/* Progress ring */}
          <motion.circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animate ? undefined : strokeDashoffset}
            initial={animate ? { strokeDashoffset: circumference } : undefined}
            animate={animate ? { strokeDashoffset } : undefined}
            transition={animate ? { duration: 1.5, ease: [0.4, 0, 0.2, 1] } : undefined}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-heading ${config.fontSize} font-bold text-[#0F1D2C]`}>
            {displayScore}
          </span>
          <span
            className={`font-body ${config.gradeSize} font-semibold`}
            style={{ color }}
          >
            {score.grade}
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="font-heading text-sm text-[#0F1D2C] font-semibold">
          Aura Score
        </p>
        <p className="font-body text-xs text-[#0F1D2C]/50">
          {score.label}
        </p>
      </div>

      {/* Skin age comparison */}
      {size !== 'sm' && (
        <div className="flex items-center gap-4 mt-1">
          <div className="text-center">
            <p className="font-body text-xs text-[#0F1D2C]/40">Skin Age</p>
            <p className="font-body text-sm font-semibold text-[#0F1D2C]">{score.skinAge}</p>
          </div>
          <div className="w-px h-6 bg-[#E8E4DF]" />
          <div className="text-center">
            <p className="font-body text-xs text-[#0F1D2C]/40">Actual Age</p>
            <p className="font-body text-sm font-semibold text-[#0F1D2C]">{score.chronologicalAge}</p>
          </div>
          <div className="w-px h-6 bg-[#E8E4DF]" />
          <div className="text-center">
            <p className="font-body text-xs text-[#0F1D2C]/40">Percentile</p>
            <p className="font-body text-sm font-semibold text-[#0F1D2C]">{score.percentile}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
