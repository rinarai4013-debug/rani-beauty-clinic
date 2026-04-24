'use client';

/**
 * PackageSelector — 3-tier package selection card grid
 *
 * Reads GeneratedPackage[] from MastermindPlan (session data).
 * No internal state — selection is dispatched up via onSelect.
 * Supports light (dashboard) and dark (presentation) variants.
 */

import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Star } from 'lucide-react';
import type { GeneratedPackage } from '@/lib/plan-builder/types';

interface PackageSelectorProps {
  packages: GeneratedPackage[];
  selectedTier: 'Start' | 'Transform' | 'Elite' | 'Essential' | null;
  onSelect: (_tier: 'Start' | 'Transform' | 'Elite' | 'Essential') => void;
  variant?: 'light' | 'dark';
}

const TIER_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Essential: Star,
  Start: Star,
  Transform: Sparkles,
  Elite: Crown,
};

const TIER_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  Start: { accent: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  Essential: { accent: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  Transform: { accent: '#C9A96E', bg: 'rgba(201,169,110,0.1)', border: 'rgba(201,169,110,0.3)' },
  Elite: { accent: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
};

export default function PackageSelector({
  packages,
  selectedTier,
  onSelect,
  variant = 'light',
}: PackageSelectorProps) {
  const isDark = variant === 'dark';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {packages.map((pkg, i) => {
        const isSelected = selectedTier === pkg.tier;
        const colors = TIER_COLORS[pkg.tier] || TIER_COLORS.Start;
        const Icon = TIER_ICONS[pkg.tier] ?? TIER_ICONS.Start;

        return (
          <motion.button
            key={pkg.tier}
            type="button"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 * i }}
            onClick={() => onSelect(pkg.tier)}
            className={`relative text-left rounded-2xl p-5 transition-all border-2 ${
              !isSelected
                ? isDark
                  ? 'border-white/10 hover:border-white/20'
                  : 'border-[#0F1D2C]/10 hover:border-[#0F1D2C]/20'
                : ''
            } ${isDark ? 'bg-white/5' : 'bg-white'}`}
            style={
              isSelected
                ? { borderColor: colors.accent, boxShadow: `0 4px 20px ${colors.accent}20` }
                : undefined
            }
          >
            {/* Highlighted Badge */}
            {pkg.highlighted && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-body font-medium text-white"
                style={{ backgroundColor: colors.accent }}
              >
                Most Popular
              </div>
            )}

            {/* Selection Indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.accent }}
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.bg }}
              >
                <Icon className="w-4 h-4" style={{ color: colors.accent }} />
              </div>
              <div>
                <h3
                  className={`font-[family-name:var(--font-heading)] text-lg ${
                    isDark ? 'text-white' : 'text-[#0F1D2C]'
                  }`}
                >
                  {pkg.name}
                </h3>
                <p className={`font-body text-xs ${isDark ? 'text-white/40' : 'text-[#0F1D2C]/40'}`}>
                  {pkg.subtitle}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl font-bold font-[family-name:var(--font-heading)]"
                  style={{ color: colors.accent }}
                >
                  ${pkg.price.toLocaleString()}
                </span>
                {pkg.discount > 0 && (
                  <span className={`text-sm line-through ${isDark ? 'text-white/20' : 'text-[#0F1D2C]/20'}`}>
                    ${pkg.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {pkg.discount > 0 && (
                <span
                  className="inline-block text-xs font-body font-medium px-2 py-0.5 rounded-full mt-1"
                  style={{ backgroundColor: colors.bg, color: colors.accent }}
                >
                  Save {pkg.discount}% (${pkg.savingsVsStandalone.toLocaleString()})
                </span>
              )}
            </div>

            {/* Result Intensity */}
            <p className={`font-body text-xs mb-3 ${isDark ? 'text-white/50' : 'text-[#0F1D2C]/50'}`}>
              <strong className={isDark ? 'text-white/70' : 'text-[#0F1D2C]/70'}>Results:</strong>{' '}
              {pkg.resultIntensity}
            </p>

            {/* Sessions */}
            <p className={`font-body text-xs mb-3 ${isDark ? 'text-white/50' : 'text-[#0F1D2C]/50'}`}>
              <strong className={isDark ? 'text-white/70' : 'text-[#0F1D2C]/70'}>{pkg.sessions} sessions</strong>{' '}
              — {pkg.bestFor}
            </p>

            {/* Line Items */}
            <div className="space-y-1 mb-3">
              {pkg.lineItems.map((item, j) => (
                <div
                  key={j}
                  className={`flex items-center justify-between text-xs font-body ${
                    isDark ? 'text-white/40' : 'text-[#0F1D2C]/40'
                  }`}
                >
                  <span>
                    {item.service} x{item.qty}
                  </span>
                  <span>${item.total.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Extras */}
            {pkg.extras.length > 0 && (
              <div className="space-y-1 pt-3 border-t border-white/5">
                {pkg.extras.map((extra, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Check className="w-3 h-3 flex-shrink-0" style={{ color: colors.accent }} />
                    <span className={`font-body text-xs ${isDark ? 'text-white/50' : 'text-[#0F1D2C]/50'}`}>
                      {extra}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Monthly Payment */}
            <div
              className={`mt-4 pt-3 border-t text-center ${
                isDark ? 'border-white/5' : 'border-[#0F1D2C]/5'
              }`}
            >
              <span className={`font-body text-xs ${isDark ? 'text-white/30' : 'text-[#0F1D2C]/30'}`}>
                From{' '}
              </span>
              <span className="font-body text-sm font-semibold" style={{ color: colors.accent }}>
                ${pkg.monthlyPayment24}/mo
              </span>
              <span className={`font-body text-xs ${isDark ? 'text-white/30' : 'text-[#0F1D2C]/30'}`}>
                {' '}with financing
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
