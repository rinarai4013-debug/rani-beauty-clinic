/**
 * Tenant Dashboard — Overview Page
 *
 * Revenue KPIs, appointment stats, new clients, top services,
 * provider performance, alerts, quick actions, and clinic health score.
 */

'use client';

import { useTenantDashboard, useTenantAlerts, useTenantHealthScore } from '@/hooks/useTenantDashboard';
import { TenantKPICard } from '@/components/tenant/TenantKPICard';
import { TenantAlertBanner } from '@/components/tenant/TenantAlertBanner';
import { TenantQuickActions } from '@/components/tenant/TenantQuickActions';
import { TenantHealthScore } from '@/components/tenant/TenantHealthScore';
import { TenantTopServices } from '@/components/tenant/TenantTopServices';
import { TenantProviderSummary } from '@/components/tenant/TenantProviderSummary';

export default function TenantOverviewPage() {
  const { data: overview, isLoading } = useTenantDashboard('/overview');
  const { data: alerts } = useTenantAlerts();
  const { data: health } = useTenantHealthScore();

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alerts && alerts.critical > 0 && (
        <TenantAlertBanner alerts={alerts} />
      )}

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TenantKPICard
          title="Today's Revenue"
          value={overview?.revenue?.today ?? 0}
          format="currency"
          change={overview?.revenue?.todayChange}
          subtitle="vs same day last week"
        />
        <TenantKPICard
          title="MTD Revenue"
          value={overview?.revenue?.mtd ?? 0}
          format="currency"
          change={overview?.revenue?.mtdChange}
          subtitle="vs prior month"
        />
        <TenantKPICard
          title="Appointments Today"
          value={overview?.appointments?.todayCount ?? 0}
          format="number"
          subtitle={`${overview?.appointments?.todayCompleted ?? 0} completed`}
        />
        <TenantKPICard
          title="New Clients (MTD)"
          value={overview?.newClients?.mtd ?? 0}
          format="number"
          subtitle={`${overview?.newClients?.conversionRate ?? 0}% conversion`}
        />
      </div>

      {/* Second Row: Utilization + Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TenantKPICard
            title="Utilization"
            value={overview?.appointments?.utilizationRate ?? 0}
            format="percent"
            subtitle="Provider schedule fill rate"
          />
          <TenantKPICard
            title="YTD Revenue"
            value={overview?.revenue?.ytd ?? 0}
            format="currency"
            subtitle="Year to date"
          />
          <TenantKPICard
            title="No-Shows"
            value={overview?.appointments?.todayNoShow ?? 0}
            format="number"
            subtitle="Today"
            alertThreshold={2}
          />
        </div>
        <TenantHealthScore score={health} />
      </div>

      {/* Quick Actions */}
      <TenantQuickActions actions={overview?.quickActions} />

      {/* Top Services + Provider Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TenantTopServices services={overview?.topServices} />
        <TenantProviderSummary providers={overview?.providers} />
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-xl border border-gray-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-gray-200" />
          ))}
        </div>
        <div className="h-28 bg-white rounded-xl border border-gray-200" />
      </div>
      <div className="h-24 bg-white rounded-xl border border-gray-200" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-white rounded-xl border border-gray-200" />
        <div className="h-64 bg-white rounded-xl border border-gray-200" />
      </div>
    </div>
  );
}
