'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardErrorBoundary } from '@/components/dashboard/shared';
import ProductCatalog from '@/components/dashboard/inventory/ProductCatalog';
import type { Product } from '@/data/inventory/products';

/* ─── Products Page ───────────────────────────────────────────────────
 *  Full product catalog with CRUD capabilities.
 * ──────────────────────────────────────────────────────────────────── */

export default function ProductsPage() {
  const router = useRouter();

  const handleProductClick = (product: Product) => {
    router.push(`/dashboard/inventory/products/${product.id}`);
  };

  return (
    <DashboardErrorBoundary pageName="Product Catalog">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Product Catalog</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Manage all clinic products, stock levels, and pricing
          </p>
        </div>

        <ProductCatalog onProductClick={handleProductClick} />
      </div>
    </DashboardErrorBoundary>
  );
}
