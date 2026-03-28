'use client';

import { useEffect, useState } from 'react';
import ReferralShare from '@/components/portal/ReferralShare';
import { getReferralStatusLabel, getReferralStatusColor, type ReferralShareContent, type ReferralStatus } from '@/lib/referral/engine';

interface ReferralData {
  shareContent: ReferralShareContent;
  stats: {
    totalReferrals: number;
    completed: number;
    rewarded: number;
    totalRewardsEarned: number;
  };
  referrals: {
    id: string;
    refereeName?: string;
    refereeEmail?: string;
    status: ReferralStatus;
    createdAt: string;
    completedAt?: string;
  }[];
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/patient/referrals');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('Failed to load referrals:', e);
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-rani-navy">Refer a Friend</h1>
        <p className="text-sm text-rani-muted mt-1">
          Share the love and earn rewards for every friend who visits.
        </p>
      </div>

      {data?.shareContent && (
        <ReferralShare
          shareContent={data.shareContent}
          totalReferred={data.stats?.completed || 0}
          totalEarned={data.stats?.totalRewardsEarned || 0}
        />
      )}

      {/* Referral history */}
      {data?.referrals && data.referrals.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
            Referral History
          </h2>
          <div className="rounded-2xl border border-rani-border bg-white divide-y divide-rani-border overflow-hidden">
            {data.referrals.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm text-rani-text font-medium">
                    {ref.refereeName || ref.refereeEmail || 'Invitation sent'}
                  </p>
                  <p className="text-xs text-rani-muted mt-0.5">
                    {new Date(ref.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getReferralStatusColor(ref.status)}`}
                >
                  {getReferralStatusLabel(ref.status)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
