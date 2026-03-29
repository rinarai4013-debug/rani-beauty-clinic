'use client';

import {
  DollarSign,
  TrendingUp,
  Repeat,
  CreditCard,
  Lightbulb,
} from 'lucide-react';
import type { GeneratedPackage } from '@/lib/plan-builder/types';

interface PlanEconomicsProps {
  packages: GeneratedPackage[];
  totalServices: number;
  totalValue: number;
}

// Complementary add-on suggestions based on missing categories
const ADD_ON_SUGGESTIONS: { category: string; name: string; price: number; reason: string }[] = [
  { category: 'skincare', name: 'Tretinoin Rx Skincare', price: 99, reason: 'Enhances and maintains treatment results at home' },
  { category: 'wellness', name: 'Tri-Immune Injection', price: 75, reason: 'Boosts immune function and recovery between treatments' },
  { category: 'wellness', name: 'Glutathione Injection', price: 100, reason: 'Powerful antioxidant for skin brightening' },
  { category: 'wellness', name: 'NAD+ Injection', price: 150, reason: 'Cellular rejuvenation and energy' },
  { category: 'wellness', name: 'Vitamin D3 Injection', price: 50, reason: 'Supports skin health and healing' },
  { category: 'facial', name: 'HydraFacial Signature', price: 225, reason: 'Deep cleansing and hydration between treatments' },
  { category: 'facial', name: 'Dermaplaning Add-On', price: 49, reason: 'Smoother skin texture and better product absorption' },
];

// Estimate monthly maintenance revenue from common service categories
function estimateMaintenanceRevenue(packages: GeneratedPackage[]): number {
  // Use Transform package as the baseline
  const transform = packages.find((p) => p.tier === 'Transform');
  if (!transform) return 0;
  // Rough estimate: maintenance is ~25% of active treatment cost per month
  return Math.round(transform.price * 0.04);
}

export default function PlanEconomics({ packages, totalServices, totalValue }: PlanEconomicsProps) {
  if (packages.length === 0 || totalServices === 0) {
    return null;
  }

  const transform = packages.find((p) => p.tier === 'Transform');
  const elite = packages.find((p) => p.tier === 'Elite');
  const start = packages.find((p) => p.tier === 'Start');

  // Projected revenue uses Transform as the expected sale
  const projectedRevenue = transform?.price ?? start?.price ?? 0;

  // Determine which categories are already in the plan
  const existingCategories = new Set<string>();
  for (const pkg of packages) {
    for (const li of pkg.lineItems) {
      const name = li.service.toLowerCase();
      if (name.includes('hydrafacial') || name.includes('facial') || name.includes('dermaplaning')) existingCategories.add('facial');
      if (name.includes('tretinoin') || name.includes('skincare')) existingCategories.add('skincare');
      if (name.includes('immune') || name.includes('glutathione') || name.includes('nad') || name.includes('vitamin') || name.includes('b12')) existingCategories.add('wellness');
      if (name.includes('botox') || name.includes('filler')) existingCategories.add('injectables');
      if (name.includes('laser hair')) existingCategories.add('laser-hair-removal');
    }
  }

  const addOnSuggestions = ADD_ON_SUGGESTIONS.filter((s) => !existingCategories.has(s.category)).slice(0, 3);

  const monthlyMaintenance = estimateMaintenanceRevenue(packages);

  // Cherry financing: 12-month payment for Transform
  const cherryMonthly = transform ? transform.monthlyPayment12 : start ? start.monthlyPayment12 : 0;

  return (
    <div className="bg-[#0F1D2C] rounded-xl border border-[#C9A96E]/20 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-[#C9A96E]" />
        <h3 className="text-sm font-semibold text-white">Plan Economics</h3>
        <span className="ml-auto text-[9px] text-[#C9A96E]/60 uppercase tracking-wider">Internal Only</span>
      </div>

      {/* Retail Value */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">Retail Value (no discount)</span>
          <span className="text-sm font-bold text-white tabular-nums">${totalValue.toLocaleString()}</span>
        </div>

        {/* Per-tier pricing */}
        {start && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">Start (Phase 1)</span>
            <span className="text-xs text-white/80 tabular-nums">${start.price.toLocaleString()}</span>
          </div>
        )}
        {transform && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#C9A96E] font-medium">Transform (1+2)</span>
              <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-[#C9A96E]/20 text-[#C9A96E]">Expected</span>
            </div>
            <span className="text-xs text-[#C9A96E] font-semibold tabular-nums">${transform.price.toLocaleString()}</span>
          </div>
        )}
        {elite && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">Elite (All phases)</span>
            <span className="text-xs text-white/80 tabular-nums">${elite.price.toLocaleString()}</span>
          </div>
        )}

        {/* Savings breakdown */}
        <div className="border-t border-white/10 pt-2 space-y-1">
          {transform && transform.savingsVsStandalone > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-green-400/80">Transform savings</span>
              <span className="text-[11px] text-green-400 tabular-nums">
                -${transform.savingsVsStandalone.toLocaleString()} ({transform.discount}%)
              </span>
            </div>
          )}
          {elite && elite.savingsVsStandalone > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-green-400/80">Elite savings</span>
              <span className="text-[11px] text-green-400 tabular-nums">
                -${elite.savingsVsStandalone.toLocaleString()} ({elite.discount}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Projected Revenue */}
      <div className="bg-[#C9A96E]/10 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-3.5 w-3.5 text-[#C9A96E]" />
          <span className="text-[11px] font-semibold text-[#C9A96E]">Projected Revenue</span>
        </div>
        <p className="text-xl font-bold text-white tabular-nums">${projectedRevenue.toLocaleString()}</p>
        <p className="text-[10px] text-white/50 mt-0.5">Based on Transform tier (most likely close)</p>
      </div>

      {/* Add-on Opportunities */}
      {addOnSuggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-[#C9A96E]" />
            <span className="text-[11px] font-semibold text-[#C9A96E]">Add-on Opportunities</span>
          </div>
          <div className="space-y-1.5">
            {addOnSuggestions.map((suggestion) => (
              <div key={suggestion.name} className="bg-white/5 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-white font-medium">{suggestion.name}</span>
                  <span className="text-[11px] text-[#C9A96E] font-semibold tabular-nums">${suggestion.price}</span>
                </div>
                <p className="text-[10px] text-white/50">{suggestion.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurring Potential */}
      {monthlyMaintenance > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Repeat className="h-3.5 w-3.5 text-[#C9A96E]" />
            <span className="text-[11px] font-semibold text-[#C9A96E]">Recurring Potential</span>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70">Est. monthly maintenance</span>
              <span className="text-sm font-bold text-white tabular-nums">${monthlyMaintenance.toLocaleString()}/mo</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">If client converts to ongoing maintenance schedule</p>
          </div>
        </div>
      )}

      {/* Financing Framing */}
      {cherryMonthly > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5 text-[#C9A96E]" />
            <span className="text-[11px] font-semibold text-[#C9A96E]">Financing Frame</span>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5">
            <p className="text-xs text-white/70">
              Transform as Cherry 12-month:
            </p>
            <p className="text-lg font-bold text-white mt-0.5">
              <span className="tabular-nums">${cherryMonthly}</span>
              <span className="text-xs text-white/50 font-normal">/mo for 12 months</span>
            </p>
            <p className="text-[10px] text-white/40 mt-1">
              &ldquo;That&rsquo;s less than ${Math.round(cherryMonthly / 30)}/day for a complete transformation&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
