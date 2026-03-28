'use client';

import { Check, X } from 'lucide-react';
import { PLAN_COMPARISON, PLANS } from '@/lib/membership/plans';
import type { MembershipTier } from '@/lib/membership/plans';

export default function PlanComparison() {
  const tiers: MembershipTier[] = ['halo', 'glow', 'elite'];
  const categories = [...new Set(PLAN_COMPARISON.map(i => i.category))];

  return (
    <div className="bg-white rounded-xl border border-rani-border overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-rani-border">
        <h3 className="text-sm font-heading font-semibold text-rani-navy">Plan Comparison</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-rani-cream/50">
              <th className="text-left p-3 text-xs font-body font-medium text-rani-muted w-1/4">Feature</th>
              {tiers.map(tier => (
                <th key={tier} className="text-center p-3">
                  <div className="text-sm font-heading font-semibold text-rani-navy">{PLANS[tier].name}</div>
                  <div className="text-xs font-body text-rani-gold font-medium">${PLANS[tier].monthlyPrice}/mo</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <>
                <tr key={`cat-${category}`}>
                  <td colSpan={4} className="px-3 py-2 bg-gray-50">
                    <span className="text-[10px] font-body font-bold text-rani-muted uppercase tracking-wider">
                      {category}
                    </span>
                  </td>
                </tr>
                {PLAN_COMPARISON.filter(i => i.category === category).map((item, idx) => (
                  <tr key={`${category}-${idx}`} className="border-t border-rani-border/50">
                    <td className="p-3 text-xs font-body text-rani-text">{item.feature}</td>
                    {(['halo', 'glow', 'elite'] as const).map(tier => {
                      const val = item[tier];
                      return (
                        <td key={tier} className="p-3 text-center">
                          {typeof val === 'boolean' ? (
                            val ? (
                              <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-xs font-body font-medium text-rani-navy">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
