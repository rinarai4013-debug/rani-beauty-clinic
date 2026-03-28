'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { PipelineForecast } from '@/types/crm';

interface ForecastChartProps {
  forecasts: PipelineForecast[];
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount}`;
}

export default function ForecastChart({ forecasts }: ForecastChartProps) {
  if (forecasts.length === 0) return null;

  const maxValue = Math.max(...forecasts.map(f => f.bestCase), 1);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
      <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
        Revenue Forecast
      </h3>

      <div className="space-y-4">
        {forecasts.map((forecast, i) => {
          const expectedPct = (forecast.expectedRevenue / maxValue) * 100;
          const bestPct = (forecast.bestCase / maxValue) * 100;
          const worstPct = (forecast.worstCase / maxValue) * 100;

          return (
            <div key={forecast.period}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-rani-navy">{forecast.period}</span>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-rani-muted">{forecast.dealCount} deals</span>
                  <span className="font-medium text-rani-navy">{formatCurrency(forecast.expectedRevenue)}</span>
                </div>
              </div>

              {/* Stacked bar showing range */}
              <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
                {/* Best case (background) */}
                <div
                  className="absolute h-full bg-green-100 rounded-lg"
                  style={{ width: `${bestPct}%` }}
                />
                {/* Expected (middle) */}
                <div
                  className="absolute h-full bg-rani-gold/30 rounded-lg"
                  style={{ width: `${expectedPct}%` }}
                />
                {/* Worst case (front) */}
                <div
                  className="absolute h-full bg-rani-gold/60 rounded-lg"
                  style={{ width: `${worstPct}%` }}
                />
                {/* Label */}
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-[10px] font-medium text-rani-navy">
                    {formatCurrency(forecast.worstCase)} — {formatCurrency(forecast.bestCase)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mt-0.5 text-[9px] text-rani-muted">
                <span>Worst: {formatCurrency(forecast.worstCase)}</span>
                <span>Best: {formatCurrency(forecast.bestCase)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total forecast */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-rani-muted">Total Forecasted</span>
        <span className="text-sm font-heading text-rani-navy">
          {formatCurrency(forecasts.reduce((sum, f) => sum + f.expectedRevenue, 0))}
        </span>
      </div>
    </div>
  );
}
