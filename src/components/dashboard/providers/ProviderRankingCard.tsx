'use client';

import { Star, TrendingDown, TrendingUp } from 'lucide-react';

type ProviderRankingCardProps = {
  rank: number;
  name: string;
  role: string;
  revenue: number;
  trend: 'flat' | 'up' | 'down';
  utilization: number;
  rebookRate: number;
  avgRating: number;
  color?: string;
  onClick?: () => void;
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

export default function ProviderRankingCard({
  rank,
  name,
  role,
  revenue,
  trend,
  utilization,
  rebookRate,
  avgRating,
  color = '#C9A96E',
  onClick,
}: ProviderRankingCardProps) {
  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp;
  const trendColor = trend === 'down' ? 'text-amber-600' : trend === 'up' ? 'text-emerald-600' : 'text-rani-muted';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-rani-border bg-white p-4 text-left shadow-sm transition hover:border-rani-gold/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-rani-navy"
            style={{ backgroundColor: `${color}22` }}
          >
            #{rank}
          </div>
          <div>
            <div className="text-base font-heading text-rani-navy">{name}</div>
            <div className="text-sm font-body text-rani-muted">{role}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-body ${trendColor}`}>
          {trend === 'flat' ? (
            <span>Flat</span>
          ) : (
            <>
              <TrendIcon className="h-3.5 w-3.5" />
              <span>{trend === 'up' ? 'Rising' : 'Cooling'}</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-rani-muted">Revenue</div>
          <div className="mt-1 font-semibold text-rani-navy">{formatCurrency(revenue)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-rani-muted">Utilization</div>
          <div className="mt-1 font-semibold text-rani-navy">{Math.round(utilization)}%</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-rani-muted">Rebook</div>
          <div className="mt-1 font-semibold text-rani-navy">{Math.round(rebookRate)}%</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-sm text-rani-muted">
        <Star className="h-4 w-4 fill-[#C9A96E] text-[#C9A96E]" />
        <span className="font-medium text-rani-navy">{avgRating.toFixed(1)}</span>
        <span>average rating</span>
      </div>
    </button>
  );
}
