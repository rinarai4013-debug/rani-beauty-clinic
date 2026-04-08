'use client';

import type { BenefitsAnalyticsSummary } from '@/lib/membership/benefits';

type BenefitsUsageProps = {
  analytics: BenefitsAnalyticsSummary;
};

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export default function BenefitsUsage({ analytics }: BenefitsUsageProps) {
  return (
    <div className="rounded-xl border border-rani-border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-heading text-rani-navy">Benefits Usage</h3>
        <p className="mt-1 text-sm font-body text-rani-muted">
          How members are actually using credits, discounts, and bonus perks.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-rani-navy/[0.03] p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-rani-muted">Credit Usage</div>
          <div className="mt-1 text-lg font-heading text-rani-navy">
            {formatPercent(analytics.creditUtilizationRate)}
          </div>
        </div>
        <div className="rounded-lg bg-rani-navy/[0.03] p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-rani-muted">Discount Usage</div>
          <div className="mt-1 text-lg font-heading text-rani-navy">
            {formatPercent(analytics.averageDiscountUsage)}
          </div>
        </div>
        <div className="rounded-lg bg-rani-navy/[0.03] p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-rani-muted">Guest Pass Conv.</div>
          <div className="mt-1 text-lg font-heading text-rani-navy">
            {formatPercent(analytics.guestPassConversionRate)}
          </div>
        </div>
        <div className="rounded-lg bg-rani-navy/[0.03] p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-rani-muted">Credits Used</div>
          <div className="mt-1 text-lg font-heading text-rani-navy">
            {analytics.totalCreditsUsed.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1 text-xs font-body font-semibold text-rani-navy">Top Utilizers</div>
          <div className="space-y-2">
            {analytics.topUtilizers.slice(0, 3).map(member => (
              <div key={member.memberId} className="flex items-center justify-between rounded-lg border border-rani-border px-3 py-2 text-sm">
                <span className="text-rani-navy">{member.clientName}</span>
                <span className="font-semibold text-emerald-700">{formatPercent(member.score)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs font-body font-semibold text-rani-navy">Under Utilizers</div>
          <div className="space-y-2">
            {analytics.underUtilizers.slice(0, 3).map(member => (
              <div key={member.memberId} className="flex items-center justify-between rounded-lg border border-rani-border px-3 py-2 text-sm">
                <span className="text-rani-navy">{member.clientName}</span>
                <span className="font-semibold text-amber-700">{formatPercent(member.score)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
