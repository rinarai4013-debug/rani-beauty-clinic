'use client';

import { motion } from 'framer-motion';

interface MetricGaugeProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentile?: boolean;
  percentile?: number;
}

export default function MetricGauge({
  label, value, max, unit = '%', color = '#C9A96E', size = 'md', showPercentile, percentile,
}: MetricGaugeProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const sizeMap = { sm: 60, md: 80, lg: 100 };
  const radius = sizeMap[size];
  const stroke = size === 'sm' ? 6 : size === 'md' ? 8 : 10;
  const circumference = 2 * Math.PI * (radius / 2 - stroke);
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: radius, height: radius }}>
        <svg width={radius} height={radius} viewBox={`0 0 ${radius} ${radius}`}>
          <circle
            cx={radius / 2} cy={radius / 2} r={radius / 2 - stroke}
            fill="none" stroke="#F3F4F6" strokeWidth={stroke}
          />
          <motion.circle
            cx={radius / 2} cy={radius / 2} r={radius / 2 - stroke}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            transform={`rotate(-90 ${radius / 2} ${radius / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display font-bold ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'} text-rani-navy`}>
            {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}
          </span>
          {unit && <span className="text-[10px] text-rani-muted">{unit}</span>}
        </div>
      </div>
      <p className={`font-body text-rani-muted text-center ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>{label}</p>
      {showPercentile && percentile !== undefined && (
        <p className="text-[10px] font-body text-rani-gold-accessible">{percentile}th percentile</p>
      )}
    </div>
  );
}
