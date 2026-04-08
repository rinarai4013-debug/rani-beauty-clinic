'use client';

import type { ReactNode } from 'react';
import {
  Calendar,
  DollarSign,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Star,
  type LucideIcon,
} from 'lucide-react';

type TrendObject = {
  value: number;
  direction: 'up' | 'down';
};

type KPICardProps = {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  icon?: ReactNode | 'calendar' | 'dollar-sign' | 'target' | 'users' | 'star' | 'trending-up';
  size?: 'hero' | 'compact';
  trend?: string | TrendObject;
  trendUp?: boolean;
};

const ICON_MAP: Record<string, LucideIcon> = {
  calendar: Calendar,
  'dollar-sign': DollarSign,
  target: Target,
  users: Users,
  star: Star,
  'trending-up': TrendingUp,
};

function renderIcon(icon: KPICardProps['icon']) {
  if (!icon) return null;
  if (typeof icon === 'string') {
    const Icon = ICON_MAP[icon];
    return Icon ? <Icon className="w-4 h-4 text-rani-gold" /> : null;
  }

  return icon;
}

function renderValue(value: KPICardProps['value'], prefix?: string, suffix?: string) {
  const rendered = typeof value === 'number' ? value.toLocaleString() : value;
  return `${prefix ?? ''}${rendered}${suffix ?? ''}`;
}

export default function KPICard({
  title,
  value,
  prefix,
  suffix,
  icon,
  size = 'compact',
  trend,
  trendUp,
}: KPICardProps) {
  const iconNode = renderIcon(icon);
  const isHero = size === 'hero';
  const hasObjectTrend = typeof trend === 'object' && trend !== null;
  const trendPositive = hasObjectTrend ? trend.direction === 'up' : trendUp;
  const TrendIcon = trendPositive ? TrendingUp : TrendingDown;
  const trendText = hasObjectTrend
    ? `${trend.value}${suffix === '%' ? '%' : ''}`
    : typeof trend === 'string'
      ? trend
      : null;

  return (
    <div
      className={[
        'rounded-xl border border-rani-navy/10 bg-white shadow-sm',
        isHero ? 'p-5 sm:p-6' : 'p-4',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-body uppercase tracking-[0.18em] text-rani-muted">
            {title}
          </div>
          <div className={isHero ? 'mt-3 text-3xl font-heading text-rani-navy' : 'mt-2 text-2xl font-heading text-rani-navy'}>
            {renderValue(value, prefix, suffix)}
          </div>
        </div>
        {iconNode && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rani-gold/10 text-rani-gold">
            {iconNode}
          </div>
        )}
      </div>

      {trendText && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-body">
          <TrendIcon className={trendPositive ? 'h-3.5 w-3.5 text-emerald-600' : 'h-3.5 w-3.5 text-amber-600'} />
          <span className={trendPositive ? 'text-emerald-700' : 'text-amber-700'}>
            {trendText}
          </span>
        </div>
      )}
    </div>
  );
}
