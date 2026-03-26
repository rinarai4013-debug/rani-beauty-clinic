'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, ChevronRight, Clock, DollarSign, Package } from 'lucide-react';
import {
  samplePurchaseOrders, PO_STATUS_CONFIG, PO_PRIORITY_CONFIG,
  type PurchaseOrder, type POStatus,
} from '@/data/inventory/purchase-orders';

/* ─── PurchaseOrderList ───────────────────────────────────────────────
 *  PO history with status tracking and filtering.
 * ──────────────────────────────────────────────────────────────────── */

interface PurchaseOrderListProps {
  orders?: PurchaseOrder[];
  onOrderClick?: (order: PurchaseOrder) => void;
  onCreateNew?: () => void;
  loading?: boolean;
}

const STATUS_FILTERS: { label: string; value: 'all' | POStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'In Progress', value: 'ordered' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Received', value: 'received' },
  { label: 'Paid', value: 'paid' },
];

export default function PurchaseOrderList({
  orders = samplePurchaseOrders,
  onOrderClick,
  onCreateNew,
  loading = false,
}: PurchaseOrderListProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | POStatus>('all');

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-rani-border rounded w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-rani-border rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border">
      <div className="p-4 sm:p-5 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
              Purchase Orders
            </h3>
            <p className="text-xs font-body text-rani-muted mt-0.5">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-rani-navy text-white hover:bg-rani-navy/90 transition-all"
            >
              <Truck className="w-3.5 h-3.5" />
              New PO
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-body font-medium whitespace-nowrap transition-all ${
                statusFilter === f.value
                  ? 'bg-rani-navy text-white'
                  : 'bg-rani-cream/60 text-rani-muted hover:text-rani-navy'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order cards */}
      <div className="p-4 sm:p-5 pt-0 space-y-2">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-8 h-8 text-rani-muted/30 mx-auto mb-2" />
            <p className="text-sm font-body text-rani-navy font-medium">No purchase orders</p>
            <p className="text-xs font-body text-rani-muted mt-1">
              {statusFilter !== 'all' ? 'Try a different filter' : 'Create your first purchase order'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order, idx) => {
            const statusConfig = PO_STATUS_CONFIG[order.status];
            const priorityConfig = PO_PRIORITY_CONFIG[order.priority];
            const itemCount = order.lineItems.length;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={onOrderClick ? () => onOrderClick(order) : undefined}
                className={`
                  p-3 sm:p-4 rounded-lg border border-rani-border/30 bg-rani-cream/10
                  transition-all duration-200
                  ${onOrderClick ? 'cursor-pointer hover:bg-rani-cream/30 hover:border-rani-border/50' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-body font-semibold text-rani-navy">
                        {order.poNumber}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${statusConfig.color} ${statusConfig.bgColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                        {statusConfig.label}
                      </span>
                      {order.priority !== 'routine' && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-body font-medium ${priorityConfig.color} ${priorityConfig.bgColor}`}>
                          {priorityConfig.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-body text-rani-muted">{order.supplierName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-body font-bold text-rani-navy">
                      ${order.total.toLocaleString()}
                    </span>
                    {onOrderClick && <ChevronRight className="w-4 h-4 text-rani-muted" />}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-body text-rani-muted">
                  <span className="inline-flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Created {new Date(order.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {order.expectedDeliveryDate && (
                    <span className="inline-flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      ETA {new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
