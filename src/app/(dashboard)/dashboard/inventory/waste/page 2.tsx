'use client';

import { DashboardErrorBoundary } from '@/components/dashboard/shared';
import WasteLog from '@/components/dashboard/inventory/WasteLog';

/* ─── Waste Tracking Page ─────────────────────────────────────────────
 *  Waste tracking and analysis with categorization and cost impact.
 * ──────────────────────────────────────────────────────────────────── */

export default function WastePage() {
  return (
    <DashboardErrorBoundary pageName="Waste Tracking">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Waste Tracking</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Track expired, damaged, and returned products to minimize losses
          </p>
        </div>

        <WasteLog onLogWaste={() => console.log('Open waste logging form')} />
      </div>
    </DashboardErrorBoundary>
  );
}
