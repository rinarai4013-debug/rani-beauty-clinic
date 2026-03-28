'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Scale } from 'lucide-react';
import type { PayEquityAnalysis } from '@/types/providers';

interface PayEquityChartProps {
  analysis: PayEquityAnalysis;
}

export default function PayEquityChart({ analysis }: PayEquityChartProps) {
  const maxRate = Math.max(...analysis.providers.map(p => p.effectiveRate), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-rani-navy" />
          <h3 className="font-display font-semibold text-rani-navy">Pay Equity</h3>
        </div>
        <div className={`flex items-center gap-1 text-xs font-body px-2 py-1 rounded-full ${
          analysis.equityScore >= 80 ? 'bg-green-50 text-green-600' : analysis.equityScore >= 60 ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'
        }`}>
          {analysis.equityScore >= 80 ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          Score: {analysis.equityScore}/100
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-rani-muted font-body">Average Rate</p>
          <p className="font-display font-bold text-rani-navy">${analysis.avgRate}/hr</p>
        </div>
        <div>
          <p className="text-xs text-rani-muted font-body">Median Rate</p>
          <p className="font-display font-bold text-rani-navy">${analysis.median}/hr</p>
        </div>
        <div>
          <p className="text-xs text-rani-muted font-body">Spread</p>
          <p className={`font-display font-bold ${analysis.spreadPercent > 30 ? 'text-red-500' : 'text-rani-navy'}`}>
            {analysis.spreadPercent}%
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {analysis.providers.map((provider, i) => (
          <div key={provider.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-body text-rani-navy">{provider.name} ({provider.role})</span>
              <span className="font-display font-semibold text-rani-navy">${provider.effectiveRate}/hr</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-rani-gold"
                initial={{ width: 0 }}
                animate={{ width: `${(provider.effectiveRate / maxRate) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>

      {analysis.flags.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-1">
          {analysis.flags.map((flag, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="font-body text-rani-muted">{flag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
