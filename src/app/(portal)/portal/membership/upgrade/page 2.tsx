'use client';

import { useEffect, useState } from 'react';
import { Crown, Check, ArrowRight, Sparkles } from 'lucide-react';
import { PLANS, PLAN_COMPARISON, getAllPlans, calculateValueProposition } from '@/lib/membership/plans';
import type { MembershipTier } from '@/lib/membership/plans';

export default function UpgradePage() {
  const [currentTier, setCurrentTier] = useState<MembershipTier>('halo');
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/patient/membership');
        const json = await res.json();
        setCurrentTier(json.membership?.tier || 'halo');
      } catch (e) {
        console.error('Failed to load:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const plans = getAllPlans();
  const tierOrder: MembershipTier[] = ['halo', 'glow', 'elite'];
  const currentIdx = tierOrder.indexOf(currentTier);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rani-gold" />
          <h1 className="text-xl font-heading font-bold text-rani-navy">Upgrade Your Membership</h1>
        </div>
        <p className="text-sm font-body text-gray-500 mt-1">
          Elevate your aesthetic journey with more treatments, deeper discounts, and exclusive access
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const planIdx = tierOrder.indexOf(plan.tier);
          const isCurrent = plan.tier === currentTier;
          const isUpgrade = planIdx > currentIdx;
          const value = calculateValueProposition(plan.tier);

          const borderColors: Record<MembershipTier, string> = {
            halo: 'border-blue-500',
            glow: 'border-rani-gold',
            elite: 'border-purple-600',
          };

          return (
            <div
              key={plan.tier}
              className={`relative rounded-2xl border-2 p-5 transition-all ${
                selectedTier === plan.tier
                  ? `${borderColors[plan.tier]} shadow-lg`
                  : isCurrent
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-4 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-[10px] font-body font-bold">
                  CURRENT
                </span>
              )}
              {plan.tier === 'glow' && !isCurrent && (
                <span className="absolute -top-3 left-4 px-2 py-0.5 bg-rani-gold text-white rounded-full text-[10px] font-body font-bold">
                  MOST POPULAR
                </span>
              )}

              <h3 className="text-lg font-heading font-bold text-rani-navy">{plan.name}</h3>
              <p className="text-xs font-body text-gray-500 mb-3">{plan.tagline}</p>

              <div className="mb-4">
                <span className="text-3xl font-heading font-bold text-rani-navy">${plan.monthlyPrice}</span>
                <span className="text-sm font-body text-gray-500">/mo</span>
              </div>

              <div className="space-y-2 mb-4">
                {plan.benefits.filter(b => b.included).map((benefit) => (
                  <div key={benefit.id} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-body text-gray-700">{benefit.label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-100 mb-4">
                <p className="text-xs font-body text-gray-500">
                  Value: <span className="font-semibold text-emerald-600">{value.valueMultiplier}x</span> your investment
                </p>
              </div>

              {isUpgrade ? (
                <button
                  onClick={() => setSelectedTier(plan.tier)}
                  className={`w-full py-2.5 rounded-lg text-sm font-body font-semibold transition-colors ${
                    selectedTier === plan.tier
                      ? 'bg-rani-gold text-white'
                      : 'bg-rani-navy text-white hover:bg-rani-navy/90'
                  }`}
                >
                  {selectedTier === plan.tier ? 'Selected' : `Upgrade to ${plan.name}`}
                </button>
              ) : isCurrent ? (
                <div className="w-full py-2.5 rounded-lg text-sm font-body font-semibold text-center bg-gray-100 text-gray-400">
                  Current Plan
                </div>
              ) : (
                <div className="w-full py-2.5 rounded-lg text-sm font-body font-semibold text-center bg-gray-50 text-gray-300">
                  —
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedTier && (
        <div className="bg-rani-cream rounded-2xl p-5">
          <h3 className="text-sm font-heading font-semibold text-rani-navy mb-2">
            Upgrade to {PLANS[selectedTier].name}
          </h3>
          <p className="text-xs font-body text-gray-600 mb-4">
            Your upgrade takes effect immediately. You will receive a prorated credit for the remaining days on your current plan.
            New benefits start today.
          </p>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-rani-gold text-white rounded-lg text-sm font-body font-semibold hover:bg-rani-gold/90 transition-colors">
            Confirm Upgrade
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
