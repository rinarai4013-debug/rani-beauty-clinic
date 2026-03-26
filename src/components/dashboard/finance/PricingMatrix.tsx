'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ServicePricingAnalysis, CompetitorComparison } from '@/lib/finance/pricing-intelligence';

interface PricingMatrixProps {
  services: ServicePricingAnalysis[];
  competitorComparison: CompetitorComparison;
}

const POSITION_BADGE: Record<string, { label: string; color: string }> = {
  below_market: { label: 'Below Market', color: 'bg-amber-100 text-amber-700' },
  at_market: { label: 'At Market', color: 'bg-blue-100 text-blue-700' },
  above_market: { label: 'Above Market', color: 'bg-green-100 text-green-700' },
  premium: { label: 'Premium', color: 'bg-purple-100 text-purple-700' },
};

export default function PricingMatrix({ services, competitorComparison }: PricingMatrixProps) {
  const competitors = competitorComparison.positioningMap;

  return (
    <div className="space-y-6">
      {/* Service pricing table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-heading font-semibold text-rani-navy">Service</th>
              <th className="text-right py-3 px-3 font-heading font-semibold text-rani-navy">Our Price</th>
              <th className="text-right py-3 px-3 font-heading font-semibold text-rani-navy">Market Avg</th>
              <th className="text-right py-3 px-3 font-heading font-semibold text-rani-navy">Optimal</th>
              <th className="text-center py-3 px-3 font-heading font-semibold text-rani-navy">Position</th>
              <th className="text-right py-3 px-3 font-heading font-semibold text-rani-navy">Uplift</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s, i) => {
              const badge = POSITION_BADGE[s.pricePosition] ?? POSITION_BADGE.at_market;
              const upliftPositive = s.potentialUplift > 0;

              return (
                <motion.tr
                  key={s.service}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-gray-100 hover:bg-rani-cream/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="font-body font-medium text-rani-navy">{s.service}</p>
                    <p className="text-xs text-rani-muted">{s.category} &middot; {s.marginPercent}% margin</p>
                  </td>
                  <td className="text-right py-3 px-3 font-body font-semibold text-rani-navy">${s.currentPrice}</td>
                  <td className="text-right py-3 px-3 font-body text-rani-muted">
                    {s.competitorAvgPrice > 0 ? `$${s.competitorAvgPrice}` : '—'}
                  </td>
                  <td className="text-right py-3 px-3 font-body font-semibold text-rani-gold">${s.optimalPrice}</td>
                  <td className="text-center py-3 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-body font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="text-right py-3 px-3">
                    <span className={`flex items-center justify-end gap-1 font-body font-medium ${upliftPositive ? 'text-green-600' : s.potentialUplift < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {upliftPositive ? <TrendingUp className="w-3.5 h-3.5" /> : s.potentialUplift < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                      {s.potentialUplift !== 0 ? `$${Math.abs(s.potentialUplift).toLocaleString()}/mo` : '—'}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Competitor positioning */}
      {competitors.length > 0 && (
        <div>
          <h4 className="text-sm font-heading font-semibold text-rani-navy mb-3">Competitor Positioning</h4>
          <div className="flex flex-wrap gap-2">
            {competitors.map(c => (
              <div
                key={c.competitor}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-body"
              >
                <span className="font-medium text-rani-navy">{c.competitor}</span>
                <span className="text-rani-muted ml-1.5 capitalize">{c.positioning}</span>
                <span className={`ml-1.5 font-medium ${c.avgPriceDiff > 0 ? 'text-green-600' : c.avgPriceDiff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {c.avgPriceDiff > 0 ? '+' : ''}{c.avgPriceDiff !== 0 ? `$${c.avgPriceDiff}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
