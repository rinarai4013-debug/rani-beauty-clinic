'use client';

import { motion } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KeywordRanking } from '@/lib/marketing/seo-monitor';
import { formatNumber } from '@/lib/utils/formatters';

interface KeywordRankChartProps {
  keywords: KeywordRanking[];
  loading?: boolean;
}

export default function KeywordRankChart({ keywords, loading }: KeywordRankChartProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-rani-border/30 bg-white p-5 animate-pulse">
        <div className="h-5 w-40 bg-rani-cream rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 bg-rani-cream rounded" />)}
        </div>
      </div>
    );
  }

  const sorted = [...keywords]
    .filter(k => k.position > 0)
    .sort((a, b) => a.position - b.position);

  return (
    <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
      <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2 mb-4">
        <Search className="w-4 h-4" />
        Keyword Rankings
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-body">
          <thead>
            <tr className="text-rani-muted border-b border-rani-border/20">
              <th className="text-left py-2 pr-2">#</th>
              <th className="text-left py-2 px-2">Keyword</th>
              <th className="text-right py-2 px-2">Vol.</th>
              <th className="text-right py-2 px-2">Change</th>
              <th className="text-right py-2 px-2">Diff.</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 20).map((kw, idx) => (
              <motion.tr
                key={kw.keyword}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="border-b border-rani-border/10 hover:bg-rani-cream/30 transition-colors"
              >
                <td className="py-2 pr-2">
                  <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-bold ${
                    kw.position <= 3 ? 'bg-emerald-100 text-emerald-700' :
                    kw.position <= 10 ? 'bg-blue-100 text-blue-700' :
                    kw.position <= 20 ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {kw.position}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <div>
                    <span className="text-rani-navy font-medium">{kw.keyword}</span>
                    {kw.featured && (
                      <span className="ml-1 text-[9px] bg-rani-gold/20 text-rani-gold px-1 py-0.5 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-rani-muted capitalize">
                    {kw.category.replace(/_/g, ' ')} &middot; {kw.intent}
                  </span>
                </td>
                <td className="text-right py-2 px-2 text-rani-muted">
                  {formatNumber(kw.searchVolume, true)}
                </td>
                <td className="text-right py-2 px-2">
                  <div className="flex items-center justify-end gap-0.5">
                    {kw.change > 0 ? (
                      <>
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 font-medium">+{kw.change}</span>
                      </>
                    ) : kw.change < 0 ? (
                      <>
                        <TrendingDown className="w-3 h-3 text-red-400" />
                        <span className="text-red-500 font-medium">{kw.change}</span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-400">0</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="text-right py-2 px-2">
                  <div className="h-1.5 w-12 rounded-full bg-rani-cream overflow-hidden inline-block">
                    <div
                      className={`h-full rounded-full ${
                        kw.difficulty < 30 ? 'bg-emerald-400' :
                        kw.difficulty < 60 ? 'bg-amber-400' :
                        'bg-red-400'
                      }`}
                      style={{ width: `${kw.difficulty}%` }}
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
