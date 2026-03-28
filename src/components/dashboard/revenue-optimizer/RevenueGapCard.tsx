'use client';

import { motion } from 'framer-motion';
import { Clock, DollarSign, AlertTriangle } from 'lucide-react';

interface RevenueGapCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number' | 'percent';
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  severity?: 'info' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

export default function RevenueGapCard({
  title,
  value,
  format = 'currency',
  subtitle,
  trend,
  severity = 'info',
  icon,
}: RevenueGapCardProps) {
  const formatValue = (v: number) => {
    if (format === 'currency') return `$${v.toLocaleString()}`;
    if (format === 'percent') return `${v}%`;
    return v.toLocaleString();
  };

  const severityColors = {
    info: 'border-blue-200 bg-blue-50/50',
    warning: 'border-amber-200 bg-amber-50/50',
    critical: 'border-red-200 bg-red-50/50',
  };

  const severityIcons = {
    info: <DollarSign className="w-5 h-5 text-blue-600" />,
    warning: <Clock className="w-5 h-5 text-amber-600" />,
    critical: <AlertTriangle className="w-5 h-5 text-red-600" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 sm:p-5 ${severityColors[severity]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-body text-rani-muted uppercase tracking-wide">{title}</p>
          <p className="text-xl sm:text-2xl font-heading text-rani-navy mt-1">{formatValue(value)}</p>
          {subtitle && (
            <p className="text-xs font-body text-rani-muted mt-1">{subtitle}</p>
          )}
        </div>
        <div className="ml-3 p-2 rounded-lg bg-white/80 shadow-sm">
          {icon || severityIcons[severity]}
        </div>
      </div>
      {trend && (
        <div className={`mt-2 text-xs font-body font-medium ${
          trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-rani-muted'
        }`}>
          {trend === 'up' ? '↑ Improving' : trend === 'down' ? '↓ Declining' : '→ Stable'}
        </div>
      )}
    </motion.div>
  );
}
