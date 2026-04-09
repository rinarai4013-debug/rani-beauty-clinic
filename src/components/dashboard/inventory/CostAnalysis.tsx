'use client';

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import ChartWrapper from '@/components/dashboard/shared/ChartWrapper';
import { products, CATEGORY_LABELS, CATEGORY_COLORS, type ProductCategory } from '@/data/inventory/products';

/* ─── CostAnalysis ────────────────────────────────────────────────────
 *  Product cost trends, margin analysis, and bulk discount calculator.
 * ──────────────────────────────────────────────────────────────────── */

const costTrendData = [
  { month: 'Oct', botox: 396, dysport: 460, sema: 120, filler: 225 },
  { month: 'Nov', botox: 396, dysport: 460, sema: 118, filler: 225 },
  { month: 'Dec', botox: 400, dysport: 465, sema: 115, filler: 228 },
  { month: 'Jan', botox: 400, dysport: 462, sema: 120, filler: 230 },
  { month: 'Feb', botox: 396, dysport: 460, sema: 122, filler: 225 },
  { month: 'Mar', botox: 396, dysport: 460, sema: 120, filler: 225 },
];

const marginByCategory = [
  { category: 'Neurotoxins', cost: 8200, revenue: 26500, margin: 69 },
  { category: 'Fillers', cost: 6400, revenue: 18900, margin: 66 },
  { category: 'GLP-1', cost: 4800, revenue: 14200, margin: 66 },
  { category: 'Vitamins', cost: 1200, revenue: 4800, margin: 75 },
  { category: 'Skincare', cost: 1800, revenue: 5200, margin: 65 },
  { category: 'Peels', cost: 900, revenue: 4200, margin: 79 },
];

interface CostAnalysisProps {
  loading?: boolean;
}

export default function CostAnalysis({ loading = false }: CostAnalysisProps) {
  const [bulkQty, setBulkQty] = useState(10);
  const [bulkProduct, setBulkProduct] = useState('ntx-001');

  const selectedProduct = products.find((p) => p.id === bulkProduct);
  const regularCost = selectedProduct ? selectedProduct.unitCost * bulkQty : 0;
  const bulkDiscount = bulkQty >= 20 ? 0.08 : bulkQty >= 10 ? 0.05 : 0;
  const discountedCost = regularCost * (1 - bulkDiscount);
  const savings = regularCost - discountedCost;

  // Inventory value by category
  const categoryValues = Object.keys(CATEGORY_LABELS).map((cat) => {
    const catProducts = products.filter((p) => p.category === cat && p.active);
    const totalCost = catProducts.reduce((s, p) => s + p.currentStock * p.unitCost, 0);
    return {
      category: CATEGORY_LABELS[cat as ProductCategory],
      value: totalCost,
      color: CATEGORY_COLORS[cat as ProductCategory],
    };
  }).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);

  const totalInventoryValue = categoryValues.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cost Trends */}
      <ChartWrapper
        title="Unit Cost Trends"
        subtitle="Track price changes across key products"
        chartType="line"
        height="h-56 sm:h-64"
        loading={loading}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={costTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E0DC" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B8680' }} />
            <YAxis tick={{ fontSize: 11, fill: '#8B8680' }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E0DC', borderRadius: '8px', fontSize: 11 }}
              formatter={(value, name) => {
                const amount = typeof value === 'number' ? value : Number(value ?? 0);
                const label = typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : String(name ?? '');
                return [`$${amount}`, label];
              }}
            />
            <Line type="monotone" dataKey="botox" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} name="Botox/100U" />
            <Line type="monotone" dataKey="dysport" stroke="#EC4899" strokeWidth={2} dot={{ r: 3 }} name="Dysport/300U" />
            <Line type="monotone" dataKey="sema" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="Semaglutide" />
            <Line type="monotone" dataKey="filler" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Filler/syr" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Margin Analysis */}
        <ChartWrapper
          title="Margin by Category"
          subtitle="Revenue vs product cost"
          chartType="bar"
          height="h-56 sm:h-64"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marginByCategory} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E0DC" />
              <XAxis dataKey="category" tick={{ fontSize: 9, fill: '#8B8680' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8B8680' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E0DC', borderRadius: '8px', fontSize: 11 }}
                formatter={(value, name) => {
                  const amount = typeof value === 'number' ? value : Number(value ?? 0);
                  const label = name === 'cost' ? 'Product Cost' : 'Revenue';
                  return [`$${amount.toLocaleString()}`, label];
                }}
              />
              <Bar dataKey="revenue" fill="#C9A96E" radius={[2, 2, 0, 0]} name="Revenue" />
              <Bar dataKey="cost" fill="#0F1D2C" radius={[2, 2, 0, 0]} name="Product Cost" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Bulk Discount Calculator */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Bulk Discount Calculator
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1">
                Product
              </label>
              <select
                value={bulkProduct}
                onChange={(e) => setBulkProduct(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-rani-cream/60 border border-rani-border/50 text-xs font-body text-rani-navy focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
              >
                {products.filter((p) => p.active && p.retailPrice > 0).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (${p.unitCost})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={bulkQty}
                onChange={(e) => setBulkQty(parseInt(e.target.value) || 1)}
                className="w-full h-9 px-3 rounded-lg bg-rani-cream/60 border border-rani-border/50 text-sm font-body text-rani-navy focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
              />
            </div>

            <div className="p-3 rounded-lg bg-rani-cream/40 space-y-1.5">
              <div className="flex justify-between text-xs font-body text-rani-muted">
                <span>Regular Cost</span>
                <span>${regularCost.toLocaleString()}</span>
              </div>
              {bulkDiscount > 0 && (
                <div className="flex justify-between text-xs font-body text-emerald-600">
                  <span>Bulk Discount ({(bulkDiscount * 100).toFixed(0)}%)</span>
                  <span>-${savings.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-body font-bold text-rani-navy pt-1 border-t border-rani-border/20">
                <span>Final Cost</span>
                <span>${discountedCost.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[10px] font-body text-rani-muted">
              Discounts: 5% on 10+ units, 8% on 20+ units. Contact supplier rep for custom volume pricing.
            </p>
          </div>
        </div>
      </div>

      {/* Inventory Value Breakdown */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
              Inventory Value by Category
            </h3>
            <p className="text-xs font-body text-rani-muted mt-0.5">
              Total: ${totalInventoryValue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {categoryValues.map((cat) => {
            const pct = (cat.value / totalInventoryValue) * 100;
            return (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-body text-rani-text">{cat.category}</span>
                  <span className="text-xs font-body font-medium text-rani-navy">
                    ${cat.value.toLocaleString()} ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-rani-cream rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
