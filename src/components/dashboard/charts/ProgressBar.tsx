'use client';

import { motion } from 'framer-motion';
import { getScoreColor } from '@/lib/utils/formatters';

interface ProgressBarProps {
  current?: number;
  target?: number;
  /** Shorthand: if `value` is provided (0-100), used directly as percentage */
  value?: number;
  /** Direct color override */
  color?: string;
  label?: string;
  showPercentage?: boolean;
  height?: number;
  colorMode?: 'score' | 'gold' | 'green';
}

export default function ProgressBar({
  current,
  target,
  value,
  color: colorOverride,
  label,
  showPercentage = true,
  height = 6,
  colorMode = 'gold',
}: ProgressBarProps) {
  const percentage = value != null
    ? Math.min(value, 100)
    : (target != null && target > 0 ? Math.min(((current ?? 0) / target) * 100, 100) : 0);

  const getColor = () => {
    switch (colorMode) {
      case 'score': return getScoreColor(percentage);
      case 'green': return '#059669';
      case 'gold':
      default: return '#F3D6BE';
    }
  };

  const color = colorOverride ?? getColor();

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
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
