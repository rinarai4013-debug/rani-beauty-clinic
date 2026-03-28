'use client';

import { Crown, DollarSign, Users, Sparkles } from 'lucide-react';
import { DashboardErrorBoundary } from '@/components/dashboard/shared';
import PlanComparison from '@/components/dashboard/membership/PlanComparison';
import TierDistribution from '@/components/dashboard/membership/TierDistribution';
import { useDashboardData } from '@/hooks/useDashboardData';
import { PLANS, FOUNDING_MEMBER_RATES, getAllPlans, calculateValueProposition } from '@/lib/membership/plans';
import type { MembershipTier } from '@/lib/membership/plans';

interface PlanData {
  tierDistribution: Record<MembershipTier, number>;
  revenueByTier: Record<MembershipTier, number>;
  foundingMemberCounts: Record<MembershipTier, number>;
}

export default function MembershipPlansPage() {
  const { data, isLoading, error, mutate } = useDashboardData<PlanData>(
    '/membership?action=plans',
    { refreshInterval: 120000 },
  );

  const plans = getAllPlans();

  return (
    <DashboardErrorBoundary pageName="Membership Plans">
      <div className="space-y-6 sm:space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-rani-gold" />
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Membership Plans</h1>
          </div>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Three tiers of luxury aesthetic membership — plan configuration and distribution
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => {
            const value = calculateValueProposition(plan.tier);
            const tierColors: Record<MembershipTier, string> = {
              halo: 'border-t-blue-500',
              glow: 'border-t-rani-gold',
              elite: 'border-t-purple-600',
            };

            return (
              <div key={plan.tier} className={`bg-white rounded-xl border border-rani-border border-t-4 ${tierColors[plan.tier]} p-5 sm:p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-rani-navy">{plan.name}</h3>
                    <p className="text-xs font-body text-rani-muted">{plan.tagline}</p>
                  </div>
                  {plan.tier === 'glow' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-body font-bold bg-rani-gold text-white">
                      POPULAR
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-heading font-bold text-rani-navy">${plan.monthlyPrice}</span>
                  <span className="text-sm font-body text-rani-muted">/mo</span>
                  <p className="text-xs font-body text-emerald-600 mt-1">
                    Annual: ${plan.annualMonthlyEquivalent}/mo (save ${plan.annualSavings}/yr)
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-rani-muted">Monthly Credits</span>
                    <span className="font-semibold text-rani-navy">${plan.monthlyCredits}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-rani-muted">Discount</span>
                    <span className="font-semibold text-rani-navy">{plan.discountPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-rani-muted">Birthday Bonus</span>
                    <span className="font-semibold text-rani-navy">${plan.birthdayBonus}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-rani-muted">Guest Passes</span>
                    <span className="font-semibold text-rani-navy">{plan.guestPassesPerQuarter}/quarter</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-rani-muted">Value Multiplier</span>
                    <span className="font-semibold text-emerald-600">{value.valueMultiplier}x</span>
                  </div>
                </div>

                {data && (
                  <div className="pt-3 border-t border-rani-border space-y-1">
                    <div className="flex items-center justify-between text-xs font-body">
                      <span className="text-rani-muted">Current Members</span>
                      <span className="font-bold text-rani-navy">{data.tierDistribution[plan.tier]}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-body">
                      <span className="text-rani-muted">Tier MRR</span>
                      <span className="font-bold text-rani-gold">${(data.revenueByTier[plan.tier] || 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Founding Member Status */}
        <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-rani-gold" />
            <h3 className="text-sm font-heading font-semibold text-rani-navy">Founding Member Rates</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FOUNDING_MEMBER_RATES.map((rate) => (
              <div key={rate.tier} className="p-3 bg-rani-cream/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-body font-semibold text-rani-navy capitalize">{rate.tier}</span>
                  <span className="text-xs font-body text-emerald-600 font-bold">
                    ${rate.foundingMonthlyPrice}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-body text-rani-muted">
                  <span>Standard: ${rate.originalMonthlyPrice}/mo</span>
                  <span>Save ${rate.savings}/mo</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-rani-gold transition-all"
                    style={{ width: `${(data?.foundingMemberCounts[rate.tier] || 0) / rate.maxFoundingMembers * 100}%` }}
                  />
                </div>
                <p className="text-[10px] font-body text-rani-muted mt-1">
                  {data?.foundingMemberCounts[rate.tier] || 0} / {rate.maxFoundingMembers} spots claimed
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Distribution + Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {data && (
            <TierDistribution distribution={data.tierDistribution} />
          )}
          <div className="lg:col-span-2">
            <PlanComparison />
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
