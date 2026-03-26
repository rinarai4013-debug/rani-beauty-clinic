'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Package, Filter, Grid3X3, List,
  Thermometer, AlertTriangle, Pill, ChevronRight,
} from 'lucide-react';
import StockLevelCard from './StockLevelCard';
import type { Product, ProductCategory } from '@/data/inventory/products';
import {
  products as allProducts,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  getStockStatus,
  STOCK_STATUS_CONFIG,
  STORAGE_LABELS,
} from '@/data/inventory/products';

/* ─── ProductCatalog ──────────────────────────────────────────────────
 *  Searchable, filterable grid of products with category tabs,
 *  stock levels, and expiry warnings.
 * ──────────────────────────────────────────────────────────────────── */

interface ProductCatalogProps {
  products?: Product[];
  onProductClick?: (product: Product) => void;
  loading?: boolean;
}

const ALL_CATEGORIES: ('all' | ProductCategory)[] = [
  'all',
  'neurotoxins',
  'dermal_fillers',
  'vitamins_minerals',
  'peptides',
  'glp1_weight_loss',
  'skincare',
  'device_consumables',
  'supplies',
];

export default function ProductCatalog({ products = allProducts, onProductClick, loading = false }: ProductCatalogProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | ProductCategory>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.active);

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Stock filter
    if (stockFilter === 'low') {
      result = result.filter((p) => {
        const s = getStockStatus(p);
        return s === 'low' || s === 'critical' || s === 'out';
      });
    } else if (stockFilter === 'out') {
      result = result.filter((p) => getStockStatus(p) === 'out');
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, activeCategory, stockFilter, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.filter((p) => p.active).length };
    for (const cat of Object.keys(CATEGORY_LABELS)) {
      counts[cat] = products.filter((p) => p.active && p.category === cat).length;
    }
    return counts;
  }, [products]);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-rani-border rounded w-32" />
          <div className="h-10 bg-rani-border rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-rani-border rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
              Product Catalog
            </h3>
            <p className="text-xs font-body text-rani-muted mt-0.5">
              {filteredProducts.length} of {products.filter((p) => p.active).length} products
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Stock filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
              className="h-9 px-3 rounded-lg bg-rani-cream/60 border border-rani-border/50 text-xs font-body text-rani-navy focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
            >
              <option value="all">All Stock</option>
              <option value="low">Low / Critical</option>
              <option value="out">Out of Stock</option>
            </select>
            {/* View toggle */}
            <div className="flex gap-0.5 bg-rani-cream/80 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-rani-navy' : 'text-rani-muted'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-rani-navy' : 'text-rani-muted'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rani-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU, or description..."
            className="w-full h-10 pl-9 pr-9 rounded-lg bg-rani-cream/60 border border-rani-border/50 text-sm font-body text-rani-navy placeholder:text-rani-muted/50 focus:outline-none focus:ring-2 focus:ring-rani-gold/30 focus:border-rani-gold/50 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-rani-border/50 flex items-center justify-center hover:bg-rani-border transition-colors"
            >
              <X className="w-3 h-3 text-rani-muted" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium whitespace-nowrap transition-all
                ${activeCategory === cat
                  ? 'bg-rani-navy text-white shadow-sm'
                  : 'bg-rani-cream/60 text-rani-muted hover:text-rani-navy hover:bg-rani-cream'
                }
              `}
            >
              {cat === 'all' ? (
                <>All</>
              ) : (
                <>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                  />
                  {CATEGORY_LABELS[cat]}
                </>
              )}
              <span className={`ml-0.5 text-[10px] ${activeCategory === cat ? 'text-white/70' : 'text-rani-muted/50'}`}>
                {categoryCounts[cat] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-10 text-center">
          <Package className="w-10 h-10 text-rani-muted/30 mx-auto mb-3" />
          <p className="text-sm font-body font-medium text-rani-navy">No products found</p>
          <p className="text-xs font-body text-rani-muted mt-1">Try adjusting your filters or search term</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <StockLevelCard
                  product={product}
                  onClick={onProductClick ? () => onProductClick(product) : undefined}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List View */
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rani-border/40">
                <th className="px-4 py-3 text-left text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Product</th>
                <th className="px-4 py-3 text-left text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-center text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Stock</th>
                <th className="px-4 py-3 text-center text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted hidden lg:table-cell">Unit Cost</th>
                <th className="px-4 py-3 text-center text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted hidden lg:table-cell">Storage</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product);
                const statusConfig = STOCK_STATUS_CONFIG[status];
                return (
                  <tr
                    key={product.id}
                    onClick={onProductClick ? () => onProductClick(product) : undefined}
                    className={`border-b border-rani-border/10 last:border-0 transition-colors ${
                      onProductClick ? 'cursor-pointer hover:bg-rani-cream/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-body font-medium text-rani-navy">{product.name}</p>
                      <p className="text-[10px] font-body text-rani-muted">{product.sku}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-xs font-body text-rani-text">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[product.category] }}
                        />
                        {CATEGORY_LABELS[product.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-body font-medium text-rani-navy">
                        {product.currentStock}
                      </span>
                      <span className="text-[10px] font-body text-rani-muted"> / {product.parLevel}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${statusConfig.color} ${statusConfig.bgColor}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-sm font-body text-rani-text">${product.unitCost.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className="text-[10px] font-body text-rani-muted">
                        {product.storageTemp === 'refrigerated' ? '36-46°F' : product.storageTemp === 'frozen' ? '≤-4°F' : 'Room'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-rani-muted" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
