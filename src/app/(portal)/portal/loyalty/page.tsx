'use client';

import { useState, useEffect } from 'react';
import { Gift, Star, TrendingUp, Users, Award, Sparkles } from 'lucide-react';
import LoyaltyCard from '@/components/portal/LoyaltyCard';
import type { LoyaltyTier } from '@/lib/loyalty/engine';

interface LoyaltyAccount {
  tier: LoyaltyTier;
  pointsBalance: number;
  tierProgress: number;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  totalSpend: number;
  totalVisits: number;
  name: string;
}

const TIER_BENEFITS: Record<LoyaltyTier, { color: string; benefits: string[] }> = {
  Silver: {
    color: 'bg-gray-100 border-gray-300',
    benefits: [
      '5% off all treatments',
      'Birthday bonus points (2x)',
      'Early access to promotions',
      'Complimentary skincare consultations',
    ],
  },
  Gold: {
    color: 'bg-amber-50 border-amber-300',
    benefits: [
      '10% off all treatments',
      'Priority booking access',
      'Birthday bonus points (3x)',
      'Complimentary add-on per visit',
      'Exclusive Gold member events',
    ],
  },
  Platinum: {
    color: 'bg-purple-50 border-purple-300',
    benefits: [
      '15% off all treatments',
      'VIP priority booking',
      'Birthday bonus points (5x)',
      'Complimentary upgrade per visit',
      'Exclusive Platinum member events',
      'Personal beauty concierge',
      'Complimentary annual facial',
    ],
  },
};

const EARNING_GUIDE = [
  { icon: TrendingUp, label: 'Treatments', detail: '$1 spent = 1 point', highlight: false },
  { icon: Star, label: 'Leave a Review', detail: '50 points per review', highlight: false },
  { icon: Users, label: 'Refer a Friend', detail: '100 points per referral', highlight: true },
];

export default function LoyaltyPage() {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLoyalty() {
      try {
        const res = await fetch('/api/patient/loyalty');
        if (!res.ok) throw new Error('Failed to load loyalty data');
        const data = await res.json();
        setAccount(data.account);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchLoyalty();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-rani-cream p-6 md:p-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="h-8 w-48 animate-pulse rounded bg-rani-navy/10" />
          <div className="h-48 animate-pulse rounded-2xl bg-rani-navy/10" />
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-rani-navy/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rani-cream p-6">
        <div className="text-center">
          <Gift className="mx-auto mb-4 h-12 w-12 text-rani-navy/30" />
          <h2 className="text-xl font-semibold text-rani-navy">
            {error ?? 'No loyalty account found'}
          </h2>
          <p className="mt-2 text-sm text-rani-navy/60">
            Please contact us to set up your rewards account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rani-cream p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-rani-navy">
            Loyalty Rewards
          </h1>
          <p className="mt-1 text-rani-navy/60">
            Your beauty journey, rewarded at every step.
          </p>
        </div>

        {/* Loyalty Card */}
        <LoyaltyCard
          compact={false}
          patientName={account.name}
          tier={account.tier}
          pointsBalance={account.pointsBalance}
          tierProgress={account.tierProgress}
          nextTier={account.nextTier}
          pointsToNextTier={account.pointsToNextTier}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Current Tier', value: account.tier, icon: Award },
            { label: 'Points Balance', value: account.pointsBalance.toLocaleString(), icon: Sparkles },
            { label: 'Total Visits', value: account.totalVisits.toLocaleString(), icon: Star },
            { label: 'Lifetime Spend', value: `$${account.totalSpend.toLocaleString()}`, icon: TrendingUp },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-rani-navy/10 bg-white p-4 shadow-sm"
            >
              <stat.icon className="mb-2 h-5 w-5 text-rani-gold-accessible" />
              <p className="text-xs text-rani-navy/50">{stat.label}</p>
              <p className="text-lg font-semibold text-rani-navy">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tier Benefits */}
        <section>
          <h2 className="mb-4 font-serif text-2xl font-semibold text-rani-navy">
            Tier Benefits
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {(Object.keys(TIER_BENEFITS) as LoyaltyTier[]).map((tier) => {
              const isCurrentTier = tier === account.tier;
              const config = TIER_BENEFITS[tier];
              return (
                <div
                  key={tier}
                  className={`relative rounded-2xl border-2 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
                    isCurrentTier
                      ? 'border-rani-gold ring-2 ring-rani-gold/20'
                      : 'border-rani-navy/10'
                  }`}
                >
                  {isCurrentTier && (
                    <span className="absolute -top-3 left-4 rounded-full bg-rani-gold px-3 py-0.5 text-xs font-semibold text-white">
                      Your Tier
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-rani-navy">{tier}</h3>
                  <ul className="mt-4 space-y-2">
                    {config.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-sm text-rani-navy/80">
                        <Star className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-rani-gold-accessible" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* How to Earn Points */}
        <section>
          <h2 className="mb-4 font-serif text-2xl font-semibold text-rani-navy">
            How to Earn Points
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {EARNING_GUIDE.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border p-5 shadow-sm ${
                  item.highlight
                    ? 'border-rani-gold/30 bg-rani-gold/5'
                    : 'border-rani-navy/10 bg-white'
                }`}
              >
                <item.icon className="mb-3 h-6 w-6 text-rani-gold-accessible" />
                <h3 className="font-semibold text-rani-navy">{item.label}</h3>
                <p className="mt-1 text-sm text-rani-navy/70">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
