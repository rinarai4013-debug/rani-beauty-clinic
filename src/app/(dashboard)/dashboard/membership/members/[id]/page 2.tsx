'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft, User, Crown, CreditCard, Calendar, Gift, Shield, TrendingUp } from 'lucide-react';
import { DashboardErrorBoundary, InlineError, ChartSkeleton } from '@/components/dashboard/shared';
import EngagementScore from '@/components/dashboard/membership/EngagementScore';
import RetentionActions from '@/components/dashboard/membership/RetentionActions';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { MembershipTier, MembershipStatus } from '@/lib/membership/plans';
import type { MemberRetentionProfile, RetentionAction } from '@/lib/membership/retention';
import type { MemberBenefits, CreditBalance } from '@/lib/membership/benefits';

interface MemberDetailData {
  member: {
    memberId: string;
    clientId: string;
    clientName: string;
    email: string;
    phone?: string;
    tier: MembershipTier;
    status: MembershipStatus;
    joinDate: string;
    monthlyRate: number;
    billingCycle: string;
    nextBillingDate: string;
    provider?: string;
  };
  benefits: MemberBenefits;
  retention: MemberRetentionProfile;
  actions: RetentionAction[];
  billingHistory: {
    id: string;
    amount: number;
    status: string;
    date: string;
  }[];
  visitHistory: {
    date: string;
    service: string;
    amount: number;
    provider: string;
  }[];
}

const TIER_STYLES: Record<MembershipTier, { badge: string; label: string }> = {
  halo: { badge: 'bg-blue-100 text-blue-700', label: 'Halo' },
  glow: { badge: 'bg-amber-100 text-amber-700', label: 'Glow' },
  elite: { badge: 'bg-purple-100 text-purple-700', label: 'Elite' },
};

