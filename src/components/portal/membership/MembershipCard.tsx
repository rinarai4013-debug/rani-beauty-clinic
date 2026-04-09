'use client';

import { Calendar, CreditCard, Gift, Sparkles, Users } from 'lucide-react';
import type { MembershipTier } from '@/lib/membership/plans';

type MembershipCardProps = {
  clientName: string;
  tier: MembershipTier;
  monthlyCredits: number;
  creditsRemaining: number;
  creditsUsed: number;
  discountPercent: number;
  memberSince: string;
  nextBillingDate: string;
  monthlyRate: number;
  guestPassesRemaining: number;
  birthdayBonusAvailable: boolean;
  birthdayBonusAmount: number;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTier(tier: MembershipTier) {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export default function MembershipCard({
  clientName,
  tier,
  monthlyCredits,
  creditsRemaining,
  creditsUsed,
  discountPercent,
  memberSince,
  nextBillingDate,
  monthlyRate,
  guestPassesRemaining,
  birthdayBonusAvailable,
  birthdayBonusAmount,
}: MembershipCardProps) {
  const creditsPercent = monthlyCredits > 0 ? Math.min((creditsUsed / monthlyCredits) * 100, 100) : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-rani-gold/20 bg-gradient-to-br from-rani-navy to-[#17283d] p-6 text-white shadow-lg">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-rani-gold/80">
            {formatTier(tier)} Membership
          </div>
          <h2 className="mt-2 text-2xl font-heading">{clientName}</h2>
          <div className="mt-1 text-sm text-white/70">
            ${monthlyRate}/month
          </div>
        </div>
        <div className="rounded-xl bg-white/10 px-4 py-3 text-right">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/60">Credits Remaining</div>
          <div className="mt-1 text-2xl font-heading text-rani-gold">{creditsRemaining}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-white/70">
          <span>{creditsUsed} used of {monthlyCredits}</span>
          <span>{Math.round(creditsPercent)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-rani-gold"
            style={{ width: `${creditsPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white/8 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/60">
            <Sparkles className="h-4 w-4 text-rani-gold" />
            Discount
          </div>
          <div className="mt-2 text-lg font-semibold">{discountPercent}% off</div>
        </div>
        <div className="rounded-xl bg-white/8 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/60">
            <Users className="h-4 w-4 text-rani-gold" />
            Guest Passes
          </div>
          <div className="mt-2 text-lg font-semibold">{guestPassesRemaining} left</div>
        </div>
        <div className="rounded-xl bg-white/8 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/60">
            <Calendar className="h-4 w-4 text-rani-gold" />
            Next Billing
          </div>
          <div className="mt-2 text-sm font-semibold">{formatDate(nextBillingDate)}</div>
        </div>
        <div className="rounded-xl bg-white/8 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/60">
            <CreditCard className="h-4 w-4 text-rani-gold" />
            Member Since
          </div>
          <div className="mt-2 text-sm font-semibold">{formatDate(memberSince)}</div>
        </div>
      </div>

      {birthdayBonusAvailable && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-rani-gold/30 bg-rani-gold/10 px-4 py-3 text-sm text-rani-cream">
          <Gift className="h-4 w-4 text-rani-gold" />
          Birthday bonus available: ${birthdayBonusAmount}
        </div>
      )}
    </div>
  );
}
