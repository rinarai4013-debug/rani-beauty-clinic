'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LeadingIndicator } from '@/lib/revenue/forecasting-v2';

interface LeadingIndicatorsListProps {
  indicators: LeadingIndicator[];
}

export default function LeadingIndicatorsList({ indicators }: LeadingIndicatorsListProps) {
  return (
    <div className="space-y-2">
      {indicators.map((ind, i) => {
        const TrendIcon = ind.trend === 'up' ? TrendingUp : ind.trend === 'down' ? TrendingDown : Minus;
        const trendColor = ind.trend === 'up' ? 'text-emerald-600' : ind.trend === 'down' ? 'text-red-600' : 'text-gray-500';

        return (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
            <TrendIcon className={`w-5 h-5 flex-shrink-0 ${trendColor}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-body font-medium text-rani-navy">{ind.name}</p>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-rani-muted font-body">
                  {ind.lagDays}d lag
                </span>
              </div>
              <p className="text-xs font-body text-rani-muted mt-0.5">{ind.impactOnRevenue}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-heading text-rani-navy">{ind.currentValue}</p>
              <p className={`text-xs font-body ${trendColor} capitalize`}>{ind.trend}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
