'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardErrorBoundary } from '@/components/dashboard/shared';
import PurchaseOrderList from '@/components/dashboard/inventory/PurchaseOrderList';
import PurchaseOrderForm from '@/components/dashboard/inventory/PurchaseOrderForm';
import type { PurchaseOrder } from '@/data/inventory/purchase-orders';

/* ─── Purchase Orders Page ────────────────────────────────────────────
 *  PO list with create/edit functionality.
 * ──────────────────────────────────────────────────────────────────── */

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  const handleOrderClick = (order: PurchaseOrder) => {
    router.push(`/dashboard/inventory/purchase-orders/${order.id}`);
  };

  const handleSubmitPO = (data: Record<string, unknown>) => {
    // In production, this would call the API
    console.log('PO submitted:', data);
    setShowCreate(false);
  };

  return (
    <DashboardErrorBoundary pageName="Purchase Orders">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Purchase Orders</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Create, track, and manage purchase orders
          </p>
        </div>

        {showCreate ? (
          <PurchaseOrderForm
            onSubmit={handleSubmitPO as any}
            onCancel={() => setShowCreate(false)}
          />
        ) : (
          <PurchaseOrderList
            onOrderClick={handleOrderClick}
            onCreateNew={() => setShowCreate(true)}
          />
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
