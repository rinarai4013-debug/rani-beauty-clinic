'use client';

import { TrendingUp, ArrowUpRight } from 'lucide-react';
import type { UpsellRecommendation } from '@/lib/revenue/upsell-engine';

interface UpsellPerformanceTableProps {
  recommendations: UpsellRecommendation[];
}

export default function UpsellPerformanceTable({ recommendations }: UpsellPerformanceTableProps) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-rani-muted text-sm font-body">
        No upsell recommendations available yet.
      </div>
    );
  }

  const typeIcons: Record<string, string> = {
    'add-on': '➕',
    'upgrade': '⬆️',
    'cross-sell': '↔️',
    'package': '📦',
    'membership': '⭐',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Type</th>
            <th className="text-left py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Service</th>
            <th className="text-left py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Timing</th>
            <th className="text-right py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Price</th>
            <th className="text-right py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Propensity</th>
            <th className="text-right py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Expected</th>
          </tr>
        </thead>
        <tbody>
          {recommendations.map((rec, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="py-2.5 px-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-rani-cream font-body">
                  {typeIcons[rec.type] || ''} {rec.type}
                </span>
              </td>
              <td className="py-2.5 px-3">
                <p className="font-body font-medium text-rani-navy text-sm">{rec.service}</p>
                <p className="text-xs text-rani-muted font-body mt-0.5">{rec.reason}</p>
              </td>
              <td className="py-2.5 px-3">
                <span className="text-xs font-body text-rani-muted">{rec.timing}</span>
              </td>
              <td className="py-2.5 px-3 text-right font-heading text-rani-navy">
                ${rec.price.toLocaleString()}
              </td>
              <td className="py-2.5 px-3 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        rec.propensityScore >= 60 ? 'bg-emerald-500' :
                        rec.propensityScore >= 35 ? 'bg-amber-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${rec.propensityScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-body text-rani-muted w-8 text-right">{rec.propensityScore}%</span>
                </div>
              </td>
              <td className="py-2.5 px-3 text-right">
                <span className="text-sm font-heading text-rani-navy">
                  ${Math.round(rec.price * rec.propensityScore / 100).toLocaleString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
