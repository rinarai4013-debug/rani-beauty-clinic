'use client';

import { motion } from 'framer-motion';
import { SmilePlus, Meh, Frown } from 'lucide-react';

interface SentimentGaugeProps {
  positive: number;
  neutral: number;
  negative: number;
  nps: number;
  loading?: boolean;
}

export default function SentimentGauge({ positive, neutral, negative, nps, loading }: SentimentGaugeProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-rani-border/30 bg-white p-5 animate-pulse">
        <div className="h-5 w-32 bg-rani-cream rounded mb-4" />
        <div className="h-32 bg-rani-cream rounded" />
      </div>
    );
  }

  const total = positive + neutral + negative || 1;
  const posPct = Math.round((positive / total) * 100);
  const neuPct = Math.round((neutral / total) * 100);
  const negPct = Math.round((negative / total) * 100);

  return (
    <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
      <h3 className="font-heading text-sm font-semibold text-rani-navy mb-4">
        Sentiment Analysis
      </h3>

      {/* NPS Score */}
      <div className="text-center mb-4">
        <div className="text-3xl font-heading font-bold text-rani-navy">{nps}</div>
        <div className="text-xs font-body text-rani-muted">Net Promoter Score</div>
        <div className={`text-xs font-body font-medium ${
          nps >= 50 ? 'text-emerald-600' :
          nps >= 0 ? 'text-amber-600' :
          'text-red-600'
        }`}>
          {nps >= 50 ? 'Excellent' : nps >= 0 ? 'Good' : 'Needs Improvement'}
        </div>
      </div>

      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${posPct}%` }}
          transition={{ duration: 0.6 }}
          className="bg-emerald-500"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${neuPct}%` }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-amber-400"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${negPct}%` }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-red-400"
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <SmilePlus className="w-4 h-4 text-emerald-500 mx-auto mb-0.5" />
          <div className="text-sm font-heading font-bold text-emerald-600">{posPct}%</div>
          <div className="text-[10px] font-body text-rani-muted">Positive ({positive})</div>
        </div>
        <div className="text-center">
          <Meh className="w-4 h-4 text-amber-500 mx-auto mb-0.5" />
          <div className="text-sm font-heading font-bold text-amber-600">{neuPct}%</div>
          <div className="text-[10px] font-body text-rani-muted">Neutral ({neutral})</div>
        </div>
        <div className="text-center">
          <Frown className="w-4 h-4 text-red-400 mx-auto mb-0.5" />
          <div className="text-sm font-heading font-bold text-red-500">{negPct}%</div>
          <div className="text-[10px] font-body text-rani-muted">Negative ({negative})</div>
        </div>
      </div>
    </div>
  );
}
