'use client';

import { motion } from 'framer-motion';
import { getScoreColor } from '@/lib/utils/formatters';

interface ProgressBarProps {
  current?: number;
  target?: number;
  value?: number;
  label?: string;
  showPercentage?: boolean;
  height?: number;
  colorMode?: 'score' | 'gold' | 'green';
  color?: string;
}

export default function ProgressBar({
  current,
  target,
  value,
  label,
  showPercentage = true,
  height = 6,
  colorMode = 'gold',
  color: customColor,
}: ProgressBarProps) {
  const normalizedCurrent = value ?? current ?? 0;
  const normalizedTarget = value != null ? 100 : (target ?? 100);
  const percentage = normalizedTarget > 0 ? Math.min((normalizedCurrent / normalizedTarget) * 100, 100) : 0;

  const getColor = () => {
    if (customColor) return customColor;
    switch (colorMode) {
      case 'score': return getScoreColor(percentage);
      case 'green': return '#059669';
      case 'gold':
      default: return '#F3D6BE';
    }
  };

  const resolvedColor = getColor();

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        {label && (
          <span className="text-[10px] font-body text-rani-muted">{label}</span>
        )}
        {showPercentage && (
          <span className="text-[10px] font-body font-semibold text-rani-muted">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      <div
        className="w-full bg-rani-border/50 rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: resolvedColor }}
        />
      </div>
    </div>
  );
}
