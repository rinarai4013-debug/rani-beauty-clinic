'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Building2, AlertCircle } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import PlaidLinkButton from '@/components/dashboard/plaid/PlaidLinkButton';
import AccountsStrip from '@/components/dashboard/plaid/AccountsStrip';
import TransactionFeed from '@/components/dashboard/plaid/TransactionFeed';
import SyncStatusBadge from '@/components/dashboard/plaid/SyncStatusBadge';
import { usePlaidConnection, useBankFeedSummary } from '@/hooks/usePlaidData';

// Fallback mock data when bank is not connected
const MOCK_EXPENSE_CATEGORIES = [
  { category: 'Payroll & Contractors', amount: 12000, pct: 35 },
  { category: 'Ad Spend (Meta + Google)', amount: 5000, pct: 15 },
  { category: 'Inventory & Supplies', amount: 4200, pct: 12 },
  { category: 'Rent + Utilities', amount: 3800, pct: 11 },
  { category: 'Device Rentals', amount: 3200, pct: 9 },
  { category: 'Software & Tools', amount: 1800, pct: 5 },
  { category: 'Insurance', amount: 1200, pct: 3 },
  { category: 'Other', amount: 3300, pct: 10 },
];

const MOCK_WEEKLY_CASHFLOW = [
  { week: 'W1', income: 8200, expenses: 6800 },
  { week: 'W2', income: 7500, expenses: 7200 },
  { week: 'W3', income: 9100, expenses: 6500 },
  { week: 'W4', income: 6800, expenses: 8000 },
];

const MOCK_RECENT_EXPENSES = [
  { date: 'Mar 14', vendor: 'Olympia Pharmacy', category: 'Inventory', amount: 1850, type: 'variable' },
  { date: 'Mar 13', vendor: 'Meta Ads', category: 'Ad Spend', amount: 750, type: 'variable' },
  { date: 'Mar 12', vendor: 'Google Ads', category: 'Ad Spend', amount: 420, type: 'variable' },
  { date: 'Mar 11', vendor: 'Cutera Lease', category: 'Device Rental', amount: 1600, type: 'fixed' },
  { date: 'Mar 10', vendor: 'Amazon Supplies', category: 'Supplies', amount: 285, type: 'variable' },
];

export default function FinanceCockpit() {
  const { data: connectionData, mutate: mutateConnection } = usePlaidConnection();
  const isConnected = connectionData?.connection?.isConnected ?? false;
  const accounts = connectionData?.accounts ?? [];

  const { data: bankSummary, mutate: mutateSummary } = useBankFeedSummary('mtd');

  // Use real bank data if connected, otherwise mock
  const totalRevenue = isConnected ? (bankSummary?.monthlyInflow ?? 0) : 27200;
  const totalExpenses = isConnected ? (bankSummary?.monthlyOutflow ?? 0) : 34500;
  const netProfit = totalRevenue - totalExpenses;
  const weeklyBurn = isConnected ? Math.round(totalExpenses / 4) : 8625;
  const unreconciledCount = bankSummary?.unreconciledCount ?? 0;

  const cashflowData = isConnected
    ? (bankSummary?.weeklycashflow ?? [])
    : MOCK_WEEKLY_CASHFLOW;

  const expenseCategories = isConnected
    ? (bankSummary?.expensesByCategory ?? [])
    : MOCK_EXPENSE_CATEGORIES;

  const handleSyncComplete = () => {
    mutateConnection();
    mutateSummary();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-rani-navy">Finance Cockpit</h1>
          <p className="text-sm font-body text-rani-muted mt-1">Cash flow and expense tracking</p>
        </div>
        {isConnected && (
          <SyncStatusBadge
            lastSync={connectionData?.connection?.lastSync ?? null}
            onSyncComplete={handleSyncComplete}
          />
        )}
      </div>

      {/* Connection Banner or Accounts Strip */}
      {!isConnected ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-6 text-white"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-rani-gold" />
              </div>
              <div>
                <h3 className="text-base font-body font-semibold">Connect Your Bank</h3>
                <p className="text-sm text-white/60 mt-0.5">
                  Auto-import transactions, track cash flow in real-time
                </p>
              </div>
            </div>
            <PlaidLinkButton
              variant="full"
              onSuccess={() => {
                mutateConnection();
                mutateSummary();
              }}
            />
          </div>
        </motion.div>
      ) : (
        <AccountsStrip accounts={accounts} />
      )}

      {/* Hero KPIs */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isConnected ? 'xl:grid-cols-5' : 'xl:grid-cols-4'} gap-6`}>
        {isConnected && (
          <KPICard
            title="Cash Position"
            value={bankSummary?.totalBalance ?? 0}
            prefix="$"
            icon="dollar-sign"
            size="hero"
          />
        )}
        <KPICard
          title="Revenue MTD"
          value={totalRevenue}
          prefix="$"
          icon="dollar-sign"
          trend={{ value: 15, direction: 'up', label: 'vs last month' }}
        />
        <KPICard
          title="Expenses MTD"
          value={totalExpenses}
          prefix="$"
          icon="dollar-sign"
          trend={!isConnected ? { value: 8, direction: 'down', label: 'less than target' } : undefined}
        />
        <KPICard
          title="Net Profit"
          value={Math.abs(netProfit)}
          prefix={netProfit >= 0 ? '$' : '-$'}
          icon="dollar-sign"
        />
        {isConnected && (
          <KPICard
            title="Unreconciled"
            value={unreconciledCount}
            icon="alert-triangle"
          />
        )}
      </div>

      {/* Cashflow Chart + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Cashflow */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Weekly Cash Flow
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`]} />
                <Bar dataKey="income" fill="#F3D6BE" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#0F1D2C" radius={[4, 4, 0, 0]} name="Expenses" opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Expense Breakdown
          </h3>
          <div className="space-y-3">
            {expenseCategories.map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-xs font-body text-rani-text w-44 truncate">{cat.category}</span>
                <div className="flex-1">
                  <ProgressBar current={cat.pct} target={100} showPercentage={false} height={6} colorMode="gold" />
                </div>
                <span className="text-xs font-body font-semibold text-rani-navy w-16 text-right">
                  ${cat.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions: Bank feed or mock table */}
      {isConnected ? (
        <TransactionFeed />
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Recent Expenses
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-rani-border">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Vendor</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Category</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Type</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT_EXPENSES.map((exp, i) => (
                  <tr key={i} className="border-b border-rani-border/50 hover:bg-rani-cream/30">
                    <td className="py-3 px-3 text-rani-muted">{exp.date}</td>
                    <td className="py-3 px-3 font-medium text-rani-navy">{exp.vendor}</td>
                    <td className="py-3 px-3 text-rani-text">{exp.category}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        exp.type === 'fixed' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {exp.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-rani-navy">${exp.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
