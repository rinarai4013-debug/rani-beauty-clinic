'use client';

import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Tag, X, Check, RefreshCw } from 'lucide-react';
import { usePlaidTransactions, reconcileTransaction, triggerPlaidSync } from '@/hooks/usePlaidData';
import { CATEGORY_LABELS } from '@/lib/plaid/categories';
import type { PlaidTransaction, RaniExpenseCategory, ReconciliationStatus } from '@/types/plaid';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unmatched', label: 'Unmatched' },
  { key: 'auto-matched', label: 'Matched' },
  { key: 'excluded', label: 'Excluded' },
] as const;

const STATUS_COLORS: Record<ReconciliationStatus, string> = {
  unmatched: 'bg-amber-50 text-amber-600',
  'auto-matched': 'bg-green-50 text-green-600',
  'manually-matched': 'bg-green-50 text-green-600',
  excluded: 'bg-gray-100 text-gray-400',
  categorized: 'bg-blue-50 text-blue-600',
};

export default function TransactionFeed() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const status = activeTab === 'all' ? undefined : activeTab;
  const { data, isLoading, mutate } = usePlaidTransactions({ limit: 50, status });

  const transactions = data?.transactions || [];

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerPlaidSync();
      toast.success(`Synced: ${result.added} new transactions`);
      mutate();
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleExclude = async (txId: string) => {
    try {
      await reconcileTransaction(txId, { action: 'exclude' });
      toast.success('Transaction excluded');
      mutate();
    } catch {
      toast.error('Failed to exclude');
    }
  };

  const handleCategorize = async (txId: string, category: RaniExpenseCategory) => {
    try {
      await reconcileTransaction(txId, { category });
      toast.success('Category updated! +5 XP');
      mutate();
    } catch {
      toast.error('Failed to categorize');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-rani-border rounded w-40" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-rani-border/50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
          Bank Transactions
        </h3>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rani-navy text-white text-xs font-body font-medium hover:bg-rani-navy-light transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4 p-0.5 bg-rani-cream rounded-lg">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-rani-navy shadow-sm'
                : 'text-rani-muted hover:text-rani-navy'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-sm text-rani-muted">
          No transactions found. Click Sync to fetch from your bank.
        </div>
      ) : (
        <div className="divide-y divide-rani-border/50">
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              expanded={expandedId === tx.id}
              onToggle={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
              onExclude={() => handleExclude(tx.id)}
              onCategorize={(cat) => handleCategorize(tx.id, cat)}
            />
          ))}
        </div>
      )}

      {/* Pagination hint */}
      {data?.hasMore && (
        <div className="text-center pt-4">
          <span className="text-xs text-rani-muted">
            Showing {transactions.length} of {data.total} transactions
          </span>
        </div>
      )}
    </div>
  );
}

function TransactionRow({
  tx,
  expanded,
  onToggle,
  onExclude,
  onCategorize,
}: {
  tx: PlaidTransaction;
  expanded: boolean;
  onToggle: () => void;
  onExclude: () => void;
  onCategorize: (cat: RaniExpenseCategory) => void;
}) {
  const isCredit = tx.amount < 0;
  const displayAmount = Math.abs(tx.amount);
  const categoryLabel = tx.raniCategory
    ? CATEGORY_LABELS[tx.raniCategory] || tx.raniCategory
    : 'Uncategorized';

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-3 px-1 hover:bg-rani-cream/30 transition-colors text-left"
      >
        {/* Direction icon */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCredit ? 'bg-green-50' : 'bg-red-50'
        }`}>
          {isCredit ? (
            <ArrowDownLeft className="w-4 h-4 text-green-600" />
          ) : (
            <ArrowUpRight className="w-4 h-4 text-red-500" />
          )}
        </div>

        {/* Name + date */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body font-medium text-rani-navy truncate">
            {tx.merchantName || tx.name}
          </p>
          <p className="text-[10px] font-body text-rani-muted">{tx.date}</p>
        </div>

        {/* Category pill */}
        <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${
          STATUS_COLORS[tx.reconciliationStatus]
        }`}>
          {categoryLabel}
        </span>

        {/* Amount */}
        <span className={`text-sm font-body font-semibold whitespace-nowrap ${
          isCredit ? 'text-green-600' : 'text-rani-navy'
        }`}>
          {isCredit ? '+' : '-'}${displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </button>

      {/* Expanded actions */}
      {expanded && (
          <div
            className="overflow-hidden"
          >
            <div className="px-1 pb-3 space-y-2">
              <div className="flex flex-wrap gap-2 text-[10px] font-body text-rani-muted">
                <span>Channel: {tx.paymentChannel}</span>
                <span>Account: {tx.accountId.slice(-4)}</span>
                {tx.pending && <span className="text-amber-500">Pending</span>}
              </div>

              {/* Quick categorize */}
              <div className="flex flex-wrap gap-1.5">
                {(['ad-spend', 'inventory', 'software', 'rent', 'payroll', 'other'] as RaniExpenseCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={(e) => { e.stopPropagation(); onCategorize(cat); }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rani-cream text-[10px] font-body font-medium text-rani-navy hover:bg-rani-gold/20 transition-colors"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onExclude(); }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-500 text-[10px] font-body font-medium hover:bg-red-100 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                  Exclude
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
