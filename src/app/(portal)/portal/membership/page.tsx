'use client';

import { useEffect, useState } from 'react';
import { Crown, CreditCard, Calendar, Gift, Users, ArrowRight } from 'lucide-react';
import MembershipCard from '@/components/portal/membership/MembershipCard';
import type { MembershipTier } from '@/lib/membership/plans';

interface PortalMembershipData {
  membership: {
    tier: MembershipTier;
    status: string;
    monthlyRate: number;
    joinDate: string;
    nextBillingDate: string;
    billingCycle: string;
  };
  credits: {
    monthlyAllocation: number;
    remaining: number;
    used: number;
    rolledOver: number;
    bonusCredits: number;
  };
  benefits: {
    discountPercent: number;
    priorityBooking: boolean;
    guestPassesRemaining: number;
    guestPassesTotal: number;
    exclusiveEvents: boolean;
    birthdayBonusAvailable: boolean;
    birthdayBonusAmount: number;
    anniversaryBonusAvailable: boolean;
    anniversaryBonusAmount: number;
    complimentaryAddOns: string[];
  };
  recentUsage: {
    date: string;
    service: string;
    creditUsed: number;
    outOfPocket: number;
  }[];
  referralStats: {
    totalReferrals: number;
    totalEarned: number;
    referralCode: string;
  };
  patientName: string;
}

export default function PortalMembershipPage() {
  const [data, setData] = useState<PortalMembershipData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/patient/membership');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('Failed to load membership:', e);
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
        <div className="h-64 bg-gray-100 rounded-2xl" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Crown className="w-5 h-5 text-rani-gold-accessible" />
        <h1 className="text-xl font-heading font-bold text-rani-navy">My Membership</h1>
      </div>

      {/* Membership card */}
      <MembershipCard
        clientName={data.patientName}
        tier={data.membership.tier}
        monthlyCredits={data.credits.monthlyAllocation}
        creditsRemaining={data.credits.remaining}
        creditsUsed={data.credits.used}
        discountPercent={data.benefits.discountPercent}
        memberSince={data.membership.joinDate}
        nextBillingDate={data.membership.nextBillingDate}
        monthlyRate={data.membership.monthlyRate}
        guestPassesRemaining={data.benefits.guestPassesRemaining}
        birthdayBonusAvailable={data.benefits.birthdayBonusAvailable}
        birthdayBonusAmount={data.benefits.birthdayBonusAmount}
      />

      {/* Benefits */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Your Benefits</h3>
        <div className="grid grid-cols-2 gap-3">
          <BenefitCard icon={CreditCard} label="Member Discount" value={`${data.benefits.discountPercent}% off`} />
          <BenefitCard icon={Users} label="Guest Passes" value={`${data.benefits.guestPassesRemaining} of ${data.benefits.guestPassesTotal} remaining`} />
          {data.benefits.exclusiveEvents && (
            <BenefitCard icon={Calendar} label="Exclusive Events" value="VIP Access" />
          )}
          {data.benefits.complimentaryAddOns.length > 0 && (
            <BenefitCard icon={Gift} label="Free Add-Ons" value={data.benefits.complimentaryAddOns.join(', ')} />
          )}
        </div>
      </div>

      {/* Recent usage */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Recent Credit Usage</h3>
        {data.recentUsage.length > 0 ? (
          <div className="space-y-3">
            {data.recentUsage.map((usage, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-body font-medium text-gray-900">{usage.service}</p>
                  <p className="text-xs font-body text-gray-500">
                    {new Date(usage.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-body font-semibold text-rani-gold-accessible">-${usage.creditUsed} credit</p>
                  {usage.outOfPocket > 0 && (
                    <p className="text-xs font-body text-gray-500">${usage.outOfPocket} out of pocket</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-body text-gray-500 text-center py-4">No credit usage yet this month</p>
        )}
      </div>

      {/* Referrals */}
      <div className="bg-gradient-to-r from-rani-navy to-rani-navy/90 rounded-2xl p-5 text-white">
        <h3 className="text-sm font-heading font-semibold mb-2">Share the Rani Experience</h3>
        <p className="text-xs font-body text-white/70 mb-3">
          Refer a friend and earn credits when they join.
        </p>
        <div className="flex items-center justify-between bg-white/10 rounded-lg p-3 mb-3">
          <span className="text-sm font-body font-mono">{data.referralStats.referralCode}</span>
          <button className="text-xs font-body font-medium text-rani-gold">Copy</button>
        </div>
        <p className="text-xs font-body text-white/70">
          {data.referralStats.totalReferrals} referral(s) · ${data.referralStats.totalEarned} earned
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <a href="/portal/membership/upgrade" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group">
          <ArrowRight className="w-4 h-4 text-rani-gold-accessible mb-2 group-hover:translate-x-1 transition-transform" />
          <span className="text-sm font-body font-semibold text-rani-navy">Upgrade Plan</span>
        </a>
        <a href="/portal/membership/billing" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group">
          <CreditCard className="w-4 h-4 text-rani-gold-accessible mb-2" />
          <span className="text-sm font-body font-semibold text-rani-navy">Manage Billing</span>
        </a>
      </div>
    </div>
  );
}

function BenefitCard({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: string }) {
  return (
    <div className="p-3 bg-rani-cream/30 rounded-lg">
      <Icon className="w-4 h-4 text-rani-gold-accessible mb-1" />
      <p className="text-[10px] font-body text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xs font-body font-semibold text-rani-navy">{value}</p>
    </div>
  );
}
