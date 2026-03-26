'use client';

import { motion } from 'framer-motion';
import { Calculator, Shield, Lightbulb, AlertTriangle, DollarSign } from 'lucide-react';
import { DashboardErrorBoundary, InlineError, PanelSkeleton, KPIRowSkeleton } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import TaxCalendar from '@/components/dashboard/finance/TaxCalendar';
import { useTaxPlanning } from '@/hooks/useDashboardData';
import type { TaxPlanningResult } from '@/lib/finance/tax-planning';

interface TaxResponse {
  success: boolean;
  data: TaxPlanningResult;
}

export default function TaxPlanningPage() {
  return (
    <DashboardErrorBoundary pageName="Tax Planning">
      <TaxContent />
    </DashboardErrorBoundary>
  );
}

function TaxContent() {
  const { data: raw, isLoading, error, mutate } = useTaxPlanning() as {
    data: TaxResponse | undefined; isLoading: boolean; error: unknown; mutate: () => void;
  };
  const data = raw?.data;

  if (error) return <InlineError message="Failed to load tax data" onRetry={() => mutate()} />;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <KPIRowSkeleton count={4} />
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    );
  }

  if (!data) {
    return <DashboardEmptyState icon="calculator" title="Tax planning data not available" description="Connect financial data sources to enable tax planning intelligence." />;
  }

  const { estimatedTaxes, section179, deductions, retirementOptimization, yearEndStrategies, alerts, projectedTaxLiability } = data;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Tax Planning</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Quarterly estimates, deductions, and optimization strategies</p>
      </div>

      {/* Tax Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                alert.severity === 'warning' ? 'border-amber-200 bg-amber-50' :
                'border-blue-200 bg-blue-50'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                alert.severity === 'critical' ? 'text-red-500' :
                alert.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
              }`} />
              <div>
                <p className="text-sm font-body font-medium text-rani-navy">{alert.message}</p>
                <p className="text-xs font-body text-rani-muted mt-0.5">{alert.actionRequired}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-rani-gold" />
            <span className="text-xs text-rani-muted font-body">Total Tax Liability</span>
          </div>
          <p className="text-lg font-heading font-semibold text-rani-navy">${projectedTaxLiability.total.toLocaleString()}</p>
          <p className="text-[10px] text-rani-muted font-body">{projectedTaxLiability.effectiveRate}% effective rate</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 bg-white rounded-xl border border-gray-200">
          <span className="text-xs text-rani-muted font-body">Federal Tax</span>
          <p className="text-lg font-heading font-semibold text-rani-navy">${projectedTaxLiability.federal.toLocaleString()}</p>
          <p className="text-[10px] text-rani-muted font-body">{projectedTaxLiability.marginalRate}% marginal rate</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 bg-white rounded-xl border border-gray-200">
          <span className="text-xs text-rani-muted font-body">Self-Employment Tax</span>
          <p className="text-lg font-heading font-semibold text-rani-navy">${projectedTaxLiability.selfEmployment.toLocaleString()}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 bg-white rounded-xl border border-gray-200">
          <span className="text-xs text-rani-muted font-body">WA B&O Tax</span>
          <p className="text-lg font-heading font-semibold text-rani-navy">${projectedTaxLiability.waBOTax.toLocaleString()}</p>
          <p className="text-[10px] text-rani-muted font-body">1.5% of gross receipts</p>
        </motion.div>
      </div>

      {/* Quarterly Tax Calendar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Quarterly Estimated Tax Payments</h3>
        <TaxCalendar
          payments={estimatedTaxes.quarterlyPayments}
          ytdPaid={estimatedTaxes.ytdPaid}
          remainingBalance={estimatedTaxes.remainingBalance}
        />
        {!estimatedTaxes.safeHarborMet && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs font-body text-amber-700">Safe harbor threshold not met. Increase quarterly payments to avoid underpayment penalties.</p>
          </div>
        )}
      </div>

      {/* Deductions + Section 179 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-rani-gold" />
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">Deductions Summary</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Business Expenses', amount: deductions.businessExpenses },
              { label: 'Depreciation', amount: deductions.depreciation },
              { label: 'Section 179', amount: deductions.section179 },
              { label: 'Home Office', amount: deductions.homeOffice },
              { label: 'Health Insurance', amount: deductions.healthInsurance },
              { label: 'Retirement', amount: deductions.retirement },
              { label: 'Mileage', amount: deductions.mileage },
              { label: 'SE Tax Deduction', amount: deductions.selfEmploymentTaxDeduction },
            ].filter(d => d.amount > 0).map(d => (
              <div key={d.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-xs font-body text-rani-muted">{d.label}</span>
                <span className="text-sm font-body font-semibold text-rani-navy">${d.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-gray-300">
              <span className="text-sm font-body font-semibold text-rani-navy">Total Deductions</span>
              <span className="text-lg font-heading font-semibold text-green-600">${deductions.totalDeductions.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-rani-gold" />
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">Section 179</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-rani-cream/50">
                <p className="text-[10px] text-rani-muted font-body">Claimed</p>
                <p className="text-lg font-heading font-semibold text-rani-navy">${section179.totalClaimed.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-rani-cream/50">
                <p className="text-[10px] text-rani-muted font-body">Remaining</p>
                <p className="text-lg font-heading font-semibold text-green-600">${section179.remainingAllowance.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs font-body text-rani-muted">{section179.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Retirement Optimization */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Retirement Optimization</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="p-3 rounded-lg bg-rani-cream/50">
            <p className="text-[10px] text-rani-muted font-body">Current Contributions</p>
            <p className="text-lg font-heading font-semibold text-rani-navy">${retirementOptimization.currentContribution.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-rani-cream/50">
            <p className="text-[10px] text-rani-muted font-body">Max Allowable</p>
            <p className="text-lg font-heading font-semibold text-rani-navy">${retirementOptimization.maxAllowable.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-rani-cream/50">
            <p className="text-[10px] text-rani-muted font-body">Room to Contribute</p>
            <p className="text-lg font-heading font-semibold text-green-600">${retirementOptimization.additionalContributionRoom.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-rani-cream/50">
            <p className="text-[10px] text-rani-muted font-body">Tax Savings if Maxed</p>
            <p className="text-lg font-heading font-semibold text-green-600">${retirementOptimization.taxSavingsIfMaxed.toLocaleString()}</p>
          </div>
        </div>
        <p className="text-xs font-body text-rani-muted">{retirementOptimization.recommendation}</p>
      </div>

      {/* Year-End Strategies */}
      {yearEndStrategies.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-rani-gold" />
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">Year-End Tax Strategies</h3>
          </div>
          <div className="space-y-3">
            {yearEndStrategies.map((strategy, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg border border-gray-100 hover:border-rani-gold/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-body font-medium ${
                        strategy.priority === 'high' ? 'bg-red-100 text-red-700' :
                        strategy.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{strategy.priority}</span>
                      <h4 className="text-sm font-body font-semibold text-rani-navy">{strategy.strategy}</h4>
                    </div>
                    <p className="text-xs font-body text-rani-muted mt-1">{strategy.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {strategy.actionItems.map((item, j) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 rounded bg-rani-cream text-rani-navy font-body">{item}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-heading font-semibold text-green-600">~${strategy.estimatedSavings.toLocaleString()}</p>
                    <p className="text-[10px] text-rani-muted font-body">est. savings</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