export default function MemberDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error, mutate } = useDashboardData<MemberDetailData>(
    `/membership/members/${id}`,
    { refreshInterval: 60000 },
  );

  if (error) {
    return (
      <DashboardErrorBoundary pageName="Member Detail">
        <InlineError message="Failed to load member" onRetry={() => mutate()} />
      </DashboardErrorBoundary>
    );
  }

  if (isLoading || !data) {
    return (
      <DashboardErrorBoundary pageName="Member Detail">
        <div className="space-y-6"><ChartSkeleton /><ChartSkeleton /></div>
      </DashboardErrorBoundary>
    );
  }

  const { member, benefits, retention, actions } = data;
  const tierStyle = TIER_STYLES[member.tier];

  return (
    <DashboardErrorBoundary pageName="Member Detail">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          <a href="/dashboard/membership/members" className="p-2 rounded-lg hover:bg-rani-cream transition-colors mt-1">
            <ArrowLeft className="w-5 h-5 text-rani-navy" />
          </a>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rani-cream flex items-center justify-center">
                <User className="w-6 h-6 text-rani-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-heading font-bold text-rani-navy">{member.clientName}</h1>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold ${tierStyle.badge}`}>
                    {tierStyle.label}
                  </span>
                </div>
                <p className="text-xs font-body text-rani-muted">{member.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-rani-gold" />
              <span className="text-[10px] font-body text-rani-muted">Monthly Rate</span>
            </div>
            <p className="text-lg font-heading font-bold text-rani-navy">${member.monthlyRate}</p>
          </div>
          <div className="bg-white rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-body text-rani-muted">Credits Remaining</span>
            </div>
            <p className="text-lg font-heading font-bold text-rani-navy">${benefits.credits.remaining}</p>
          </div>
          <div className="bg-white rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[10px] font-body text-rani-muted">Churn Risk</span>
            </div>
            <p className={`text-lg font-heading font-bold capitalize ${
              retention.churnRisk === 'critical' ? 'text-red-600' :
              retention.churnRisk === 'high' ? 'text-orange-600' :
              retention.churnRisk === 'moderate' ? 'text-amber-600' :
              'text-emerald-600'
            }`}>{retention.churnRisk}</p>
          </div>
          <div className="bg-white rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-[10px] font-body text-rani-muted">Member Since</span>
            </div>
            <p className="text-sm font-heading font-bold text-rani-navy">
              {new Date(member.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Credits */}
            <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
              <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Credit Usage</h3>
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs font-body text-rani-muted mb-1">
                  <span>${benefits.credits.usedThisMonth} used</span>
                  <span>${benefits.credits.totalAvailable} available</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-rani-gold transition-all"
                    style={{ width: `${benefits.credits.totalAvailable > 0 ? (benefits.credits.usedThisMonth / benefits.credits.totalAvailable) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-rani-cream/50 rounded-lg">
                  <p className="text-xs font-body text-rani-muted">Allocated</p>
                  <p className="text-sm font-body font-bold text-rani-navy">${benefits.credits.monthlyAllocation}</p>
                </div>
                <div className="text-center p-2 bg-rani-cream/50 rounded-lg">
                  <p className="text-xs font-body text-rani-muted">Rolled Over</p>
                  <p className="text-sm font-body font-bold text-rani-navy">${benefits.credits.rolledOver}</p>
                </div>
                <div className="text-center p-2 bg-rani-cream/50 rounded-lg">
                  <p className="text-xs font-body text-rani-muted">Bonus</p>
                  <p className="text-sm font-body font-bold text-rani-navy">${benefits.credits.bonusCredits}</p>
                </div>
              </div>
            </div>

            {/* Benefits status */}
            <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
              <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Benefits Status</h3>
              <div className="grid grid-cols-2 gap-3">
                <BenefitStatus label="Discount" value={`${benefits.discountPercent}%`} active />
                <BenefitStatus label="Priority Booking" value={benefits.priorityBooking ? `${benefits.priorityBookingHours}hr advance` : 'N/A'} active={benefits.priorityBooking} />
                <BenefitStatus label="Guest Passes" value={`${benefits.guestPassesPerQuarter - benefits.guestPassesUsedThisQuarter} remaining`} active={benefits.guestPassesPerQuarter > 0} />
                <BenefitStatus label="Exclusive Events" value={benefits.exclusiveEventAccess ? 'Included' : 'N/A'} active={benefits.exclusiveEventAccess} />
                <BenefitStatus label="Birthday Bonus" value={benefits.birthdayBonusClaimed ? 'Claimed' : `$${benefits.birthdayBonusAmount} available`} active={!benefits.birthdayBonusClaimed && benefits.birthdayBonusAmount > 0} />
                <BenefitStatus label="Referrals" value={`${benefits.totalReferrals} total ($${benefits.totalReferralBonusEarned})`} active={benefits.totalReferrals > 0} />
              </div>
            </div>

            {/* Visit history */}
            <div className="bg-white rounded-xl border border-rani-border overflow-hidden">
              <div className="p-4 border-b border-rani-border">
                <h3 className="text-sm font-heading font-semibold text-rani-navy">Recent Visits</h3>
              </div>
              <div className="divide-y divide-rani-border">
                {data.visitHistory.slice(0, 10).map((visit, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-body font-medium text-rani-navy">{visit.service}</p>
                      <p className="text-xs font-body text-rani-muted">
                        {new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {visit.provider}
                      </p>
                    </div>
                    <span className="text-sm font-body font-semibold text-rani-navy">${visit.amount}</span>
                  </div>
                ))}
                {data.visitHistory.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-sm font-body text-rani-muted">No visits recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <EngagementScore
              score={retention.engagementScore}
              breakdown={{
                creditUsage: Math.round(retention.creditUsageRate),
                visitFrequency: Math.round(retention.visitFrequency * 50),
                recency: retention.daysSinceLastVisit < 30 ? 80 : 30,
              }}
              trend={retention.engagementTrend}
              size="sm"
            />

            {/* Risk factors */}
            <div className="bg-white rounded-xl border border-rani-border p-4">
              <h3 className="text-sm font-heading font-semibold text-rani-navy mb-3">Risk Factors</h3>
              <div className="space-y-2">
                {retention.riskFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-xs font-body text-rani-text">{factor.factor}</span>
                    <span className={`text-xs font-body font-bold ${
                      factor.severity === 'high' ? 'text-red-600' :
                      factor.severity === 'medium' ? 'text-amber-600' :
                      'text-emerald-600'
                    }`}>
                      {factor.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <RetentionActions actions={actions} />
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}

function BenefitStatus({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${active ? 'bg-emerald-50' : 'bg-gray-50'}`}>
      <p className="text-[10px] font-body text-rani-muted uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-body font-semibold ${active ? 'text-emerald-700' : 'text-gray-400'}`}>{value}</p>
    </div>
  );
}
