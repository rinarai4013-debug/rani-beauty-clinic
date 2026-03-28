'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CreditCard, Users, BarChart3, Scale } from 'lucide-react';
import { usePayrollPreview, usePayEquity, useProviderCompensation } from '@/hooks/useProviderData';
import KPICard from '@/components/dashboard/cards/KPICard';
import { CompensationBreakdown, PayEquityChart } from '@/components/dashboard/providers';
import { DashboardErrorBoundary, PanelSkeleton, KPIRowSkeleton, InlineError } from '@/components/dashboard/shared';

export default function CompensationOverviewPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const { data: payroll, isLoading, error, mutate } = usePayrollPreview();
  const { data: equity } = usePayEquity();
  const { data: providerComp } = useProviderCompensation(selectedProvider);

  if (error) {
    return (
      <DashboardErrorBoundary pageName="Compensation">
        <InlineError message="Failed to load compensation data" onRetry={() => mutate()} />
      </DashboardErrorBoundary>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-rani-navy">Compensation Overview</h1>
        <p className="text-sm text-rani-muted font-body mt-1">Payroll preview, compensation breakdown, and pay equity</p>
      </div>

      {isLoading ? (
        <KPIRowSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <KPICard title="Total Gross Payroll" value={payroll?.totalGross ?? 0} prefix="$" icon="dollar-sign" />
          <KPICard title="Total Net Payroll" value={payroll?.totalNet ?? 0} prefix="$" icon="dollar-sign" />
          <KPICard title="Active Periods" value={payroll?.periods?.length ?? 0} icon="calendar" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Preview */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-display font-semibold text-rani-navy mb-4">Payroll Preview</h2>
          {isLoading ? (
            <PanelSkeleton />
          ) : payroll?.periods && payroll.periods.length > 0 ? (
            <div className="space-y-3">
              {payroll.periods.map((period, i) => (
                <motion.div
                  key={period.providerId}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedProvider === period.providerId ? 'border-rani-gold bg-rani-gold/5' : 'border-gray-100 hover:border-rani-gold/30'
                  }`}
                  onClick={() => setSelectedProvider(period.providerId === selectedProvider ? null : period.providerId)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-body font-semibold text-sm text-rani-navy">{period.providerId}</p>
                      <p className="text-xs text-rani-muted font-body">{period.startDate} — {period.endDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-rani-navy">${period.grossPay.toLocaleString()}</p>
                      <p className="text-xs text-green-600 font-body">Net: ${period.netPay.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-gray-50 text-xs text-rani-muted font-body">
                    <div>Base: ${period.basePay.toLocaleString()}</div>
                    <div>Commission: ${period.serviceCommission.toLocaleString()}</div>
                    <div>Bonuses: ${(period.membershipBonuses + period.performanceBonuses).toLocaleString()}</div>
                    <div>Tips: ${period.tips.toLocaleString()}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-rani-muted font-body text-center py-8">No payroll data available</p>
          )}
        </div>

        {/* Selected Provider Detail or Pay Equity */}
        {providerComp ? (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-rani-navy mb-4">{providerComp.providerName} — Compensation</h2>
            <CompensationBreakdown
              baseSalary={providerComp.baseSalary}
              serviceCommission={providerComp.commissionBreakdown.serviceCommission}
              productCommission={providerComp.commissionBreakdown.productCommission}
              membershipBonuses={providerComp.commissionBreakdown.membershipBonuses}
              performanceBonuses={providerComp.totalBonuses - providerComp.commissionBreakdown.membershipBonuses}
              tips={providerComp.totalTips}
              grossPay={providerComp.grossCompensation}
              estimatedTaxes={providerComp.estimatedTaxes}
              netPay={providerComp.netCompensation}
              commissionTier={providerComp.commissionBreakdown.tier}
              commissionRate={providerComp.commissionBreakdown.tierRate}
            />
          </div>
        ) : equity ? (
          <PayEquityChart analysis={equity} />
        ) : (
          <PanelSkeleton />
        )}
      </div>
    </div>
  );
}
