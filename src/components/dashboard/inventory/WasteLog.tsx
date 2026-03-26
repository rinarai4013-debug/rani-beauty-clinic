'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, DollarSign, AlertTriangle, TrendingDown, Plus } from 'lucide-react';
import {
  sampleWasteEntries, WASTE_CATEGORY_CONFIG,
  type WasteEntry, type WasteCategory,
  getTotalWasteCost, getPreventableWastePercent,
} from '@/data/inventory/purchase-orders';

/* ─── WasteLog ────────────────────────────────────────────────────────
 *  Track expired/damaged/returned product with waste categorization
 *  and cost impact analysis.
 * ──────────────────────────────────────────────────────────────────── */

interface WasteLogProps {
  entries?: WasteEntry[];
  onLogWaste?: () => void;
  loading?: boolean;
}

export default function WasteLog({ entries = sampleWasteEntries, onLogWaste, loading = false }: WasteLogProps) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | WasteCategory>('all');

  const filtered = categoryFilter === 'all' ? entries : entries.filter((e) => e.category === categoryFilter);
  const totalCost = getTotalWasteCost(entries);
  const preventablePercent = getPreventableWastePercent(entries);
  const preventableCost = entries.filter((e) => e.preventable).reduce((s, e) => s + e.totalCost, 0);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-rani-border rounded w-28" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-rani-border rounded-lg" />)}
          </div>
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-rani-border rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            Waste Log
          </h3>
          <p className="text-xs font-body text-rani-muted mt-0.5">{entries.length} entries</p>
        </div>
        {onLogWaste && (
          <button
            onClick={onLogWaste}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body font-medium bg-rani-navy text-white hover:bg-rani-navy/90 transition-all"
          >
            <Plus className="w-3 h-3" />
            Log Waste
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-red-600">Total Loss</p>
          <p className="text-lg font-body font-bold text-red-700 mt-0.5">${totalCost.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-amber-600">Preventable</p>
          <p className="text-lg font-body font-bold text-amber-700 mt-0.5">{preventablePercent.toFixed(0)}%</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-blue-600">Saveable</p>
          <p className="text-lg font-body font-bold text-blue-700 mt-0.5">${preventableCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-2 py-1 rounded-md text-[10px] font-body font-medium whitespace-nowrap transition-all ${
            categoryFilter === 'all' ? 'bg-rani-navy text-white' : 'bg-rani-cream/60 text-rani-muted hover:text-rani-navy'
          }`}
        >
          All
        </button>
        {(Object.keys(WASTE_CATEGORY_CONFIG) as WasteCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-2 py-1 rounded-md text-[10px] font-body font-medium whitespace-nowrap transition-all ${
              categoryFilter === cat ? 'bg-rani-navy text-white' : 'bg-rani-cream/60 text-rani-muted hover:text-rani-navy'
            }`}
          >
            {WASTE_CATEGORY_CONFIG[cat].label}
          </button>
        ))}
      </div>

      {/* Waste entries */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filtered.map((entry, idx) => {
          const catConfig = WASTE_CATEGORY_CONFIG[entry.category];
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="p-3 rounded-lg border border-rani-border/30 bg-rani-cream/10"
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-body font-medium text-rani-navy truncate">{entry.productName}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-body font-medium ${catConfig.color} bg-opacity-10`}
                      style={{ backgroundColor: `currentColor`, opacity: 0.1 }}
                    >
                      <span className={catConfig.color}>{catConfig.label}</span>
                    </span>
                  </div>
                  <p className="text-[10px] font-body text-rani-muted">
                    {entry.sku} | Qty: {entry.quantity} | {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-sm font-body font-bold text-red-600">
                  -${entry.totalCost.toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] font-body text-rani-text">{entry.reason}</p>
              {entry.correctiveAction && (
                <p className="text-[10px] font-body text-emerald-600 mt-1">
                  Action: {entry.correctiveAction}
                </p>
              )}
              {entry.preventable && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-body text-amber-600">
                  <AlertTriangle className="w-3 h-3" />
                  Preventable
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
