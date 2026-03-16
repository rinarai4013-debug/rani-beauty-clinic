'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, Link2, Loader2 } from 'lucide-react';
import { usePlaidConnection } from '@/hooks/usePlaidData';
import type { PlaidTransaction } from '@/types/plaid';

interface BankMatchSuggestionProps {
  amount: number;
  vendor: string;
  date: string;
  matchType: 'expense' | 'sale';
  onMatch: (transactionId: string) => void;
}

export default function BankMatchSuggestion({
  amount,
  vendor,
  date,
  matchType,
  onMatch,
}: BankMatchSuggestionProps) {
  const { data: connectionData } = usePlaidConnection();
  const isConnected = connectionData?.connection?.isConnected ?? false;
  const [matches, setMatches] = useState<PlaidTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkedId, setLinkedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !amount || amount <= 0) {
      setMatches([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard/plaid/transactions?limit=10&status=unmatched`
        );
        if (!res.ok) return;
        const data = await res.json();
        const txs: PlaidTransaction[] = data.transactions || [];

        // Filter for matches
        const filtered = txs.filter((tx) => {
          const txAmount = Math.abs(tx.amount);
          const amountClose = Math.abs(txAmount - amount) / amount <= 0.05;

          // For expenses, match debits (positive in Plaid). For sales, match credits (negative)
          const directionMatch = matchType === 'expense' ? tx.amount > 0 : tx.amount < 0;

          // Optional vendor match
          const vendorMatch =
            !vendor ||
            (tx.merchantName || tx.name).toLowerCase().includes(vendor.toLowerCase()) ||
            vendor.toLowerCase().includes((tx.merchantName || tx.name).toLowerCase());

          return amountClose && directionMatch;
        });

        setMatches(filtered.slice(0, 3));
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    // Debounce
    const timer = setTimeout(search, 500);
    return () => clearTimeout(timer);
  }, [isConnected, amount, vendor, date, matchType]);

  if (!isConnected || (!loading && matches.length === 0)) return null;

  return (
    <div className="overflow-hidden">
      <div className="mt-3 p-3 rounded-lg bg-rani-gold/5 border border-rani-gold/20">
          <div className="flex items-center gap-2 mb-2">
            <ArrowLeftRight className="w-3.5 h-3.5 text-rani-gold" />
            <span className="text-xs font-body font-semibold text-rani-navy">
              Bank Feed Match
            </span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-rani-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
              Searching bank transactions...
            </div>
          ) : linkedId ? (
            <div className="flex items-center gap-2 text-xs text-rani-success font-body font-medium">
              <Link2 className="w-3 h-3" />
              Linked to bank transaction
            </div>
          ) : (
            <div className="space-y-1.5">
              {matches.map((tx) => {
                const isCredit = tx.amount < 0;
                const displayAmt = Math.abs(tx.amount);
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => {
                      onMatch(tx.id);
                      setLinkedId(tx.id);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-md bg-white border border-rani-border hover:border-rani-gold transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-body font-medium text-rani-navy truncate">
                        {tx.merchantName || tx.name}
                      </p>
                      <p className="text-[10px] font-body text-rani-muted">{tx.date}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-body font-semibold ${isCredit ? 'text-green-600' : 'text-rani-navy'}`}>
                        ${displayAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <Link2 className="w-3 h-3 text-rani-gold" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
  );
}
