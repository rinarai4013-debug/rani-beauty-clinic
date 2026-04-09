'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber, formatRelativeTime } from '@/lib/utils/formatters';
import type { PointsTransaction, LoyaltyAnalytics } from '@/lib/loyalty/engine';

interface PointsHistoryProps {
  analytics: LoyaltyAnalytics;
}

const TYPE_LABELS: Record<string, string> = {
  treatment_spend: 'Treatment',
  referral_bonus: 'Referral',
  birthday_bonus: 'Birthday',
  review_bonus: 'Review',
  visit_streak_bonus: 'Streak',
  tier_up_bonus: 'Tier Up',
  redemption: 'Redeemed',
  expiration: 'Expired',
  manual_adjustment: 'Adjustment',
};

const TYPE_COLORS: Record<string, string> = {
  treatment_spend: 'text-rani-gold',
  referral_bonus: 'text-purple-600',
  birthday_bonus: 'text-pink-600',
  review_bonus: 'text-blue-600',
  visit_streak_bonus: 'text-emerald-600',
  tier_up_bonus: 'text-amber-600',
  redemption: 'text-red-500',
  expiration: 'text-gray-400',
  manual_adjustment: 'text-gray-600',
};

export default function PointsHistory({ analytics }: PointsHistoryProps) {
  const { recentTransactions, monthlyIssuance } = analytics;

  return (
    <div className="space-y-6">
      {/* Monthly Chart */}
      <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
        <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Points Economy (Last 6 Months)</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyIssuance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(v) => {
                  const [y, m] = v.split('-');
                  return new Date(parseInt(y), parseInt(m) - 1).toLocaleString('en-US', { month: 'short' });
                }}
              />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip
                formatter={((value: number, name: string) => [
                  formatNumber(value),
                  name === 'earned' ? 'Earned' : 'Redeemed',
                ]) as any}
              />
              <Legend />
              <Bar dataKey="earned" fill="#C9A96E" name="Earned" radius={[4, 4, 0, 0]} />
              <Bar dataKey="redeemed" fill="#0F1D2C" name="Redeemed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
        <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Recent Transactions</h3>
        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-rani-muted text-center py-8">No transactions yet</p>
          ) : (
            recentTransactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-rani-border last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 ${TYPE_COLORS[tx.type] || 'text-gray-600'}`}>
                      {TYPE_LABELS[tx.type] || tx.type}
                    </span>
                    <span className="text-sm font-body text-rani-text truncate">{tx.description}</span>
                  </div>
                  <p className="text-xs text-rani-muted mt-0.5">{formatRelativeTime(tx.createdAt)}</p>
                </div>
                <span className={`text-sm font-heading font-semibold ml-3 ${tx.points > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.points > 0 ? '+' : ''}{formatNumber(tx.points)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
