'use client';

import { DashboardErrorBoundary } from '@/components/dashboard/shared';
import UsageAnalytics from '@/components/dashboard/inventory/UsageAnalytics';
import CostAnalysis from '@/components/dashboard/inventory/CostAnalysis';

/* ─── Analytics Page ──────────────────────────────────────────────────
 *  Cost analysis, usage trends, and optimization recommendations.
 * ──────────────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  return (
    <DashboardErrorBoundary pageName="Inventory Analytics">
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Inventory Analytics</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Usage trends, cost analysis, and optimization insights
          </p>
        </div>

        <UsageAnalytics />
        <CostAnalysis />
      </div>
    </DashboardErrorBoundary>
  );
}
