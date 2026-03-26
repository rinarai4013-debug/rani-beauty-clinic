'use client';

import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';
import type { AttributionComparison, AttributionModel, MarketingChannel } from '@/lib/marketing/attribution';
import { formatCurrency } from '@/lib/utils/formatters';

const MODEL_LABELS: Record<AttributionModel, string> = {
  first_touch: 'First Touch',
  last_touch: 'Last Touch',
  linear: 'Linear',
  time_decay: 'Time Decay',
  position_based: 'Position-Based',
};

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

interface AttributionSankeyProps {
  comparisons: AttributionComparison[];
  selectedModel?: AttributionModel;
  onModelChange?: (model: AttributionModel) => void;
  loading?: boolean;
}

export default function AttributionSankey({
  comparisons,
  selectedModel = 'position_based',
  onModelChange,
  loading,
}: AttributionSankeyProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-rani-border/30 bg-white p-5 animate-pulse">
        <div className="h-5 w-52 bg-rani-cream rounded mb-4" />
        <div className="h-64 bg-rani-cream rounded" />
      </div>
    );
  }

  const models: AttributionModel[] = ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'];

  return (
    <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Attribution Model Comparison
        </h3>
      </div>

      {/* Model selector tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {models.map(model => (
          <button
            key={model}
            onClick={() => onModelChange?.(model)}
            className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all ${
              selectedModel === model
                ? 'bg-rani-navy text-white shadow-sm'
                : 'bg-rani-cream text-rani-muted hover:text-rani-navy'
            }`}
          >
            {MODEL_LABELS[model]}
          </button>
        ))}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-body">
          <thead>
            <tr className="text-rani-muted border-b border-rani-border/20">
              <th className="text-left py-2 pr-2">Channel</th>
              {models.map(m => (
                <th
                  key={m}
                  className={`text-right py-2 px-2 ${selectedModel === m ? 'text-rani-navy font-semibold' : ''}`}
                >
                  {MODEL_LABELS[m].split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comp, idx) => (
              <motion.tr
                key={comp.channel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="border-b border-rani-border/10"
              >
                <td className="py-2.5 pr-2 text-rani-navy font-medium whitespace-nowrap">
                  {CHANNEL_LABELS[comp.channel]}
                </td>
                {models.map(m => {
                  const modelData = comp.models[m];
                  const isSelected = selectedModel === m;
                  return (
                    <td
                      key={m}
                      className={`text-right py-2.5 px-2 ${
                        isSelected ? 'text-rani-navy font-semibold bg-rani-cream/30' : 'text-rani-muted'
                      }`}
                    >
                      <div>{modelData?.share?.toFixed(1)}%</div>
                      <div className="text-[10px]">{formatCurrency(modelData?.revenue || 0, true)}</div>
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insights */}
      {comparisons.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {comparisons.slice(0, 3).map(comp => (
            <p key={comp.channel} className="text-[11px] font-body text-rani-muted">
              {comp.insight}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
