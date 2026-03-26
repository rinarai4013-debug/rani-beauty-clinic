'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Package, CheckCircle, AlertTriangle, ClipboardCheck, Hash, Calendar,
} from 'lucide-react';
import type { PurchaseOrder, POLineItem } from '@/data/inventory/purchase-orders';
import { getReceivingVariance } from '@/data/inventory/purchase-orders';

/* ─── ReceivingForm ───────────────────────────────────────────────────
 *  Receive stock against a PO: lot number entry, expiry date capture,
 *  and variance flagging.
 * ──────────────────────────────────────────────────────────────────── */

interface ReceivingLineEntry {
  lineItemId: string;
  quantityReceived: number;
  lotNumber: string;
  expirationDate: string;
  notes: string;
  damaged: number;
}

interface ReceivingFormProps {
  purchaseOrder: PurchaseOrder;
  onSubmit?: (data: {
    poId: string;
    entries: ReceivingLineEntry[];
    receivedDate: string;
    notes: string;
  }) => void;
  onCancel?: () => void;
}

export default function ReceivingForm({ purchaseOrder, onSubmit, onCancel }: ReceivingFormProps) {
  const [entries, setEntries] = useState<ReceivingLineEntry[]>(
    purchaseOrder.lineItems.map((li) => ({
      lineItemId: li.id,
      quantityReceived: li.quantityOrdered,
      lotNumber: '',
      expirationDate: '',
      notes: '',
      damaged: 0,
    }))
  );
  const [notes, setNotes] = useState('');

  const updateEntry = useCallback((id: string, field: keyof ReceivingLineEntry, value: string | number) => {
    setEntries((prev) =>
      prev.map((e) => e.lineItemId === id ? { ...e, [field]: value } : e)
    );
  }, []);

  const hasVariances = entries.some((e, i) => {
    const li = purchaseOrder.lineItems[i];
    return e.quantityReceived !== li.quantityOrdered || e.damaged > 0;
  });

  const allLotsEntered = entries.every((e) => e.lotNumber.trim() !== '');

  const handleSubmit = () => {
    onSubmit?.({
      poId: purchaseOrder.id,
      entries,
      receivedDate: new Date().toISOString().split('T')[0],
      notes,
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            Receive Stock
          </h3>
          <p className="text-xs font-body text-rani-muted mt-0.5">
            {purchaseOrder.poNumber} from {purchaseOrder.supplierName}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rani-cream text-xs font-body text-rani-navy">
          <ClipboardCheck className="w-3.5 h-3.5" />
          {purchaseOrder.lineItems.length} items
        </span>
      </div>

      {/* Line items */}
      <div className="space-y-3">
        {purchaseOrder.lineItems.map((li, idx) => {
          const entry = entries[idx];
          const variance = entry.quantityReceived - li.quantityOrdered;
          const hasIssue = variance !== 0 || entry.damaged > 0;

          return (
            <motion.div
              key={li.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-3 sm:p-4 rounded-lg border ${
                hasIssue ? 'border-amber-200 bg-amber-50/50' : 'border-rani-border/30 bg-rani-cream/10'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-body font-medium text-rani-navy">{li.productName}</p>
                  <p className="text-[10px] font-body text-rani-muted">{li.sku} | Ordered: {li.quantityOrdered}</p>
                </div>
                {hasIssue && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-body font-medium text-amber-700 bg-amber-100">
                    <AlertTriangle className="w-3 h-3" />
                    Variance
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div>
                  <label className="block text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1">
                    Qty Received
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={entry.quantityReceived}
                    onChange={(e) => updateEntry(li.id, 'quantityReceived', parseInt(e.target.value) || 0)}
                    className={`w-full h-9 px-2.5 rounded-md border text-sm font-body text-rani-navy focus:outline-none focus:ring-2 focus:ring-rani-gold/30 ${
                      variance !== 0 ? 'border-amber-300 bg-amber-50' : 'border-rani-border/50 bg-white'
                    }`}
                  />
                  {variance !== 0 && (
                    <p className={`text-[10px] font-body mt-0.5 ${variance > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {variance > 0 ? `+${variance} over` : `${Math.abs(variance)} short`}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1">
                    <Hash className="w-3 h-3 inline mr-0.5" />Lot #
                  </label>
                  <input
                    type="text"
                    value={entry.lotNumber}
                    onChange={(e) => updateEntry(li.id, 'lotNumber', e.target.value)}
                    placeholder="L2026..."
                    className="w-full h-9 px-2.5 rounded-md border border-rani-border/50 bg-white text-sm font-body text-rani-navy placeholder:text-rani-muted/40 focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1">
                    <Calendar className="w-3 h-3 inline mr-0.5" />Expiry Date
                  </label>
                  <input
                    type="date"
                    value={entry.expirationDate}
                    onChange={(e) => updateEntry(li.id, 'expirationDate', e.target.value)}
                    className="w-full h-9 px-2.5 rounded-md border border-rani-border/50 bg-white text-sm font-body text-rani-navy focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1">
                    Damaged
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={entry.damaged}
                    onChange={(e) => updateEntry(li.id, 'damaged', parseInt(e.target.value) || 0)}
                    className={`w-full h-9 px-2.5 rounded-md border text-sm font-body text-rani-navy focus:outline-none focus:ring-2 focus:ring-rani-gold/30 ${
                      entry.damaged > 0 ? 'border-red-300 bg-red-50' : 'border-rani-border/50 bg-white'
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1.5">
          Receiving Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Note any issues, discrepancies, or observations..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-rani-cream/60 border border-rani-border/50 text-sm font-body text-rani-navy placeholder:text-rani-muted/50 focus:outline-none focus:ring-2 focus:ring-rani-gold/30 resize-none"
        />
      </div>

      {/* Variance warning */}
      {hasVariances && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-body font-medium text-amber-800">Variances Detected</p>
            <p className="text-[10px] font-body text-amber-700 mt-0.5">
              One or more items have quantity differences or damage. These will be flagged for review.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!allLotsEntered}
          className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-body font-medium hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Confirm Receipt
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="h-10 px-4 rounded-lg border border-rani-border text-sm font-body font-medium text-rani-muted hover:text-rani-navy hover:bg-rani-cream transition-all"
          >
            Cancel
          </button>
        )}
      </div>

      {!allLotsEntered && (
        <p className="text-[10px] font-body text-rani-muted text-center">
          Enter lot numbers for all items to confirm receipt
        </p>
      )}
    </div>
  );
}
