'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package, AlertTriangle, ShoppingCart, TrendingDown,
  Clock, DollarSign, Beaker, BarChart3,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import StatCard, { StatCardRow } from '@/components/dashboard/shared/StatCard';
import { DashboardErrorBoundary } from '@/components/dashboard/shared';
import ReorderAlerts from '@/components/dashboard/inventory/ReorderAlerts';
import ExpiryTracker from '@/components/dashboard/inventory/ExpiryTracker';
import BudExpiryWarning from '@/components/dashboard/inventory/BudExpiryWarning';
import {
  products, getTotalInventoryValue, getReorderCount,
  getStockStatus, CATEGORY_LABELS, CATEGORY_COLORS,
  type ProductCategory,
} from '@/data/inventory/products';
import { samplePurchaseOrders } from '@/data/inventory/purchase-orders';

/* ─── Inventory Overview ──────────────────────────────────────────────
 *  Dashboard overview: stock summary KPIs, category breakdown,
 *  expiry alerts, reorder queue, and recent activity.
 * ──────────────────────────────────────────────────────────────────── */

export default function InventoryOverviewPage() {
  const totalValue = getTotalInventoryValue();
  const reorderCount = getReorderCount();
  const activeProducts = products.filter((p) => p.active);
  const outOfStock = activeProducts.filter((p) => getStockStatus(p) === 'out').length;
  const lowStock = activeProducts.filter((p) => getStockStatus(p) === 'low' || getStockStatus(p) === 'critical').length;
  const pendingPOs = samplePurchaseOrders.filter((po) => !['received', 'paid', 'cancelled'].includes(po.status)).length;
  const pendingPOValue = samplePurchaseOrders
    .filter((po) => !['received', 'paid', 'cancelled'].includes(po.status))
    .reduce((s, po) => s + po.total, 0);

  // Category summary
  const categoryStats = Object.entries(CATEGORY_LABELS).map(([key, label]) => {
    const catProducts = activeProducts.filter((p) => p.category === key);
    const totalCost = catProducts.reduce((s, p) => s + p.currentStock * p.unitCost, 0);
    const lowCount = catProducts.filter((p) => {
      const s = getStockStatus(p);
      return s === 'low' || s === 'critical' || s === 'out';
    }).length;
    return {
      key: key as ProductCategory,
      label,
      count: catProducts.length,
      value: totalCost,
      lowCount,
      color: CATEGORY_COLORS[key as ProductCategory],
    };
  });

  // Quick links
  const navLinks = [
    { label: 'Product Catalog', href: '/dashboard/inventory/products', icon: Package, count: activeProducts.length },
    { label: 'Purchase Orders', href: '/dashboard/inventory/purchase-orders', icon: ShoppingCart, count: pendingPOs },
    { label: 'Waste Tracking', href: '/dashboard/inventory/waste', icon: TrendingDown },
    { label: 'Suppliers', href: '/dashboard/inventory/suppliers', icon: Package },
    { label: 'Analytics', href: '/dashboard/inventory/analytics', icon: BarChart3 },
  ];

  return (
    <DashboardErrorBoundary pageName="Inventory Management">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Inventory Management</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Track stock levels, manage orders, and optimize costs
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/inventory/purchase-orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-rani-navy text-white hover:bg-rani-navy/90 transition-all"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              New PO
            </Link>
          </div>
        </div>

        {/* KPI Row */}
        <StatCardRow columns={4}>
          <StatCard
            title="Inventory Value"
            value={totalValue}
            format="currency"
            icon="package"
            trend={{ value: 3.2, direction: 'up', label: 'vs last month' }}
          />
          <StatCard
            title="Reorder Needed"
            value={reorderCount}
            format="number"
            icon={AlertTriangle}
            trend={reorderCount > 3 ? { value: reorderCount, direction: 'up', upIsGood: false } : undefined}
            footer={
              lowStock > 0 ? (
                <span className="text-[10px] font-body text-amber-600">{lowStock} low, {outOfStock} out of stock</span>
              ) : undefined
            }
          />
          <StatCard
            title="Pending POs"
            value={pendingPOs}
            format="number"
            icon="cart"
            footer={
              <span className="text-[10px] font-body text-rani-muted">${pendingPOValue.toLocaleString()} on order</span>
            }
          />
          <StatCard
            title="Active Products"
            value={activeProducts.length}
            format="number"
            icon="package"
            footer={
              <span className="text-[10px] font-body text-rani-muted">{categoryStats.length} categories</span>
            }
          />
        </StatCardRow>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-rani-border hover:border-rani-gold/30 hover:shadow-sm transition-all group"
            >
              <link.icon className="w-4 h-4 text-rani-gold" />
              <span className="text-xs font-body font-medium text-rani-navy group-hover:text-rani-gold transition-colors">
                {link.label}
              </span>
              {link.count !== undefined && (
                <span className="ml-auto text-[10px] font-body text-rani-muted bg-rani-cream px-1.5 py-0.5 rounded">
                  {link.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Stock by Category
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {categoryStats.filter((c) => c.count > 0).map((cat) => (
              <Link
                key={cat.key}
                href={`/dashboard/inventory/products?category=${cat.key}`}
                className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/20 hover:border-rani-gold/30 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs font-body font-medium text-rani-navy">{cat.label}</span>
                </div>
                <p className="text-lg font-body font-bold text-rani-navy">{cat.count}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-body text-rani-muted">${cat.value.toLocaleString()}</span>
                  {cat.lowCount > 0 && (
                    <span className="text-[10px] font-body text-amber-600">{cat.lowCount} low</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ReorderAlerts />
          <BudExpiryWarning />
        </div>

        <ExpiryTracker />
      </div>
    </DashboardErrorBoundary>
  );
}
