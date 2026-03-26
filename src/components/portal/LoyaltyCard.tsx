'use client';

import { Crown, Star, Gem, ChevronRight } from 'lucide-react';
import type { LoyaltyTier } from '@/lib/loyalty/engine';

interface LoyaltyCardProps {
  patientName: string;
  tier: LoyaltyTier;
  pointsBalance: number;
  tierProgress: number;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  compact?: boolean;
}

const TIER_CONFIG: Record<
  LoyaltyTier,
  { icon: typeof Crown; gradient: string; accent: string; label: string }
> = {
  Silver: {
    icon: Star,
    gradient: 'from-gray-500 via-gray-400 to-gray-300',
    accent: 'text-gray-300',
    label: 'Silver Member',
  },
  Gold: {
    icon: Crown,
    gradient: 'from-amber-600 via-yellow-500 to-amber-400',
    accent: 'text-yellow-300',
    label: 'Gold Member',
  },
  Platinum: {
    icon: Gem,
    gradient: 'from-slate-700 via-slate-500 to-slate-400',
    accent: 'text-slate-200',
    label: 'Platinum Member',
  },
};

export default function LoyaltyCard({
  patientName,
  tier,
  pointsBalance,
  tierProgress,
  nextTier,
  pointsToNextTier,
  compact = false,
}: LoyaltyCardProps) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-rani-navy to-rani-navy-light p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
              <Icon className={`h-5 w-5 ${config.accent}`} />
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wider">{config.label}</p>
              <p className="text-lg font-heading font-bold text-rani-gold">
                {pointsBalance.toLocaleString()} pts
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Card background */}
      <div className={`bg-gradient-to-br ${config.gradient} p-6 text-white`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />

        {/* Header */}
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[3px] text-white/60 font-body">
              Rani Loyalty
            </p>
            <p className="mt-1 font-heading text-2xl font-bold">{patientName}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <Icon className="h-6 w-6" />
          </div>
        </div>

        {/* Points balance */}
        <div className="relative mt-6">
          <p className="text-xs text-white/60 uppercase tracking-wider">Points Balance</p>
          <p className="mt-1 text-4xl font-heading font-bold tracking-tight">
            {pointsBalance.toLocaleString()}
          </p>
        </div>

        {/* Tier badge */}
        <div className="relative mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </span>
        </div>

        {/* Progress toward next tier */}
        {nextTier && (
          <div className="relative mt-5">
            <div className="flex items-center justify-between text-xs text-white/60 mb-2">
              <span>{tier}</span>
              <span>{nextTier}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/50">
              {pointsToNextTier.toLocaleString()} points to {nextTier}
            </p>
          </div>
        )}

        {!nextTier && (
          <p className="relative mt-4 text-xs text-white/60">
            You&apos;ve reached our highest tier. Enjoy exclusive benefits.
          </p>
        )}
      </div>
    </div>
  );
}
