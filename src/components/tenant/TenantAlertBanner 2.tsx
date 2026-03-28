/**
 * Tenant Alert Banner Component
 */

'use client';

import type { AlertSummary } from '@/lib/saas/tenant-dashboard/overview';

interface TenantAlertBannerProps {
  alerts: AlertSummary;
}

export function TenantAlertBanner({ alerts }: TenantAlertBannerProps) {
  if (alerts.total === 0) return null;

  const severity = alerts.critical > 0 ? 'critical' : alerts.warning > 0 ? 'warning' : 'info';
  const colors = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[severity]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">
            {alerts.total} Active Alert{alerts.total !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2 text-xs">
            {alerts.critical > 0 && <span className="px-2 py-0.5 bg-red-100 rounded-full">{alerts.critical} critical</span>}
            {alerts.warning > 0 && <span className="px-2 py-0.5 bg-yellow-100 rounded-full">{alerts.warning} warning</span>}
            {alerts.noShows > 0 && <span className="px-2 py-0.5 bg-orange-100 rounded-full">{alerts.noShows} no-shows</span>}
            {alerts.churnRisks > 0 && <span className="px-2 py-0.5 bg-purple-100 rounded-full">{alerts.churnRisks} churn risks</span>}
          </div>
        </div>
        <a href="/tenant/ai" className="text-xs font-medium hover:underline">View All</a>
      </div>
      {alerts.recentAlerts.length > 0 && (
        <div className="mt-3 space-y-1">
          {alerts.recentAlerts.slice(0, 3).map((alert) => (
            <div key={alert.id} className="text-xs flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
              <span>{alert.title}: {alert.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
