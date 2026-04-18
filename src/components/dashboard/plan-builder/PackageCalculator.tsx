'use client';

import { Crown, Check, Star, Sparkles, Zap } from 'lucide-react';
import type { GeneratedPackage } from '@/lib/plan-builder/types';

interface PackageCalculatorProps {
  packages: GeneratedPackage[];
}

const TIER_ICONS: Record<string, typeof Crown> = {
  Start: Star,
  Transform: Sparkles,
  Elite: Crown,
};

const TIER_COLORS: Record<string, { border: string; bg: string; badge: string }> = {
  Start: {
    border: 'border-gray-200',
    bg: 'bg-white',
    badge: 'bg-gray-100 text-gray-700',
  },
  Transform: {
    border: 'border-[#C9A96E]',
    bg: 'bg-[#C9A96E]/5',
    badge: 'bg-[#C9A96E] text-white',
  },
  Elite: {
    border: 'border-[#0F1D2C]',
    bg: 'bg-[#0F1D2C]/5',
    badge: 'bg-[#0F1D2C] text-white',
  },
};

export default function PackageCalculator({ packages }: PackageCalculatorProps) {
  if (packages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-[#0F1D2C] mb-3">Auto-Generated Packages</h3>
        <div className="text-center py-8 text-gray-400">
          <Crown className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">
            Add services to phases to generate tiered packages automatically
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-[#0F1D2C] mb-4">Auto-Generated Packages</h3>
      <div className="grid grid-cols-1 gap-3">
        {packages.map((pkg) => {
          const colors = TIER_COLORS[pkg.tier] || TIER_COLORS.Start;
          const Icon = TIER_ICONS[pkg.tier] || Star;
          const hasDiscount = pkg.discount > 0;

          return (
            <div
              key={pkg.tier}
              className={`rounded-xl border-2 p-4 transition-all ${colors.border} ${colors.bg} ${
                pkg.highlighted ? 'ring-2 ring-[#C9A96E]/20 shadow-sm' : ''
              }`}
            >
              {/* Tier header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-rani-gold-accessible" />
                  <span className="text-sm font-bold text-[#0F1D2C]">{pkg.name}</span>
                </div>
                {pkg.highlighted && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A96E] text-white">
                    Most Popular
                  </span>
                )}
              </div>

              {/* Subtitle */}
              <p className="text-[11px] text-gray-500 mb-3 ml-6">{pkg.subtitle}</p>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-[#0F1D2C] tabular-nums">
                  ${pkg.price.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through tabular-nums">
                    ${pkg.originalPrice.toLocaleString()}
                  </span>
                )}
                {hasDiscount && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                    Save {pkg.discount}%
                  </span>
                )}
              </div>

              {/* Savings amount */}
              {pkg.savingsVsStandalone > 0 && (
                <p className="text-[11px] text-green-600 font-medium mb-2">
                  You save ${pkg.savingsVsStandalone.toLocaleString()} vs. standalone pricing
                </p>
              )}

              {/* Result intensity */}
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="h-3 w-3 text-rani-gold-accessible" />
                <span className="text-[11px] font-medium text-[#0F1D2C] capitalize">
                  {pkg.resultIntensity}
                </span>
              </div>

              {/* Best for */}
              <p className="text-[11px] text-gray-500 italic mb-3">
                Best for: {pkg.bestFor}
              </p>

              {/* Why best callout — Transform only */}
              {pkg.whyBest && (
                <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/20 rounded-lg p-2.5 mb-3">
                  <p className="text-[11px] text-[#0F1D2C] font-medium leading-relaxed">
                    {pkg.whyBest}
                  </p>
                </div>
              )}

              {/* Sessions */}
              <p className="text-xs text-gray-500 mb-3">
                {pkg.sessions} session{pkg.sessions > 1 ? 's' : ''} included
              </p>

              {/* Line items */}
              <div className="space-y-1.5 mb-3">
                {pkg.lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 truncate mr-2">{item.service}</span>
                    <span className="text-gray-500 tabular-nums flex-shrink-0">
                      {item.qty}x ${item.unitPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Extras */}
              {pkg.extras.length > 0 && (
                <div className="border-t border-gray-100 pt-3 mb-3 space-y-1">
                  {pkg.extras.map((extra, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Check className="h-3 w-3 text-rani-gold-accessible flex-shrink-0" />
                      <span>{extra}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Monthly financing */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500">
                  or <span className="font-semibold text-[#0F1D2C]">${pkg.monthlyPayment12}/mo</span>{' '}
                  for 12 months
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  ${pkg.monthlyPayment24}/mo for 24 months
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <a
                    href="https://patient.withcherry.com/apply/rani-beauty-clinic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-medium text-rani-gold-accessible hover:underline"
                  >
                    Cherry
                  </a>
                  <span className="text-gray-300">|</span>
                  <a
                    href="https://app.patientfi.com/v2/rani-beauty-clinic/apply"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-medium text-rani-gold-accessible hover:underline"
                  >
                    PatientFi
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
