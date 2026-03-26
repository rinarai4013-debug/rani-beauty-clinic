'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, AlertCircle, CheckCircle, Beaker } from 'lucide-react';
import { products, calculateBudExpiry, type Product } from '@/data/inventory/products';

/* ─── BudExpiryWarning ────────────────────────────────────────────────
 *  Beyond Use Date (BUD) tracking for reconstituted products with
 *  countdown timers. Critical for neurotoxins and peptides.
 * ──────────────────────────────────────────────────────────────────── */

interface ReconstitutedProduct {
  id: string;
  product: Product;
  reconstitutedAt: Date;
  budExpiry: Date;
  reconstitutedBy: string;
  lotNumber: string;
  remainingUnits: number;
}

interface BudExpiryWarningProps {
  reconstituted?: ReconstitutedProduct[];
  loading?: boolean;
}

// Sample reconstituted products
function generateSampleReconstituted(): ReconstitutedProduct[] {
  const now = new Date();
  const budProducts = products.filter((p) => p.budHours && p.active && p.currentStock > 0);

  return [
    {
      id: 'rc-001',
      product: budProducts.find((p) => p.id === 'ntx-001')!,
      reconstitutedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000), // 18 hours ago
      budExpiry: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours left
      reconstitutedBy: 'Mom',
      lotNumber: 'L2026A481',
      remainingUnits: 42,
    },
    {
      id: 'rc-002',
      product: budProducts.find((p) => p.id === 'ntx-003')!,
      reconstitutedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      budExpiry: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour left
      reconstitutedBy: 'Rina',
      lotNumber: 'L2026A119',
      remainingUnits: 180,
    },
    {
      id: 'rc-003',
      product: budProducts.find((p) => p.id === 'ntx-006')!,
      reconstitutedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      budExpiry: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours left
      reconstitutedBy: 'Mom',
      lotNumber: 'L2026B040',
      remainingUnits: 60,
    },
    {
      id: 'rc-004',
      product: budProducts.find((p) => p.id === 'glp-001')!,
      reconstitutedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      budExpiry: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days left
      reconstitutedBy: 'Rina',
      lotNumber: 'L2026C112',
      remainingUnits: 8,
    },
  ].filter((r) => r.product);
}

function getTimeRemaining(expiry: Date): { hours: number; minutes: number; expired: boolean; urgency: 'expired' | 'critical' | 'warning' | 'ok' } {
  const diff = expiry.getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true, urgency: 'expired' };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const urgency = hours < 1 ? 'critical' : hours < 4 ? 'warning' : 'ok';

  return { hours, minutes, expired: false, urgency };
}

const URGENCY_STYLES = {
  expired: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  ok: { bg: 'bg-emerald-50/50', border: 'border-rani-border/30', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
};

export default function BudExpiryWarning({ reconstituted: externalData, loading = false }: BudExpiryWarningProps) {
  const [now, setNow] = useState(new Date());
  const items = useMemo(() => externalData || generateSampleReconstituted(), [externalData]);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.budExpiry.getTime() - b.budExpiry.getTime());
  }, [items]);

  const expiredCount = items.filter((i) => i.budExpiry.getTime() <= now.getTime()).length;
  const criticalCount = items.filter((i) => {
    const tr = getTimeRemaining(i.budExpiry);
    return tr.urgency === 'critical' && !tr.expired;
  }).length;

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-rani-border rounded w-40" />
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-rani-border rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            BUD Tracking
          </h3>
          <p className="text-xs font-body text-rani-muted mt-0.5">
            Beyond Use Date monitoring for reconstituted products
          </p>
        </div>
        <div className="flex items-center gap-2">
          {expiredCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-red-100 text-red-700 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              {expiredCount} expired
            </span>
          )}
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-amber-100 text-amber-700">
              <AlertTriangle className="w-3 h-3" />
              {criticalCount} urgent
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {sortedItems.map((item, idx) => {
          const timeRemaining = getTimeRemaining(item.budExpiry);
          const styles = URGENCY_STYLES[timeRemaining.urgency];
          const budHours = item.product.budHours || 24;
          const elapsed = (Date.now() - item.reconstitutedAt.getTime()) / (1000 * 60 * 60);
          const progressPct = Math.min(100, (elapsed / budHours) * 100);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-3 rounded-lg border ${styles.bg} ${styles.border}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Beaker className={`w-4 h-4 flex-shrink-0 ${styles.text}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-body font-medium text-rani-navy truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[10px] font-body text-rani-muted">
                      Lot: {item.lotNumber} | Prep: {item.reconstitutedBy} | {item.remainingUnits} units left
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body font-bold flex-shrink-0 ${styles.badge}`}>
                  <Clock className="w-3 h-3" />
                  {timeRemaining.expired ? (
                    'EXPIRED'
                  ) : timeRemaining.hours > 24 ? (
                    `${Math.floor(timeRemaining.hours / 24)}d ${timeRemaining.hours % 24}h`
                  ) : (
                    `${timeRemaining.hours}h ${timeRemaining.minutes}m`
                  )}
                </span>
              </div>

              {/* BUD progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-body text-rani-muted">
                    Reconstituted {item.reconstitutedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] font-body text-rani-muted">
                    BUD: {budHours}h
                  </span>
                </div>
                <div className="h-1.5 bg-white rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      timeRemaining.expired ? 'bg-red-500' :
                      timeRemaining.urgency === 'critical' ? 'bg-red-400' :
                      timeRemaining.urgency === 'warning' ? 'bg-amber-400' :
                      'bg-emerald-400'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-body text-rani-navy font-medium">No reconstituted products</p>
          <p className="text-xs font-body text-rani-muted">BUD tracking will appear when products are reconstituted</p>
        </div>
      )}
    </div>
  );
}
