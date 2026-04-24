'use client';

import { ArrowLeftRight, Check, X, Sparkles } from 'lucide-react';
import type { PlaidTransaction, ReconciliationMatch } from '@/types/plaid';

interface ReconciliationPanelProps {
  transaction: PlaidTransaction | null;
  matches: ReconciliationMatch[];
  onConfirm: (_match: ReconciliationMatch) => void;
  onExclude: (_txId: string) => void;
  onClose: () => void;
}

export default function ReconciliationPanel({
  transaction,
  matches,
  onConfirm,
  onExclude,
  onClose,
}: ReconciliationPanelProps) {
  if (!transaction) return null;

  const isCredit = transaction.amount < 0;
  const displayAmount = Math.abs(transaction.amount);

  return (
    <div
        className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-rani-border">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-rani-gold" />
              <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
                Reconcile Transaction
              </h3>
            </div>
            <button onClick={onClose} className="text-rani-muted hover:text-rani-navy">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Transaction details */}
          <div className="p-5 border-b border-rani-border bg-rani-cream/30">
            <p className="text-sm font-body font-medium text-rani-navy">
              {transaction.merchantName || transaction.name}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-body text-rani-muted">{transaction.date}</span>
              <span className={`text-sm font-body font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                {isCredit ? '+' : '-'}${displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Matches */}
          <div className="p-5">
            {matches.length > 0 ? (
              <>
                <p className="text-xs font-body font-semibold text-rani-muted uppercase tracking-wider mb-3">
                  Suggested Matches
                </p>
                <div className="space-y-2">
                  {matches.map((match) => (
                    <button
                      key={match.entryId}
                      onClick={() => onConfirm(match)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-rani-border hover:border-rani-gold hover:bg-rani-gold/5 transition-all text-left"
                    >
                      <div>
                        <p className="text-sm font-body font-medium text-rani-navy">
                          {match.entryType === 'expense' ? 'Expense' : 'Sale'} #{match.entryId.slice(-6)}
                        </p>
                        <div className="flex gap-1.5 mt-1">
                          {match.matchReasons.map((reason) => (
                            <span
                              key={reason}
                              className="px-1.5 py-0.5 rounded text-[9px] font-body bg-rani-cream text-rani-muted"
                            >
                              {reason.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-rani-gold" />
                          <span className="text-xs font-body font-bold text-rani-gold">
                            {match.confidence}%
                          </span>
                        </div>
                        <Check className="w-4 h-4 text-rani-success" />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm font-body text-rani-muted text-center py-4">
                No matching entries found
              </p>
            )}

            {/* Exclude button */}
            <button
              onClick={() => onExclude(transaction.id)}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-red-500 text-xs font-body font-medium hover:bg-red-50 transition-colors"
            >
              <X className="w-3 h-3" />
              Exclude from tracking
            </button>
          </div>
        </div>
      </div>
  );
}
