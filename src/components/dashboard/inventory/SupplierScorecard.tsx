'use client';

import { motion } from 'framer-motion';
import {
  Truck, Star, Clock, DollarSign, CheckCircle, Phone, Mail, Globe,
} from 'lucide-react';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { suppliers, calculateSupplierScore, type Supplier } from '@/data/inventory/suppliers';
import { products, getProductsBySupplier } from '@/data/inventory/products';

/* ─── SupplierScorecard ───────────────────────────────────────────────
 *  On-time delivery, price consistency, and quality metrics
 *  per supplier with overall score.
 * ──────────────────────────────────────────────────────────────────── */

interface SupplierScorecardProps {
  supplierList?: Supplier[];
  selectedSupplierId?: string;
  onSupplierSelect?: (id: string) => void;
  loading?: boolean;
}

function ScoreGrade({ score }: { score: number }) {
  const color = score >= 90 ? 'text-emerald-600' : score >= 75 ? 'text-blue-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';
  const bg = score >= 90 ? 'bg-emerald-50' : score >= 75 ? 'bg-blue-50' : score >= 60 ? 'bg-amber-50' : 'bg-red-50';
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B+' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-body font-bold ${color} ${bg}`}>
      {grade}
    </span>
  );
}

export default function SupplierScorecard({
  supplierList = suppliers.filter((s) => s.active),
  selectedSupplierId,
  onSupplierSelect,
  loading = false,
}: SupplierScorecardProps) {
  const selectedSupplier = selectedSupplierId
    ? supplierList.find((s) => s.id === selectedSupplierId) || null
    : null;

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-rani-border rounded w-36" />
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-rani-border rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Supplier list */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
          Supplier Scorecards
        </h3>

        <div className="space-y-2">
          {supplierList.map((supplier, idx) => {
            const score = calculateSupplierScore(supplier);
            const productCount = getProductsBySupplier(supplier.id).length;
            const isSelected = selectedSupplierId === supplier.id;

            return (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onSupplierSelect?.(supplier.id)}
                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-all
                  ${onSupplierSelect ? 'cursor-pointer' : ''}
                  ${isSelected
                    ? 'border-rani-gold/50 bg-rani-gold/5 shadow-sm'
                    : 'border-rani-border/30 bg-rani-cream/10 hover:bg-rani-cream/30'
                  }
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ScoreGrade score={score} />
                  <div className="min-w-0">
                    <p className="text-sm font-body font-medium text-rani-navy truncate">
                      {supplier.shortName}
                    </p>
                    <p className="text-[10px] font-body text-rani-muted">
                      {productCount} products | {supplier.leadTimeDays}d lead time
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-body font-medium text-rani-navy">{supplier.onTimeDeliveryRate}%</p>
                    <p className="text-[10px] font-body text-rani-muted">on-time</p>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-rani-gold fill-rani-gold" />
                    <span className="text-xs font-body font-medium text-rani-navy ml-0.5">
                      {supplier.qualityScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected supplier detail */}
      {selectedSupplier && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-sm font-body font-semibold text-rani-navy">{selectedSupplier.name}</h4>
              <p className="text-xs font-body text-rani-muted">{selectedSupplier.category}</p>
            </div>
            <ScoreGrade score={calculateSupplierScore(selectedSupplier)} />
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'On-Time', value: `${selectedSupplier.onTimeDeliveryRate}%`, Icon: Truck },
              { label: 'Quality', value: `${selectedSupplier.qualityScore}/5`, Icon: Star },
              { label: 'Lead Time', value: `${selectedSupplier.leadTimeDays}d`, Icon: Clock },
              { label: 'Min Order', value: `$${selectedSupplier.minimumOrderAmount}`, Icon: DollarSign },
            ].map((metric) => (
              <div key={metric.label} className="rounded-lg bg-rani-cream/40 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <metric.Icon className="w-3 h-3 text-rani-gold" />
                  <span className="text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">
                    {metric.label}
                  </span>
                </div>
                <p className="text-sm font-body font-bold text-rani-navy">{metric.value}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="p-3 rounded-lg bg-rani-cream/20 border border-rani-border/20 space-y-1.5">
            <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Contact</p>
            <p className="text-xs font-body text-rani-navy">{selectedSupplier.contactName}</p>
            <div className="flex flex-wrap gap-3 text-[10px] font-body text-rani-muted">
              <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{selectedSupplier.contactEmail}</span>
              <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{selectedSupplier.contactPhone}</span>
            </div>
            <p className="text-[10px] font-body text-rani-muted">
              Terms: {selectedSupplier.paymentTerms} | Order via: {selectedSupplier.orderMethod}
              {selectedSupplier.autoReplenish && ' | Auto-replenish available'}
            </p>
          </div>

          {selectedSupplier.notes && (
            <p className="text-[10px] font-body text-rani-muted mt-2 italic">{selectedSupplier.notes}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
