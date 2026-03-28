'use client';

import { useState } from 'react';
import { DashboardErrorBoundary } from '@/components/dashboard/shared';
import SupplierScorecard from '@/components/dashboard/inventory/SupplierScorecard';

/* ─── Suppliers Page ──────────────────────────────────────────────────
 *  Supplier management and performance scorecards.
 * ──────────────────────────────────────────────────────────────────── */

export default function SuppliersPage() {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  return (
    <DashboardErrorBoundary pageName="Supplier Management">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Supplier Management</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Performance scorecards, contact info, and order history
          </p>
        </div>

        <SupplierScorecard
          selectedSupplierId={selectedId}
          onSupplierSelect={setSelectedId}
        />
      </div>
    </DashboardErrorBoundary>
  );
}
