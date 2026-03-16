'use client';

import { motion } from 'framer-motion';
import { getScoreColor } from '@/lib/utils/formatters';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
  colorMode?: 'score' | 'gold';
}

export default function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  label,
  showValue = true,
  colorMode = 'score',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), 100);

  const color = colorMode === 'score' ? getScoreColor(progress) : '#F3D6BE';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-body font-bold text-rani-navy">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-[10px] font-body text-rani-muted text-center">{label}</span>
      )}
    </div>
  );
}
