'use client';

import { Package } from 'lucide-react';
import type { BundleOptimization } from '@/lib/revenue/pricing-optimizer';

interface BundleOptimizationGridProps {
  bundles: BundleOptimization[];
}

export default function BundleOptimizationGrid({ bundles }: BundleOptimizationGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {bundles.map((bundle, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-rani-gold-accessible" />
              <h4 className="text-sm font-heading text-rani-navy">{bundle.bundleName}</h4>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-body ${
              bundle.demandScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
              bundle.demandScore >= 50 ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {bundle.demandScore}% demand
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {bundle.services.map((svc, j) => (
              <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-rani-cream text-rani-text font-body">
                {svc}
              </span>
            ))}
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-body text-rani-muted line-through">${bundle.individualTotal.toLocaleString()}</p>
              <p className="text-lg font-heading text-rani-navy">${bundle.bundlePrice.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-body text-emerald-600 font-medium">Save {bundle.savingsPercent}%</p>
              <p className="text-xs font-body text-rani-muted">{Math.round(bundle.margin * 100)}% margin</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
