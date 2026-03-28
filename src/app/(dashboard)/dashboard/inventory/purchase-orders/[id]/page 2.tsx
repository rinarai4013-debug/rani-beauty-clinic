'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Truck, Package, Clock, DollarSign,
  CheckCircle, AlertTriangle, Hash, Calendar, ClipboardCheck,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardErrorBoundary } from '@/components/dashboard/shared';
import ReceivingForm from '@/components/dashboard/inventory/ReceivingForm';
import {
  samplePurchaseOrders, PO_STATUS_CONFIG, PO_PRIORITY_CONFIG,
  getReceivingVariance, canTransitionTo, type POStatus,
} from '@/data/inventory/purchase-orders';

/* ─── PO Detail Page ──────────────────────────────────────────────────
 *  Purchase order detail with receiving workflow.
 * ──────────────────────────────────────────────────────────────────── */

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const poId = params.id as string;
  const [showReceiving, setShowReceiving] = useState(false);

  const order = samplePurchaseOrders.find((po) => po.id === poId);

  if (!order) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/inventory/purchase-orders" className="inline-flex items-center gap-1 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to POs
        </Link>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-10 text-center">
          <Package className="w-10 h-10 text-rani-muted/30 mx-auto mb-3" />
          <p className="text-sm font-body font-medium text-rani-navy">Purchase order not found</p>
        </div>
      </div>
    );
  }

  const statusConfig = PO_STATUS_CONFIG[order.status];
  const priorityConfig = PO_PRIORITY_CONFIG[order.priority];
  const canReceive = canTransitionTo(order.status, 'received') || canTransitionTo(order.status, 'partially_received');

  // Timeline events
  const timeline = [
    order.createdDate && { label: 'Created', date: order.createdDate, by: order.createdBy },
    order.submittedDate && { label: 'Submitted', date: order.submittedDate },
    order.approvedDate && { label: 'Approved', date: order.approvedDate, by: order.approvedBy },
    order.orderedDate && { label: 'Ordered', date: order.orderedDate },
    order.expectedDeliveryDate && { label: 'Expected Delivery', date: order.expectedDeliveryDate },
    order.receivedDate && { label: 'Received', date: order.receivedDate },
    order.paidDate && { label: 'Paid', date: order.paidDate },
  ].filter(Boolean) as { label: string; date: string; by?: string }[];

  const handleReceive = (data: Record<string, unknown>) => {
    console.log('Received:', data);
    setShowReceiving(false);
  };

  if (showReceiving) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/inventory/purchase-orders" className="inline-flex items-center gap-1 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to POs
        </Link>
        <ReceivingForm
          purchaseOrder={order}
          onSubmit={handleReceive as any}
          onCancel={() => setShowReceiving(false)}
        />
      </div>
    );
  }

  return (
    <DashboardErrorBoundary pageName="Purchase Order Detail">
      <div className="space-y-6">
        <Link href="/dashboard/inventory/purchase-orders" className="inline-flex items-center gap-1 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to POs
        </Link>

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-heading text-rani-navy">{order.poNumber}</h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body font-medium ${statusConfig.color} ${statusConfig.bgColor}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                  {statusConfig.label}
                </span>
                {order.priority !== 'routine' && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-body font-medium ${priorityConfig.color} ${priorityConfig.bgColor}`}>
                    {priorityConfig.label}
                  </span>
                )}
              </div>
              <p className="text-sm font-body text-rani-muted">{order.supplierName}</p>
              {order.trackingNumber && (
                <p className="text-xs font-body text-rani-muted mt-1">
                  Tracking: {order.trackingNumber}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {canReceive && (
                <button
                  onClick={() => setShowReceiving(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-body font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Receive Stock
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Line Items */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border overflow-hidden">
            <div className="p-4 sm:p-5 pb-0">
              <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-3">
                Line Items ({order.lineItems.length})
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-rani-border/40">
                  <th className="px-4 py-2 text-left text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Product</th>
                  <th className="px-4 py-2 text-center text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Ordered</th>
                  <th className="px-4 py-2 text-center text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Received</th>
                  <th className="px-4 py-2 text-right text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.lineItems.map((li) => {
                  const variance = getReceivingVariance(li);
                  return (
                    <tr key={li.id} className="border-b border-rani-border/10 last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-sm font-body font-medium text-rani-navy">{li.productName}</p>
                        <p className="text-[10px] font-body text-rani-muted">
                          {li.sku}
                          {li.lotNumber && ` | Lot: ${li.lotNumber}`}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-body text-rani-text">{li.quantityOrdered}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-body font-medium ${
                          variance.status === 'complete' ? 'text-emerald-600' :
                          variance.status === 'partial' ? 'text-amber-600' :
                          variance.status === 'pending' ? 'text-rani-muted' : 'text-blue-600'
                        }`}>
                          {li.quantityReceived}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-body font-medium text-rani-navy">
                        ${li.totalCost.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div className="p-4 sm:p-5 border-t border-rani-border/30 space-y-1.5">
              <div className="flex justify-between text-xs font-body text-rani-muted">
                <span>Subtotal</span><span>${order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs font-body text-emerald-600">
                  <span>Discount</span><span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.shippingCost > 0 && (
                <div className="flex justify-between text-xs font-body text-rani-muted">
                  <span>Shipping</span><span>${order.shippingCost}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-body font-bold text-rani-navy pt-1.5 border-t border-rani-border/20">
                <span>Total</span><span>${order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Timeline + Details sidebar */}
          <div className="space-y-4">
            {/* Timeline */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
              <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                Timeline
              </h3>
              <div className="space-y-3">
                {timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-rani-gold mt-1.5" />
                      {idx < timeline.length - 1 && <div className="w-px flex-1 bg-rani-border/30 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs font-body font-medium text-rani-navy">{event.label}</p>
                      <p className="text-[10px] font-body text-rani-muted">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {event.by && ` by ${event.by}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-2">
                  Notes
                </h3>
                <p className="text-xs font-body text-rani-text">{order.notes}</p>
              </div>
            )}

            {order.invoiceNumber && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-2">
                  Invoice
                </h3>
                <p className="text-xs font-body text-rani-text">{order.invoiceNumber}</p>
                {order.invoiceDate && (
                  <p className="text-[10px] font-body text-rani-muted mt-0.5">
                    {new Date(order.invoiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
