'use client';

import { motion } from 'framer-motion';
import { Gauge, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { CoreWebVitals } from '@/lib/marketing/seo-monitor';

const VITAL_LABELS: Record<string, { name: string; unit: string }> = {
  lcp: { name: 'Largest Contentful Paint', unit: 'ms' },
  fid: { name: 'First Input Delay', unit: 'ms' },
  cls: { name: 'Cumulative Layout Shift', unit: '' },
  inp: { name: 'Interaction to Next Paint', unit: 'ms' },
  ttfb: { name: 'Time to First Byte', unit: 'ms' },
};

const RATING_CONFIG = {
  good: { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2 },
  needs_improvement: { color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertTriangle },
  poor: { color: 'text-red-500', bg: 'bg-red-100', icon: XCircle },
};

interface CoreWebVitalsCardProps {
  vitals: CoreWebVitals;
  loading?: boolean;
}

export default function CoreWebVitalsCard({ vitals, loading }: CoreWebVitalsCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-rani-border/30 bg-white p-5 animate-pulse">
        <div className="h-5 w-40 bg-rani-cream rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-rani-cream rounded" />)}
        </div>
      </div>
    );
  }

  const metrics = ['lcp', 'fid', 'cls', 'inp', 'ttfb'] as const;

  return (
    <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          Core Web Vitals
        </h3>
        <span className={`text-sm font-heading font-bold ${
          vitals.overallScore >= 80 ? 'text-emerald-600' :
          vitals.overallScore >= 50 ? 'text-amber-600' :
          'text-red-500'
        }`}>
          {vitals.overallScore}/100
        </span>
      </div>

      <div className="space-y-3">
        {metrics.map((key, idx) => {
          const vital = vitals[key];
          const label = VITAL_LABELS[key];
          const config = RATING_CONFIG[vital.rating];
          const Icon = config.icon;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="flex items-center gap-3"
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center ${config.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-body text-rani-navy font-medium uppercase tracking-wide">
                    {key.toUpperCase()}
                  </span>
                  <span className={`text-xs font-heading font-bold ${config.color}`}>
                    {key === 'cls' ? vital.value.toFixed(3) : `${vital.value}${label.unit}`}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] font-body text-rani-muted truncate pr-2">
                    {label.name}
                  </span>
                  <span className="text-[10px] font-body text-rani-muted whitespace-nowrap">
                    Target: {key === 'cls' ? vital.threshold : `${vital.threshold}${label.unit}`}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
