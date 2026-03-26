'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus,
  DollarSign, Calendar, Target, Users, Star, Zap, Phone,
  BarChart3, Package, ShoppingBag, Clock, Shield,
  type LucideIcon,
} from 'lucide-react';
import SparklineChart from '../charts/SparklineChart';
import ProgressBar from '../charts/ProgressBar';
import { Shimmer, StatCardSkeleton } from './LoadingSkeleton';
import { InlineError } from './ErrorState';

/* ─── StatCard ─────────────────────────────────────────────────────────
 *  Premium metric card with:
 *  - Animated trend indicator (up/down/flat)
 *  - Optional sparkline chart
 *  - Optional progress bar toward a target
 *  - Built-in loading skeleton + error + empty states
 *  - Size variants: hero, standard, compact
 *  - Hover animation with premium shadow
 * ──────────────────────────────────────────────────────────────────── */

const ICON_MAP: Record<string, LucideIcon> = {
  'dollar-sign': DollarSign,
  'dollar': DollarSign,
  'calendar': Calendar,
  'target': Target,
  'users': Users,
  'star': Star,
  'zap': Zap,
  'phone': Phone,
  'chart': BarChart3,
  'package': Package,
  'cart': ShoppingBag,
  'clock': Clock,
  'shield': Shield,
};

// ── Formatters ────────────────────────────────────────────────────────

function formatStatValue(value: number, format?: StatCardProps['format']): string {
  if (!format) return value.toLocaleString();

  switch (format) {
    case 'currency':
      if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 10_000) return `$${(value / 1_000).toFixed(1)}K`;
      return `$${value.toLocaleString()}`;
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'number':
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
      return value.toLocaleString();
    case 'duration':
      if (value >= 60) return `${Math.floor(value / 60)}h ${value % 60}m`;
      return `${value}m`;
    default:
      return value.toLocaleString();
  }
}

// ── Trend Badge ───────────────────────────────────────────────────────

interface TrendBadgeProps {
  value: number;
  direction: 'up' | 'down' | 'flat';
  label?: string;
  /** Whether "up" is good (default true). Set false for metrics like churn where down is good */
  upIsGood?: boolean;
}

function TrendBadge({ value, direction, label, upIsGood = true }: TrendBadgeProps) {
  const isPositive = (direction === 'up' && upIsGood) || (direction === 'down' && !upIsGood);
  const isNegative = (direction === 'down' && upIsGood) || (direction === 'up' && !upIsGood);

  const colorClasses = isPositive
    ? 'bg-emerald-50 text-emerald-600'
    : isNegative
      ? 'bg-red-50 text-red-500'
      : 'bg-gray-50 text-gray-500';

  const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;

  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body font-medium ${colorClasses}`}>
        <TrendIcon className="w-3 h-3" />
        {Math.abs(value).toFixed(1)}%
      </span>
      {label && (
        <span className="text-[10px] font-body text-rani-muted hidden sm:inline">{label}</span>
      )}
    </div>
  );
}

// ── StatCard Props ────────────────────────────────────────────────────

export interface StatCardProps {
  title: string;
  value?: number | null;
  format?: 'currency' | 'percent' | 'number' | 'duration';
  prefix?: string;
  suffix?: string;
  trend?: TrendBadgeProps;
  sparklineData?: number[];
  progress?: {
    current: number;
    target: number;
    label?: string;
  };
  icon?: string | LucideIcon;
  size?: 'hero' | 'standard' | 'compact';
  /** Custom content below the value */
  footer?: ReactNode;

  // ── Data states ─────────────────────────────────────────────────
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

export default function StatCard({
  title,
  value,
  format,
  prefix,
  suffix,
  trend,
  sparklineData,
  progress,
  icon,
  size = 'standard',
  footer,
  loading = false,
  error,
  onRetry,
  className = '',
}: StatCardProps) {
  // ── Loading state ───────────────────────────────────────────────
  if (loading) {
    return <StatCardSkeleton size={size} />;
  }

  // ── Error state ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-red-100 ${size === 'hero' ? 'p-6' : size === 'compact' ? 'p-4' : 'p-5'}`}>
        <InlineError
          message={`Failed to load ${title.toLowerCase()}`}
          onRetry={onRetry}
        />
      </div>
    );
  }

  // ── Resolve icon ────────────────────────────────────────────────
  const Icon = typeof icon === 'string' ? ICON_MAP[icon] ?? null : icon ?? null;

  // ── Format value ────────────────────────────────────────────────
  const displayValue = value != null
    ? `${prefix || ''}${formatStatValue(value, format)}${suffix || ''}`
    : '--';

  // ── Size styles ─────────────────────────────────────────────────
  const padding = size === 'hero' ? 'p-5 sm:p-6' : size === 'compact' ? 'p-3 sm:p-4' : 'p-4 sm:p-5';
  const valueSize = size === 'hero' ? 'text-2xl sm:text-3xl' : size === 'compact' ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl';

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 40px rgba(15, 29, 44, 0.08)' }}
      transition={{ duration: 0.2 }}
      className={`
        bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border
        transition-all duration-300
        ${padding} ${className}
      `}
    >
      {/* Header: icon + title + trend */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rani-gold/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rani-gold" />
            </div>
          )}
          <span className="text-[10px] sm:text-xs font-body font-semibold uppercase tracking-wider text-rani-muted truncate">
            {title}
          </span>
        </div>
        {trend && <TrendBadge {...trend} />}
      </div>

      {/* Value */}
      <div className={`font-body font-bold text-rani-navy ${valueSize} leading-tight`}>
        {displayValue}
      </div>

      {trend?.label && (
        <p className="text-[10px] sm:text-[11px] font-body text-rani-muted mt-0.5 sm:hidden">{trend.label}</p>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-2 sm:mt-3 h-8 sm:h-10">
          <SparklineChart data={sparklineData} />
        </div>
      )}

      {/* Progress bar */}
      {progress && (
        <div className="mt-2 sm:mt-3">
          <ProgressBar
            current={progress.current}
            target={progress.target}
            label={progress.label}
          />
        </div>
      )}

      {/* Custom footer */}
      {footer && <div className="mt-2 sm:mt-3">{footer}</div>}
    </motion.div>
  );
}

// ── StatCard Row Helper ───────────────────────────────────────────────

export function StatCardRow({
  children,
  columns = 4,
  className = '',
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${colClasses[columns]} gap-3 sm:gap-4 lg:gap-6 ${className}`}>
      {children}
    </div>
  );
}
