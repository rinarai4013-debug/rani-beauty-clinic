'use client';

import { motion } from 'framer-motion';
import { BarChart2, Eye, Clock, MousePointerClick, TrendingUp } from 'lucide-react';
import type { ContentPerformance } from '@/lib/marketing/content-calendar';
import { formatNumber } from '@/lib/utils/formatters';

interface ContentPerformanceTableProps {
  performances: ContentPerformance[];
  loading?: boolean;
}

export default function ContentPerformanceTable({ performances, loading }: ContentPerformanceTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-rani-border/30 bg-white p-5 animate-pulse">
        <div className="h-5 w-48 bg-rani-cream rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-rani-cream rounded" />)}
        </div>
      </div>
    );
  }

  const sorted = [...performances].sort((a, b) => b.performanceScore - a.performanceScore);

  return (
    <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
      <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2 mb-4">
        <BarChart2 className="w-4 h-4" />
        Content Performance
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-body">
          <thead>
            <tr className="text-rani-muted border-b border-rani-border/20">
              <th className="text-left py-2 pr-2">Content</th>
              <th className="text-right py-2 px-2">Views</th>
              <th className="text-right py-2 px-2">Time</th>
              <th className="text-right py-2 px-2">Conv.</th>
              <th className="text-right py-2 px-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 10).map((perf, idx) => (
              <motion.tr
                key={perf.pieceId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="border-b border-rani-border/10 hover:bg-rani-cream/30 transition-colors"
              >
                <td className="py-2.5 pr-2">
                  <div className="max-w-[200px]">
                    <p className="text-rani-navy font-medium truncate">{perf.title}</p>
                    <p className="text-[10px] text-rani-muted capitalize">
                      {perf.type.replace(/_/g, ' ')} &middot; {perf.channel}
                    </p>
                  </div>
                </td>
                <td className="text-right py-2.5 px-2 text-rani-navy">
                  {formatNumber(perf.metrics.pageViews || perf.metrics.likes || 0, true)}
                </td>
                <td className="text-right py-2.5 px-2 text-rani-muted">
                  {perf.metrics.avgTimeOnPage
                    ? `${Math.round(perf.metrics.avgTimeOnPage / 60)}m`
                    : '-'}
                </td>
                <td className="text-right py-2.5 px-2 text-rani-navy font-medium">
                  {perf.metrics.conversions || 0}
                </td>
                <td className="text-right py-2.5 px-2">
                  <span className={`inline-flex items-center justify-center w-8 h-5 rounded text-[10px] font-bold ${
                    perf.performanceScore >= 75 ? 'bg-emerald-100 text-emerald-700' :
                    perf.performanceScore >= 50 ? 'bg-amber-100 text-amber-700' :
                    perf.performanceScore >= 25 ? 'bg-slate-100 text-slate-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {perf.performanceScore}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
