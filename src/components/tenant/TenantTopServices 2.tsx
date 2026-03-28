/**
 * Tenant Top Services Component
 */

'use client';

import type { TopService } from '@/lib/saas/tenant-dashboard/overview';

interface TenantTopServicesProps {
  services?: TopService[];
}

export function TenantTopServices({ services }: TenantTopServicesProps) {
  if (!services || services.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Services (MTD)</h3>
        <p className="text-sm text-gray-400">No service data available</p>
      </div>
    );
  }

  const maxRevenue = services[0]?.revenue || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Services (MTD)</h3>
      <div className="space-y-3">
        {services.slice(0, 8).map((service, i) => (
          <div key={service.name} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-900 truncate">{service.name}</span>
                <span className="text-sm font-semibold text-gray-900 ml-2">${service.revenue.toLocaleString()}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(service.revenue / maxRevenue) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-0.5 text-xs text-gray-400">
                <span>{service.count} treatments</span>
                <span>Avg: ${service.avgPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
