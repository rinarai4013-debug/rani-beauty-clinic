'use client';

import { motion } from 'framer-motion';
import type { ProviderRanking } from '@/types/providers';

interface ProviderComparisonTableProps {
  rankings: ProviderRanking[];
  providers: string[];
}

export default function ProviderComparisonTable({ rankings, providers }: ProviderComparisonTableProps) {
  // Group by metric
  const metrics = [...new Set(rankings.map(r => r.metric))];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left font-body font-semibold text-rani-navy p-3">Metric</th>
            {providers.map(name => (
              <th key={name} className="text-center font-body font-semibold text-rani-navy p-3">{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric, i) => {
            const metricRankings = rankings.filter(r => r.metric === metric);
            const maxValue = Math.max(...metricRankings.map(r => r.value));

            return (
              <motion.tr
                key={metric}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50"
              >
                <td className="font-body text-rani-navy p-3">{metric}</td>
                {providers.map(name => {
                  const r = metricRankings.find(mr => mr.providerName === name);
                  const isTop = r?.value === maxValue && metricRankings.length > 1;
                  return (
                    <td key={name} className="text-center p-3">
                      <div className="flex flex-col items-center">
                        <span className={`font-display font-semibold ${isTop ? 'text-rani-gold-accessible' : 'text-rani-navy'}`}>
                          {r ? (metric.includes('Revenue') ? `$${r.value.toLocaleString()}` : r.value.toFixed(1)) : '—'}
                        </span>
                        {r && (
                          <span className="text-[10px] text-rani-muted font-body">
                            #{r.rank} ({r.percentile}th)
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
