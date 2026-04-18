'use client';

import { motion } from 'framer-motion';
import { Package, AlertTriangle, AlertCircle, CheckCircle, MinusCircle } from 'lucide-react';
import type { Product, StockStatus } from '@/data/inventory/products';
import { getStockStatus, STOCK_STATUS_CONFIG, getDaysUntilReorder } from '@/data/inventory/products';

/* ─── StockLevelCard ──────────────────────────────────────────────────
 *  Visual stock indicator showing fill level, status, and days until
 *  reorder point is reached.
 * ──────────────────────────────────────────────────────────────────── */

const STATUS_ICONS: Record<StockStatus, React.ElementType> = {
  full: CheckCircle,
  adequate: CheckCircle,
  low: AlertTriangle,
  critical: AlertCircle,
  out: MinusCircle,
};

interface StockLevelCardProps {
  product: Product;
  avgDailyUsage?: number;
  compact?: boolean;
  onClick?: () => void;
}

export default function StockLevelCard({ product, avgDailyUsage = 0, compact = false, onClick }: StockLevelCardProps) {
  const status = getStockStatus(product);
  const config = STOCK_STATUS_CONFIG[status];
  const Icon = STATUS_ICONS[status];
  const daysUntilReorder = getDaysUntilReorder(product, avgDailyUsage);
  const fillPercent = Math.min(100, (product.currentStock / product.parLevel) * 100);

  const barColor =
    status === 'full' ? 'bg-emerald-500' :
    status === 'adequate' ? 'bg-blue-500' :
    status === 'low' ? 'bg-amber-500' :
    status === 'critical' ? 'bg-red-500' :
    'bg-red-700';

  return (
    <motion.div
      whileHover={{ y: -1, boxShadow: '0 8px 30px rgba(15, 29, 44, 0.06)' }}
      onClick={onClick}
      className={`
        bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border
        transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-rani-gold/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-3.5 h-3.5 text-rani-gold-accessible" />
          </div>
          <div className="min-w-0">
            <p className={`font-body font-semibold text-rani-navy truncate ${compact ? 'text-xs' : 'text-sm'}`}>
              {product.name}
            </p>
            <p className="text-[10px] font-body text-rani-muted">{product.sku}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${config.color} ${config.bgColor}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
      </div>

      {/* Stock bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-body text-rani-muted">
            {product.currentStock} / {product.parLevel} {product.unit}s
          </span>
          <span className="text-xs font-body font-medium text-rani-navy">{Math.round(fillPercent)}%</span>
        </div>
        <div className="h-2 bg-rani-cream rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
      </div>

      {/* Reorder info */}
      {!compact && (
        <div className="flex items-center justify-between mt-2 text-[10px] font-body text-rani-muted">
          <span>Reorder at: {product.reorderPoint}</span>
          {daysUntilReorder !== null && (
            <span className={daysUntilReorder <= 3 ? 'text-red-500 font-medium' : ''}>
              {daysUntilReorder === 0 ? 'Reorder now' : `~${daysUntilReorder}d until reorder`}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
