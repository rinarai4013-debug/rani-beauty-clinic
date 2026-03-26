'use client';

import { motion } from 'framer-motion';
import type { RunwayAnalysis } from '@/lib/finance/cash-flow';

interface RunwayGaugeProps {
  runway: RunwayAnalysis;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_COLORS = {
  healthy: { ring: '#10B981', bg: 'bg-green-50', text: 'text-green-700', label: 'Healthy' },
  caution: { ring: '#F59E0B', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Caution' },
  critical: { ring: '#EF4444', bg: 'bg-red-50', text: 'text-red-700', label: 'Critical' },
};

export default function RunwayGauge({ runway, size = 'md' }: RunwayGaugeProps) {
  const config = STATUS_COLORS[runway.status];
  const maxMonths = 24;
  const displayMonths = Math.min(runway.monthsOfRunway, maxMonths);
  const percentage = (displayMonths / maxMonths) * 100;

  const dims = size === 'sm' ? { w: 120, stroke: 8 } : size === 'lg' ? { w: 200, stroke: 12 } : { w: 160, stroke: 10 };
  const radius = (dims.w - dims.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75; // 270 degrees
  const offset = arc - (arc * Math.min(100, percentage)) / 100;

  return (
    <div className={`flex flex-col items-center ${config.bg} rounded-xl p-4`}>
      <div className="relative" style={{ width: dims.w, height: dims.w * 0.7 }}>
        <svg width={dims.w} height={dims.w * 0.75} viewBox={`0 0 ${dims.w} ${dims.w * 0.75}`}>
          {/* Background arc */}
          <circle
            cx={dims.w / 2}
            cy={dims.w / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={dims.stroke}
            strokeDasharray={`${arc} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(135 ${dims.w / 2} ${dims.w / 2})`}
          />
          {/* Value arc */}
          <motion.circle
            cx={dims.w / 2}
            cy={dims.w / 2}
            r={radius}
            fill="none"
            stroke={config.ring}
            strokeWidth={dims.stroke}
            strokeDasharray={`${arc} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(135 ${dims.w / 2} ${dims.w / 2})`}
            initial={{ strokeDashoffset: arc }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: dims.w * 0.08 }}>
          <span className={`font-heading font-bold ${config.text}`} style={{ fontSize: dims.w * 0.22 }}>
            {runway.monthsOfRunway > 99 ? '99+' : runway.monthsOfRunway.toFixed(1)}
          </span>
          <span className="text-xs font-body text-rani-muted">months</span>
        </div>
      </div>

      <span className={`mt-1 px-3 py-0.5 rounded-full text-xs font-body font-medium ${config.text} ${config.bg} border ${runway.status === 'healthy' ? 'border-green-200' : runway.status === 'caution' ? 'border-amber-200' : 'border-red-200'}`}>
        {config.label} Runway
      </span>

      {/* Scenario mini-table */}
      <div className="mt-3 w-full text-xs font-body space-y-1">
        <div className="flex justify-between">
          <span className="text-rani-muted">Optimistic (+20%)</span>
          <span className="text-green-600 font-medium">{runway.scenarioRunway.optimistic > 99 ? '99+' : runway.scenarioRunway.optimistic} mo</span>
        </div>
        <div className="flex justify-between">
          <span className="text-rani-muted">Conservative (-20%)</span>
          <span className="text-amber-600 font-medium">{runway.scenarioRunway.conservative > 99 ? '99+' : runway.scenarioRunway.conservative} mo</span>
        </div>
        <div className="flex justify-between">
          <span className="text-rani-muted">Zero Revenue</span>
          <span className="text-red-500 font-medium">{runway.scenarioRunway.zeroRevenue > 99 ? '99+' : runway.scenarioRunway.zeroRevenue} mo</span>
        </div>
      </div>
    </div>
  );
}
