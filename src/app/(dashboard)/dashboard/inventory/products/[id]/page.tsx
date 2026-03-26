'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Package, Thermometer, Clock, DollarSign,
  BarChart3, Truck, AlertTriangle, Pill, Hash,
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DashboardErrorBoundary } from '@/components/dashboard/shared';
import StatCard, { StatCardRow } from '@/components/dashboard/shared/StatCard';
import ChartWrapper from '@/components/dashboard/shared/ChartWrapper';
import StockLevelCard from '@/components/dashboard/inventory/StockLevelCard';
import {
  getProductById, getStockStatus, STOCK_STATUS_CONFIG,
  CATEGORY_LABELS, CATEGORY_COLORS, STORAGE_LABELS,
} from '@/data/inventory/products';
import { getSupplierById } from '@/data/inventory/suppliers';

/* ─── Product Detail Page ─────────────────────────────────────────────
 *  Single product: stock history, usage chart, cost history,
 *  suppliers, and lot tracking.
 * ──────────────────────────────────────────────────────────────────── */

// Sample historical data
function generateHistory() {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  return months.map((month, i) => ({
    month,
    stock: Math.floor(Math.random() * 15 + 5),
    usage: Math.floor(Math.random() * 10 + 3),
    cost: Math.floor(Math.random() * 50 + 350),
  }));
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const product = getProductById(productId);
  const history = useMemo(() => generateHistory(), []);

  if (!product) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/inventory/products" className="inline-flex items-center gap-1 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-10 text-center">
          <Package className="w-10 h-10 text-rani-muted/30 mx-auto mb-3" />
          <p className="text-sm font-body font-medium text-rani-navy">Product not found</p>
        </div>
      </div>
    );
  }

  const status = getStockStatus(product);
  const statusConfig = STOCK_STATUS_CONFIG[status];
  const supplier = getSupplierById(product.supplier);
  const inventoryValue = product.currentStock * product.unitCost;
  const retailValue = product.retailPrice > 0 ? product.currentStock * product.retailPrice : 0;
  const margin = product.retailPrice > 0 ? ((product.retailPrice - product.unitCost) / product.retailPrice * 100) : 0;

  return (
    <DashboardErrorBoundary pageName="Product Detail">
      <div className="space-y-6">
        {/* Back nav */}
        <Link
          href="/dashboard/inventory/products"
          className="inline-flex items-center gap-1 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>

        {/* Product header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[product.category] }}
                />
                <span className="text-xs font-body text-rani-muted uppercase tracking-wider">
                  {CATEGORY_LABELS[product.category]}
                </span>
                {product.requiresRx && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-body font-medium bg-purple-50 text-purple-700">
                    <Pill className="w-3 h-3" /> Rx Required
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">{product.name}</h1>
              <p className="text-sm font-body text-rani-muted mt-1">{product.description}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-body text-rani-muted">
                <span className="inline-flex items-center gap-1"><Hash className="w-3 h-3" /> {product.sku}</span>
                <span className="inline-flex items-center gap-1"><Thermometer className="w-3 h-3" /> {STORAGE_LABELS[product.storageTemp]}</span>
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {product.expirationMonths}mo shelf life</span>
                {product.budHours && (
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {product.budHours}hr BUD</span>
                )}
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body font-semibold ${statusConfig.color} ${statusConfig.bgColor}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* KPIs */}
        <StatCardRow columns={4}>
          <StatCard title="Current Stock" value={product.currentStock} format="number" icon="package" />
          <StatCard title="Inventory Value" value={inventoryValue} format="currency" icon="dollar" />
          <StatCard title="Unit Cost" value={product.unitCost} format="currency" icon="dollar" />
          {product.retailPrice > 0 ? (
            <StatCard title="Margin" value={margin} format="percent" icon="target" />
          ) : (
            <StatCard title="Par Level" value={product.parLevel} format="number" icon="target" />
          )}
        </StatCardRow>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Stock History */}
          <ChartWrapper
            title="Stock History"
            subtitle="Units on hand over time"
            chartType="line"
            height="h-48"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E0DC" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B8680' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8B8680' }} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E0DC', borderRadius: '8px', fontSize: 11 }} />
                <Line type="monotone" dataKey="stock" stroke="#C9A96E" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* Usage Chart */}
          <ChartWrapper
            title="Monthly Usage"
            subtitle="Units consumed per month"
            chartType="bar"
            height="h-48"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E0DC" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B8680' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8B8680' }} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E0DC', borderRadius: '8px', fontSize: 11 }} />
                <Line type="monotone" dataKey="usage" stroke="#0F1D2C" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Stock info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Stock Details
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Current Stock', value: `${product.currentStock} ${product.unit}s` },
                { label: 'Par Level', value: `${product.parLevel} ${product.unit}s` },
                { label: 'Reorder Point', value: `${product.reorderPoint} ${product.unit}s` },
                { label: 'Units per Case', value: String(product.unitsPerCase) },
                { label: 'Unit Cost', value: `$${product.unitCost.toFixed(2)}` },
                { label: 'Retail Price', value: product.retailPrice > 0 ? `$${product.retailPrice.toFixed(2)}` : 'N/A (operational)' },
                { label: 'Case Cost', value: `$${(product.unitCost * product.unitsPerCase).toFixed(2)}` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-rani-border/10 last:border-0">
                  <span className="text-xs font-body text-rani-muted">{row.label}</span>
                  <span className="text-xs font-body font-medium text-rani-navy">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier info */}
          {supplier && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
              <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                Supplier
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Supplier', value: supplier.name },
                  { label: 'Contact', value: supplier.contactName },
                  { label: 'Lead Time', value: `${supplier.leadTimeDays} days` },
                  { label: 'Min Order', value: `$${supplier.minimumOrderAmount}` },
                  { label: 'Payment Terms', value: supplier.paymentTerms },
                  { label: 'On-Time Rate', value: `${supplier.onTimeDeliveryRate}%` },
                  { label: 'Quality Score', value: `${supplier.qualityScore}/5.0` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-rani-border/10 last:border-0">
                    <span className="text-xs font-body text-rani-muted">{row.label}</span>
                    <span className="text-xs font-body font-medium text-rani-navy">{row.value}</span>
                  </div>
                ))}
              </div>
              {supplier.portalUrl && (
                <a
                  href={supplier.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-body font-medium text-rani-gold hover:text-rani-gold/80 transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" /> Order Portal
                </a>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        {product.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-body font-semibold text-amber-800">Handling Notes</p>
                <p className="text-xs font-body text-amber-700 mt-0.5">{product.notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
