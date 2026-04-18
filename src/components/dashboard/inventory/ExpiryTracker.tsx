'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import type { Product } from '@/data/inventory/products';
import { products as allProducts, CATEGORY_LABELS, getExpiryRisk } from '@/data/inventory/products';

/* ─── ExpiryTracker ───────────────────────────────────────────────────
 *  Calendar view of expiring products with waste risk scoring
 *  and FIFO enforcement indicators.
 * ──────────────────────────────────────────────────────────────────── */

interface LotEntry {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  lotNumber: string;
  expirationDate: Date;
  quantity: number;
  unitCost: number;
  risk: 'expired' | 'critical' | 'warning' | 'ok';
  wasteRiskValue: number;
}

interface ExpiryTrackerProps {
  lots?: LotEntry[];
  loading?: boolean;
}

// Generate sample lot data from products for demonstration
function generateSampleLots(products: Product[]): LotEntry[] {
  const now = new Date();
  const lots: LotEntry[] = [];

  products.filter((p) => p.active && p.currentStock > 0).forEach((product) => {
    // Generate 1-3 lots per product
    const lotCount = Math.min(3, Math.ceil(product.currentStock / Math.max(1, Math.floor(product.parLevel / 3))));
    for (let i = 0; i < lotCount; i++) {
      const monthsUntilExpiry = Math.floor(Math.random() * product.expirationMonths * 0.8) + 1;
      const expirationDate = new Date(now);
      // Some lots are near expiry, some are far
      if (i === 0 && Math.random() > 0.7) {
        expirationDate.setDate(expirationDate.getDate() + Math.floor(Math.random() * 60));
      } else {
        expirationDate.setMonth(expirationDate.getMonth() + monthsUntilExpiry);
      }

      const qty = Math.ceil(product.currentStock / lotCount);
      const risk = getExpiryRisk(expirationDate);

      lots.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: CATEGORY_LABELS[product.category],
        lotNumber: `L${now.getFullYear()}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
        expirationDate,
        quantity: qty,
        unitCost: product.unitCost,
        risk,
        wasteRiskValue: risk === 'expired' ? qty * product.unitCost : risk === 'critical' ? qty * product.unitCost * 0.8 : risk === 'warning' ? qty * product.unitCost * 0.3 : 0,
      });
    }
  });

  return lots.sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime());
}

const RISK_CONFIG = {
  expired: { label: 'Expired', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', Icon: AlertCircle },
  critical: { label: '< 30 Days', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', Icon: AlertTriangle },
  warning: { label: '< 90 Days', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', Icon: Clock },
  ok: { label: 'Good', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', Icon: CheckCircle },
};

export default function ExpiryTracker({ lots: externalLots, loading = false }: ExpiryTrackerProps) {
  const lots = useMemo(() => externalLots || generateSampleLots(allProducts), [externalLots]);

  const expiredLots = lots.filter((l) => l.risk === 'expired');
  const criticalLots = lots.filter((l) => l.risk === 'critical');
  const warningLots = lots.filter((l) => l.risk === 'warning');
  const totalWasteRisk = lots.reduce((sum, l) => sum + l.wasteRiskValue, 0);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-rani-border rounded w-32" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-rani-border rounded-lg" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-rani-border rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            Expiry Tracker
          </h3>
          <p className="text-xs font-body text-rani-muted mt-0.5">
            FIFO enforcement and waste risk monitoring
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-rani-gold-accessible" />
          <span className="text-xs font-body font-medium text-rani-navy">
            {lots.length} lots tracked
          </span>
        </div>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {[
          { label: 'Expired', count: expiredLots.length, config: RISK_CONFIG.expired },
          { label: 'Critical (< 30d)', count: criticalLots.length, config: RISK_CONFIG.critical },
          { label: 'Warning (< 90d)', count: warningLots.length, config: RISK_CONFIG.warning },
          {
            label: 'Waste Risk',
            count: null,
            value: `$${totalWasteRisk.toLocaleString()}`,
            config: totalWasteRisk > 1000 ? RISK_CONFIG.critical : RISK_CONFIG.warning,
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border p-3 ${item.config.bgColor} ${item.config.borderColor}`}
          >
            <p className={`text-[10px] font-body font-semibold uppercase tracking-wider ${item.config.color}`}>
              {item.label}
            </p>
            <p className={`text-lg font-body font-bold mt-0.5 ${item.config.color}`}>
              {item.count !== null && item.count !== undefined ? item.count : item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Lot list - show expired and critical first */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {lots
          .filter((l) => l.risk !== 'ok')
          .map((lot, idx) => {
            const config = RISK_CONFIG[lot.risk];
            const RiskIcon = config.Icon;
            const daysUntilExpiry = Math.floor(
              (lot.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return (
              <motion.div
                key={`${lot.lotNumber}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-center justify-between p-2.5 rounded-lg border ${config.bgColor} ${config.borderColor}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <RiskIcon className={`w-4 h-4 flex-shrink-0 ${config.color}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-body font-medium text-rani-navy truncate">
                      {lot.productName}
                    </p>
                    <p className="text-[10px] font-body text-rani-muted">
                      Lot: {lot.lotNumber} | Qty: {lot.quantity} | ${(lot.quantity * lot.unitCost).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className={`text-xs font-body font-semibold ${config.color}`}>
                    {daysUntilExpiry <= 0 ? 'EXPIRED' : `${daysUntilExpiry}d`}
                  </p>
                  <p className="text-[10px] font-body text-rani-muted">
                    {lot.expirationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
      </div>

      {lots.filter((l) => l.risk !== 'ok').length === 0 && (
        <div className="text-center py-6">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-body text-rani-navy font-medium">All lots within safe range</p>
          <p className="text-xs font-body text-rani-muted">No products expiring within 90 days</p>
        </div>
      )}
    </div>
  );
}
