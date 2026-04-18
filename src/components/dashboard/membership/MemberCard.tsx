'use client';

import { User, Crown, AlertTriangle, CreditCard, Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import type { MembershipTier, MembershipStatus } from '@/lib/membership/plans';

interface MemberCardProps {
  memberId: string;
  clientName: string;
  email: string;
  tier: MembershipTier;
  status: MembershipStatus;
  joinDate: string;
  monthlyRate: number;
  creditUsageRate: number;
  churnRisk: 'low' | 'moderate' | 'high' | 'critical';
  churnScore: number;
  lastVisitDate?: string;
  onClick?: () => void;
}

const TIER_STYLES: Record<MembershipTier, { label: string; badge: string; icon: string }> = {
  halo: { label: 'Halo', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-500' },
  glow: { label: 'Glow', badge: 'bg-amber-100 text-amber-700', icon: 'text-rani-gold-accessible' },
  elite: { label: 'Elite', badge: 'bg-purple-100 text-purple-700', icon: 'text-purple-600' },
};

const STATUS_STYLES: Record<MembershipStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  paused: { label: 'Paused', color: 'bg-gray-100 text-gray-600' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-500' },
  past_due: { label: 'Past Due', color: 'bg-amber-100 text-amber-700' },
  pending: { label: 'Pending', color: 'bg-blue-100 text-blue-600' },
  trialing: { label: 'Trial', color: 'bg-indigo-100 text-indigo-600' },
};

const RISK_STYLES: Record<string, { color: string; bgColor: string }> = {
  low: { color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  moderate: { color: 'text-amber-600', bgColor: 'bg-amber-50' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-50' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-50' },
};

export default function MemberCard({
  memberId,
  clientName,
  email,
  tier,
  status,
  joinDate,
  monthlyRate,
  creditUsageRate,
  churnRisk,
  churnScore,
  lastVisitDate,
  onClick,
}: MemberCardProps) {
  const tierStyle = TIER_STYLES[tier];
  const statusStyle = STATUS_STYLES[status];
  const riskStyle = RISK_STYLES[churnRisk];

  const memberSince = new Date(joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const lastVisit = lastVisitDate
    ? new Date(lastVisitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'No visits';

  return (
    <div
      className={`bg-white rounded-xl border border-rani-border p-4 hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      } ${churnRisk === 'critical' ? 'border-l-4 border-l-red-500' : churnRisk === 'high' ? 'border-l-4 border-l-orange-400' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-rani-cream flex items-center justify-center`}>
            <User className={`w-5 h-5 ${tierStyle.icon}`} />
          </div>
          <div>
            <h4 className="text-sm font-heading font-semibold text-rani-navy">{clientName}</h4>
            <p className="text-xs font-body text-rani-muted">{email}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-semibold ${tierStyle.badge}`}>
            {tierStyle.label}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-semibold ${statusStyle.color}`}>
            {statusStyle.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-[10px] font-body text-rani-muted uppercase tracking-wide">Rate</p>
          <p className="text-sm font-body font-semibold text-rani-navy">
            ${monthlyRate}<span className="text-[10px] text-rani-muted">/mo</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-body text-rani-muted uppercase tracking-wide">Credits Used</p>
          <p className={`text-sm font-body font-semibold ${creditUsageRate < 30 ? 'text-red-500' : creditUsageRate < 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {Math.round(creditUsageRate)}%
          </p>
        </div>
        <div>
          <p className="text-[10px] font-body text-rani-muted uppercase tracking-wide">Last Visit</p>
          <p className="text-sm font-body font-semibold text-rani-navy">{lastVisit}</p>
        </div>
        <div>
          <p className="text-[10px] font-body text-rani-muted uppercase tracking-wide">Churn Risk</p>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${riskStyle.bgColor}`}>
            {churnRisk === 'critical' || churnRisk === 'high' ? (
              <AlertTriangle className={`w-3 h-3 ${riskStyle.color}`} />
            ) : null}
            <span className={`text-xs font-body font-semibold capitalize ${riskStyle.color}`}>
              {churnRisk}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-rani-border flex items-center justify-between">
        <span className="text-[10px] font-body text-rani-muted">Member since {memberSince}</span>
        <span className="text-[10px] font-body text-rani-muted">Score: {churnScore}/100</span>
      </div>
    </div>
  );
}
