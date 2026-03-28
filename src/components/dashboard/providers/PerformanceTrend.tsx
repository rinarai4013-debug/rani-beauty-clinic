'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrendAnalysis } from '@/types/providers';

interface PerformanceTrendProps {
  trend: TrendAnalysis;
  formatValue?: (v: number) => string;
  height?: number;
}

export default function PerformanceTrend({ trend, formatValue, height = 60 }: PerformanceTrendProps) {
  const fmt = formatValue || ((v: number) => v.toFixed(1));
  const values = trend.dataPoints.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const DirectionIcon = trend.direction === 'improving' ? TrendingUp : trend.direction === 'declining' ? TrendingDown : Minus;
  const dirColor = trend.direction === 'improving' ? 'text-green-600' : trend.direction === 'declining' ? 'text-red-500' : 'text-gray-400';
  const dirLabel = trend.direction === 'improving' ? 'Improving' : trend.direction === 'declining' ? 'Declining' : 'Stable';

  // Build SVG path
  const width = 200;
  const padding = 4;
  const points = values.map((v, i) => {
    const x = padding + (i / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-body font-semibold text-sm text-rani-navy">{trend.metric}</h4>
        <div className={`flex items-center gap-1 text-xs font-body ${dirColor}`}>
          <DirectionIcon className="w-3.5 h-3.5" />
          {dirLabel} ({trend.changeRate > 0 ? '+' : ''}{trend.changeRate}%)
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <motion.path
          d={pathD}
          fill="none"
          stroke="#C9A96E"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#C9A96E" />
        ))}
      </svg>

      <div className="flex justify-between text-xs text-rani-muted font-body mt-1">
        <span>{trend.dataPoints[0]?.date ? new Date(trend.dataPoints[0].date).toLocaleDateString('en-US', { month: 'short' }) : ''}</span>
        <span>Forecast: {fmt(trend.forecast)}</span>
      </div>
    </div>
  );
}
