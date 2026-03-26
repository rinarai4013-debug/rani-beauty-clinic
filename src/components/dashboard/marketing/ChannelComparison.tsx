'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ChannelPerformance, MarketingChannel } from '@/lib/marketing/attribution';
import { formatCurrency } from '@/lib/utils/formatters';

const CHANNEL_LABELS: Record<MarketingChannel, string> = {
  organic_search: 'Organic Search',
  paid_search: 'Paid Search',
  paid_social: 'Paid Social',
  organic_social: 'Organic Social',
  referral: 'Referral',
  direct: 'Direct',
  email: 'Email',
  display: 'Display',
  affiliate: 'Affiliate',
  other: 'Other',
};

const CHANNEL_COLORS: Record<MarketingChannel, string> = {
  organic_search: 'bg-emerald-500',
  paid_search: 'bg-blue-500',
  paid_social: 'bg-purple-500',
  organic_social: 'bg-pink-500',
  referral: 'bg-amber-500',
  direct: 'bg-slate-500',
  email: 'bg-cyan-500',
  display: 'bg-orange-500',
  affiliate: 'bg-teal-500',
  other: 'bg-gray-400',
};

interface ChannelComparisonProps {
  channels: ChannelPerformance[];
  loading?: boolean;
}

export default function ChannelComparison({ channels, loading }: ChannelComparisonProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-rani-border/30 bg-white p-5 animate-pulse">
        <div className="h-5 w-44 bg-rani-cream rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-rani-cream rounded" />)}
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...channels.map(c => c.revenue), 1);

  return (
    <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
      <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4" />
        Channel Performance
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-body">
          <thead>
            <tr className="text-rani-muted border-b border-rani-border/20">
              <th className="text-left py-2 pr-2">Channel</th>
              <th className="text-right py-2 px-2">Revenue</th>
              <th className="text-right py-2 px-2">Conv.</th>
              <th className="text-right py-2 px-2">CPA</th>
              <th className="text-right py-2 px-2">ROAS</th>
              <th className="py-2 pl-2 w-24" />
            </tr>
          </thead>
          <tbody>
            {channels.map((channel, idx) => (
              <motion.tr
                key={channel.channel}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-b border-rani-border/10 hover:bg-rani-cream/30 transition-colors"
              >
                <td className="py-2.5 pr-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${CHANNEL_COLORS[channel.channel]}`} />
                    <span className="text-rani-navy font-medium whitespace-nowrap">
                      {CHANNEL_LABELS[channel.channel]}
                    </span>
                  </div>
                </td>
                <td className="text-right py-2.5 px-2 text-rani-navy font-semibold">
                  {formatCurrency(channel.revenue, true)}
                </td>
                <td className="text-right py-2.5 px-2 text-rani-navy">
                  {channel.conversions}
                </td>
                <td className="text-right py-2.5 px-2 text-rani-muted">
                  {channel.cpa > 0 ? formatCurrency(channel.cpa) : '-'}
                </td>
                <td className="text-right py-2.5 px-2">
                  <span className={`font-semibold ${
                    channel.roas >= 4 ? 'text-emerald-600' :
                    channel.roas >= 2 ? 'text-amber-600' :
                    channel.roas > 0 ? 'text-red-500' :
                    'text-rani-muted'
                  }`}>
                    {channel.roas > 0 ? `${channel.roas}x` : '-'}
                  </span>
                </td>
                <td className="py-2.5 pl-2">
                  <div className="h-1.5 rounded-full bg-rani-cream overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CHANNEL_COLORS[channel.channel]} transition-all`}
                      style={{ width: `${(channel.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
