'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, DollarSign, Calendar, Target, Users, Star } from 'lucide-react';
import SparklineChart from '../charts/SparklineChart';
import ProgressBar from '../charts/ProgressBar';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/formatters';

const ICON_MAP: Record<string, React.ElementType> = {
  'dollar-sign': DollarSign,
  'calendar': Calendar,
  'target': Target,
  'users': Users,
  'star': Star,
};

interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'flat';
    label?: string;
  };
  sparklineData?: number[];
  progress?: {
    current: number;
    target: number;
    label?: string;
  };
  icon?: string;
  size?: 'hero' | 'standard' | 'compact';
  loading?: boolean;
}

export default function KPICard({
  title,
  value,
  prefix = '',
  suffix = '',
  trend,
  sparklineData,
  progress,
  icon,
  size = 'standard',
  loading = false,
}: KPICardProps) {
  const Icon = icon ? ICON_MAP[icon] : null;

  if (loading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-6 ${size === 'hero' ? 'min-h-[180px]' : ''}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-rani-border rounded w-24" />
          <div className="h-8 bg-rani-border rounded w-32" />
          <div className="h-2 bg-rani-border rounded w-full" />
        </div>
      </div>
    );
  }

  const formattedValue = prefix === '$'
    ? formatCurrency(value, size === 'compact')
    : suffix === '%'
      ? formatPercent(value)
      : formatNumber(value);

  const displayValue = prefix === '$' ? formattedValue : `${prefix}${formattedValue}${suffix && !suffix.startsWith('%') ? suffix : ''}`;

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 40px rgba(15, 29, 44, 0.08)' }}
      className={`
        bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border
        transition-all duration-300
        ${size === 'hero' ? 'p-6' : size === 'compact' ? 'p-4' : 'p-5'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-rani-gold/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-rani-gold" />
            </div>
          )}
          <span className="text-xs font-body font-semibold uppercase tracking-wider text-rani-muted">
            {title}
          </span>
        </div>

        {/* Trend Badge */}
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body font-medium ${
            trend.direction === 'up' ? 'bg-green-50 text-green-600' :
            trend.direction === 'down' ? 'bg-red-50 text-red-500' :
            'bg-gray-50 text-gray-500'
          }`}>
            {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend.direction === 'flat' && <Minus className="w-3 h-3" />}
            <span>{trend.value.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`font-body font-bold text-rani-navy ${
        size === 'hero' ? 'text-3xl' : size === 'compact' ? 'text-xl' : 'text-2xl'
      }`}>
        {displayValue}
      </div>

      {trend?.label && (
        <p className="text-[11px] font-body text-rani-muted mt-0.5">{trend.label}</p>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3 h-10">
          <SparklineChart data={sparklineData} />
        </div>
      )}

      {/* Progress Bar */}
      {progress && (
        <div className="mt-3">
          <ProgressBar
            current={progress.current}
            target={progress.target}
            label={progress.label}
          />
        </div>
      )}
    </motion.div>
  );
}
