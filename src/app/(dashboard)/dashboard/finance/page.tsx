'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import PlaidLinkButton from '@/components/dashboard/plaid/PlaidLinkButton';
import AccountsStrip from '@/components/dashboard/plaid/AccountsStrip';
import TransactionFeed from '@/components/dashboard/plaid/TransactionFeed';
import SyncStatusBadge from '@/components/dashboard/plaid/SyncStatusBadge';
import { DashboardErrorBoundary, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { usePlaidConnection, useBankFeedSummary } from '@/hooks/usePlaidData';

export default function FinanceCockpit() {
  const { data: connectionData, error: connectionError, mutate: mutateConnection } = usePlaidConnection();
  const isConnected = connectionData?.connection?.isConnected ?? false;
  const accounts = connectionData?.accounts ?? [];
  const { data: bankSummary, error: summaryError, mutate: mutateSummary } = useBankFeedSummary('mtd');

  const handleSyncComplete = () => { mutateConnection(); mutateSummary(); };

  // When connected, use real data
  const totalRevenue = bankSummary?.monthlyInflow ?? 0;
  const totalExpenses = bankSummary?.monthlyOutflow ?? 0;
  const netProfit = totalRevenue - totalExpenses;
  const unreconciledCount = bankSummary?.unreconciledCount ?? 0;
  const cashflowData = bankSummary?.weeklycashflow ?? [];
  const expenseCategories = bankSummary?.expensesByCategory ?? [];

  return (
    <DashboardErrorBoundary pageName="Finance">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Finance Cockpit</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Cash flow and expense tracking</p>
          </div>
          {isConnected && (
            <SyncStatusBadge lastSync={connectionData?.connection?.lastSync ?? null} onSyncComplete={handleSyncComplete} />
          )}
        </div>

        {/* Error State */}
        {(connectionError || (isConnected && summaryError)) ? (
          <InlineError message="Failed to load financial data" onRetry={() => { mutateConnection(); mutateSummary(); }} />
        ) : !isConnected ? (
          /* Not Connected — show connect banner + empty state */
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-5 sm:p-6 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-rani-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-body font-semibold">Connect Your Bank</h3>
                    <p className="text-xs sm:text-sm text-white/60 mt-0.5">Auto-import transactions, track cash flow in real-time</p>
                  </div>
                </div>
                <PlaidLinkButton variant="full" onSuccess={() => { mutateConnection(); mutateSummary(); }} />
              </div>
            </motion.div>

            <DashboardEmptyState
              icon="dollar"
              title="Connect your bank account to see real financial data"
              description="Link your business bank account via Plaid to unlock live cash flow tracking, expense categorization, and transaction reconciliation."
            />
          </>
        ) : (
          /* Connected — show real data */
          <>
            <AccountsStrip accounts={accounts} />

            {/* Hero KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
              <KPICard title="Cash Position" value={bankSummary?.totalBalance ?? 0} prefix="$" icon="dollar-sign" size="hero" />
              <KPICard title="Revenue MTD" value={totalRevenue} prefix="$" icon="dollar-sign" />
              <KPICard title="Expenses MTD" value={totalExpenses} prefix="$" icon="dollar-sign" />
              <KPICard title="Net Profit" value={Math.abs(netProfit)} prefix={netProfit >= 0 ? '$' : '-$'} icon="dollar-sign" />
              <KPICard title="Unreconciled" value={unreconciledCount} icon="alert-triangle" />
            </div>

            {/* Cashflow Chart + Expense Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Weekly Cash Flow</h3>
                <div className="h-48 sm:h-56">
                  {cashflowData.length === 0 ? (
                    <DashboardEmptyState icon="chart" title="No cash flow data yet" description="Cash flow data will appear after your first transaction sync." compact />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cashflowData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6B7280' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`]} />
                        <Bar dataKey="income" fill="#F3D6BE" radius={[4, 4, 0, 0]} name="Income" />
                        <Bar dataKey="expenses" fill="#0F1D2C" radius={[4, 4, 0, 0]} name="Expenses" opacity={0.3} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Expense Breakdown</h3>
                {expenseCategories.length === 0 ? (
                  <DashboardEmptyState icon="chart" title="No expense data yet" description="Expense categories will populate after transaction sync." compact />
                ) : (
                  <div className="space-y-3">
                    {expenseCategories.map((cat) => (
                      <div key={cat.category} className="flex items-center gap-2 sm:gap-3">
                        <span className="text-[11px] sm:text-xs font-body text-rani-text w-32 sm:w-44 truncate flex-shrink-0">{cat.category}</span>
                        <div className="flex-1 min-w-0">
                          <ProgressBar current={cat.pct} target={100} showPercentage={false} height={6} colorMode="gold" />
                        </div>
                        <span className="text-xs font-body font-semibold text-rani-navy w-14 sm:w-16 text-right flex-shrink-0">${cat.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Transactions */}
            <TransactionFeed />
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
