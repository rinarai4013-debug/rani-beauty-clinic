'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, AlertTriangle, AlertCircle, Clock, Truck,
  TrendingDown, ArrowRight,
} from 'lucide-react';
import {
  products as allProducts, getStockStatus, getDaysUntilReorder,
  CATEGORY_LABELS, type Product, type StockStatus,
} from '@/data/inventory/products';
import { getSupplierById } from '@/data/inventory/suppliers';

/* ─── ReorderAlerts ───────────────────────────────────────────────────
 *  Smart reorder alerts based on usage velocity, lead time, and
 *  par levels. Groups alerts by urgency.
 * ──────────────────────────────────────────────────────────────────── */

interface ReorderAlert {
  product: Product;
  status: StockStatus;
  daysUntilReorder: number | null;
  supplierLeadTime: number;
  urgency: 'immediate' | 'this_week' | 'next_order' | 'monitor';
  estimatedOrderCost: number;
  quantityToOrder: number;
}

interface ReorderAlertsProps {
  products?: Product[];
  loading?: boolean;
  onCreatePO?: (_productIds: string[]) => void;
}

const URGENCY_CONFIG = {
  immediate: { label: 'Order Immediately', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', Icon: AlertCircle },
  this_week: { label: 'Order This Week', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', Icon: AlertTriangle },
  next_order: { label: 'Next Scheduled Order', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', Icon: Clock },
  monitor: { label: 'Monitor', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', Icon: TrendingDown },
};

function calculateAlerts(products: Product[]): ReorderAlert[] {
  const alerts: ReorderAlert[] = [];
  const avgDailyUsage = 0.5; // Simplified - real implementation uses historical data

  for (const product of products.filter((p) => p.active)) {
    const status = getStockStatus(product);
    if (status === 'full' || status === 'adequate') continue;

    const supplier = getSupplierById(product.supplier);
    const leadTime = supplier?.leadTimeDays || 5;
    const daysUntilReorder = getDaysUntilReorder(product, avgDailyUsage);
    const quantityToOrder = Math.max(1, product.parLevel - product.currentStock);
    const estimatedOrderCost = quantityToOrder * product.unitCost;

    let urgency: ReorderAlert['urgency'];
    if (status === 'out' || status === 'critical') {
      urgency = 'immediate';
    } else if (daysUntilReorder !== null && daysUntilReorder <= leadTime) {
      urgency = 'this_week';
    } else if (status === 'low') {
      urgency = 'next_order';
    } else {
      urgency = 'monitor';
    }

    alerts.push({ product, status, daysUntilReorder, supplierLeadTime: leadTime, urgency, estimatedOrderCost, quantityToOrder });
  }

  // Sort by urgency
  const urgencyOrder = { immediate: 0, this_week: 1, next_order: 2, monitor: 3 };
  return alerts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

export default function ReorderAlerts({ products = allProducts, loading = false, onCreatePO }: ReorderAlertsProps) {
  const alerts = useMemo(() => calculateAlerts(products), [products]);

  const immediateCount = alerts.filter((a) => a.urgency === 'immediate').length;
  const totalEstimatedCost = alerts.filter((a) => a.urgency !== 'monitor').reduce((s, a) => s + a.estimatedOrderCost, 0);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-rani-border rounded w-32" />
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
            Reorder Alerts
          </h3>
          <p className="text-xs font-body text-rani-muted mt-0.5">
            {alerts.length} products need attention
          </p>
        </div>
        {immediateCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body font-semibold bg-red-100 text-red-700 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            {immediateCount} urgent
          </span>
        )}
      </div>

      {/* Summary */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-4 p-3 mb-4 rounded-lg bg-rani-cream/40 border border-rani-border/30 text-xs font-body text-rani-muted">
          <span><strong className="text-rani-navy">{alerts.length}</strong> products below reorder</span>
          <span><strong className="text-rani-navy">${totalEstimatedCost.toLocaleString()}</strong> est. order cost</span>
        </div>
      )}

      {/* Grouped alerts */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-body text-rani-navy font-medium">All stocked up</p>
            <p className="text-xs font-body text-rani-muted">No products need reordering right now</p>
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const config = URGENCY_CONFIG[alert.urgency];
            const UrgIcon = config.Icon;

            return (
              <motion.div
                key={alert.product.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-center justify-between p-2.5 rounded-lg border ${config.bgColor} ${config.borderColor}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <UrgIcon className={`w-4 h-4 flex-shrink-0 ${config.color}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-body font-medium text-rani-navy truncate">{alert.product.name}</p>
                    <p className="text-[10px] font-body text-rani-muted">
                      Stock: {alert.product.currentStock} | Order: {alert.quantityToOrder} | Lead: {alert.supplierLeadTime}d
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs font-body font-medium text-rani-navy">
                    ${alert.estimatedOrderCost.toLocaleString()}
                  </span>
                  {onCreatePO && (
                    <button
                      onClick={() => onCreatePO([alert.product.id])}
                      className="w-6 h-6 rounded-md flex items-center justify-center bg-rani-navy/10 hover:bg-rani-navy/20 transition-colors"
                    >
                      <ArrowRight className="w-3 h-3 text-rani-navy" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Bulk order button */}
      {alerts.filter((a) => a.urgency === 'immediate' || a.urgency === 'this_week').length > 1 && onCreatePO && (
        <button
          onClick={() => onCreatePO(alerts.filter((a) => a.urgency === 'immediate' || a.urgency === 'this_week').map((a) => a.product.id))}
          className="w-full mt-3 h-9 rounded-lg bg-rani-navy text-white text-xs font-body font-medium hover:bg-rani-navy/90 transition-all inline-flex items-center justify-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Create PO for {alerts.filter((a) => a.urgency === 'immediate' || a.urgency === 'this_week').length} urgent items
        </button>
      )}
    </div>
  );
}
