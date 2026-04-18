'use client';

import { useState, useEffect } from 'react';
import { Users, Gift, DollarSign, Heart, Share2 } from 'lucide-react';
import ReferralShare from '@/components/portal/ReferralShare';
import type { ReferralShareContent } from '@/lib/referral/engine';

interface ReferralData {
  shareContent: ReferralShareContent;
  totalReferred: number;
  totalEarned: number;
}

const PROGRAM_STEPS = [
  {
    icon: Share2,
    title: 'Share Your Link',
    description: 'Send your unique referral link to a friend via text, email, or social media.',
  },
  {
    icon: Users,
    title: 'Friend Books a Visit',
    description: 'Your friend books and completes their first treatment at Rani Beauty Clinic.',
  },
  {
    icon: Gift,
    title: 'You Both Get Rewarded',
    description: 'You earn 100 loyalty points and your friend receives a special welcome offer.',
  },
];

export default function ReferralsPage() {
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const res = await fetch('/api/patient/referrals');
        if (!res.ok) throw new Error('Failed to load referral data');
        const data = await res.json();
        setReferral(data.referral);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-rani-cream p-6 md:p-10">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="h-8 w-48 animate-pulse rounded bg-rani-navy/10" />
          <div className="h-40 animate-pulse rounded-2xl bg-rani-navy/10" />
          <div className="h-64 animate-pulse rounded-2xl bg-rani-navy/10" />
        </div>
      </div>
    );
  }

  if (error || !referral) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rani-cream p-6">
        <div className="text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-rani-navy/30" />
          <h2 className="text-xl font-semibold text-rani-navy">
            {error ?? 'Referral program unavailable'}
          </h2>
          <p className="mt-2 text-sm text-rani-navy/60">
            Please contact us to join the referral program.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rani-cream p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-10">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-rani-navy">
            Refer a Friend
          </h1>
          <p className="mt-1 text-rani-navy/60">
            Share the beauty. Earn rewards together.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-rani-navy/10 bg-white p-5 shadow-sm">
            <Users className="mb-2 h-5 w-5 text-rani-gold-accessible" />
            <p className="text-xs text-rani-navy/50">Friends Referred</p>
            <p className="text-2xl font-bold text-rani-navy">
              {referral.totalReferred}
            </p>
          </div>
          <div className="rounded-xl border border-rani-navy/10 bg-white p-5 shadow-sm">
            <DollarSign className="mb-2 h-5 w-5 text-rani-gold-accessible" />
            <p className="text-xs text-rani-navy/50">Total Earned</p>
            <p className="text-2xl font-bold text-rani-navy">
              {referral.totalEarned.toLocaleString()} pts
            </p>
          </div>
        </div>

        {/* Share Component */}
        <ReferralShare
          shareContent={referral.shareContent}
          totalReferred={referral.totalReferred}
          totalEarned={referral.totalEarned}
        />

        {/* How It Works */}
        <section>
          <h2 className="mb-6 font-serif text-2xl font-semibold text-rani-navy">
            How It Works
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {PROGRAM_STEPS.map((step, idx) => (
              <div key={step.title} className="relative rounded-xl border border-rani-navy/10 bg-white p-6 shadow-sm">
                <span className="absolute -top-3 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-rani-navy text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <step.icon className="mb-3 h-6 w-6 text-rani-gold" />
                <h3 className="font-semibold text-rani-navy">{step.title}</h3>
                <p className="mt-1 text-sm text-rani-navy/70">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Program Details */}
        <section className="rounded-2xl border border-rani-gold/20 bg-rani-gold/5 p-6">
          <div className="flex items-start gap-3">
            <Heart className="mt-0.5 h-5 w-5 flex-shrink-0 text-rani-gold" />
            <div>
              <h3 className="font-semibold text-rani-navy">Program Details</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-rani-navy/70">
                <li>Earn <span className="font-medium text-rani-navy">100 loyalty points</span> for every successful referral.</li>
                <li>Your friend receives a <span className="font-medium text-rani-navy">welcome offer</span> on their first visit.</li>
                <li>There is no limit to the number of friends you can refer.</li>
                <li>Points are credited once your friend completes their first treatment.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
