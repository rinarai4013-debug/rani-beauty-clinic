'use client';

import { useEffect, useState } from 'react';
import { Gift, ArrowUp, ArrowDown, Star, Crown, Gem } from 'lucide-react';
import LoyaltyCard from '@/components/portal/LoyaltyCard';
import type { LoyaltyTier } from '@/lib/loyalty/engine';

interface LoyaltyData {
  account: {
    tier: LoyaltyTier;
    pointsBalance: number;
    totalEarned: number;
    totalRedeemed: number;
    tierProgress: number;
    nextTier: LoyaltyTier | null;
    pointsToNextTier: number;
  };
  history: {
    id: string;
    type: string;
    points: number;
    description: string;
    date: string;
  }[];
  rewards: {
    id: string;
    name: string;
    description: string;
    pointsCost: number;
    available: boolean;
  }[];
  benefits: {
    discountPercent: number;
    priorityBooking: boolean;
    freeAddons: string[];
    description: string;
  };
  patientName: string;
}

const TIER_ICONS: Record<LoyaltyTier, typeof Star> = {
  Silver: Star,
  Gold: Crown,
  Platinum: Gem,
};

export default function LoyaltyPage() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/patient/loyalty');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('Failed to load loyalty:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!data?.account) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-rani-navy">Loyalty Rewards</h1>
        <p className="text-sm text-rani-muted mt-1">
          Earn points on every visit. Redeem for exclusive rewards.
        </p>
      </div>

      {/* Loyalty card */}
      <LoyaltyCard
        patientName={data.patientName}
        tier={data.account.tier}
        pointsBalance={data.account.pointsBalance}
        tierProgress={data.account.tierProgress}
        nextTier={data.account.nextTier}
        pointsToNextTier={data.account.pointsToNextTier}
      />

      {/* Tier benefits */}
      {data.benefits && (
        <div className="rounded-2xl border border-rani-border bg-white p-5">
          <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
            Your {data.account.tier} Benefits
          </h2>
          <p className="text-sm text-rani-text leading-relaxed">{data.benefits.description}</p>
          {data.benefits.freeAddons.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {data.benefits.freeAddons.map((addon, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-rani-navy">
                  <Gift className="h-3.5 w-3.5 text-rani-gold" />
                  {addon}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Available rewards */}
      {data.rewards && data.rewards.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
            Available Rewards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.rewards.map((reward) => (
              <div
                key={reward.id}
                className={`rounded-2xl border p-4 transition-all ${
                  reward.available
                    ? 'border-rani-gold/30 bg-white hover:shadow-sm'
                    : 'border-rani-border bg-white/50 opacity-60'
                }`}
              >
                <h3 className="font-heading text-sm text-rani-navy">{reward.name}</h3>
                <p className="text-xs text-rani-muted mt-1">{reward.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-rani-navy">
                    {reward.pointsCost.toLocaleString()} pts
                  </span>
                  {reward.available ? (
                    <span className="text-xs text-emerald-600 font-medium">Redeemable</span>
                  ) : (
                    <span className="text-xs text-rani-muted">
                      Need {(reward.pointsCost - data.account.pointsBalance).toLocaleString()} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Points history */}
      {data.history && data.history.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
            Points History
          </h2>
          <div className="rounded-2xl border border-rani-border bg-white divide-y divide-rani-border overflow-hidden">
            {data.history.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      tx.points > 0 ? 'bg-emerald-50' : 'bg-red-50'
                    }`}
                  >
                    {tx.points > 0 ? (
                      <ArrowUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-rani-text">{tx.description}</p>
                    <p className="text-xs text-rani-muted">
                      {new Date(tx.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    tx.points > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {tx.points > 0 ? '+' : ''}
                  {tx.points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How to earn */}
      <div className="rounded-xl bg-rani-cream/50 border border-rani-border p-5">
        <h3 className="font-heading text-sm font-semibold text-rani-navy mb-3">
          Ways to Earn Points
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Every $1 spent', pts: '1 pt' },
            { label: 'Leave a review', pts: '100 pts' },
            { label: 'Birthday bonus', pts: '200 pts' },
            { label: 'Visit streak (every 5th)', pts: '300 pts' },
            { label: 'Refer a friend', pts: '500 pts' },
            { label: 'Membership services', pts: '2x pts' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-rani-text">{item.label}</span>
              <span className="text-rani-gold font-medium">{item.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
