'use client';

import { DollarSign } from 'lucide-react';
import { useProviderCompensation } from '@/hooks/useProviderData';
import { CompensationBreakdown } from '@/components/dashboard/providers';

export default function ProviderCompensationPage() {
  const providerId = 'current-provider';
  const { data: comp, isLoading } = useProviderCompensation(providerId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-rani-navy">My Compensation</h1>
        <p className="text-sm text-rani-muted font-body mt-1">View your compensation details</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-100 rounded-xl" />
        </div>
      ) : comp ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Gross Pay', value: comp.grossCompensation },
              { label: 'Net Pay', value: comp.netCompensation },
              { label: 'Effective Rate', value: comp.effectiveHourlyRate, suffix: '/hr' },
              { label: 'Total Commission', value: comp.totalCommissions },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-rani-muted font-body">{item.label}</p>
                <p className="font-display font-bold text-xl text-rani-navy">
                  ${item.value.toLocaleString()}{item.suffix || ''}
                </p>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-rani-navy mb-4">Compensation Breakdown</h2>
            <CompensationBreakdown
              baseSalary={comp.baseSalary}
              serviceCommission={comp.commissionBreakdown.serviceCommission}
              productCommission={comp.commissionBreakdown.productCommission}
              membershipBonuses={comp.commissionBreakdown.membershipBonuses}
              performanceBonuses={comp.totalBonuses - comp.commissionBreakdown.membershipBonuses}
              tips={comp.totalTips}
              grossPay={comp.grossCompensation}
              estimatedTaxes={comp.estimatedTaxes}
              netPay={comp.netCompensation}
              commissionTier={comp.commissionBreakdown.tier}
              commissionRate={comp.commissionBreakdown.tierRate}
            />
          </div>

          <p className="text-xs text-rani-muted font-body text-center">
            Period: {comp.period}. Tax estimates are approximate — consult your tax advisor.
          </p>
        </>
      ) : (
        <p className="text-sm text-rani-muted font-body text-center py-8">No compensation data available</p>
      )}
    </div>
  );
}
