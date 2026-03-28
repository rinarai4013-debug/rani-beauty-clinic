/**
 * Tenant Provider Summary Component
 */

'use client';

import type { ProviderSummary } from '@/lib/saas/tenant-dashboard/overview';

interface TenantProviderSummaryProps {
  providers?: ProviderSummary[];
}

export function TenantProviderSummary({ providers }: TenantProviderSummaryProps) {
  if (!providers || providers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Provider Performance (MTD)</h3>
        <p className="text-sm text-gray-400">No provider data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Provider Performance (MTD)</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-2">Provider</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-2">Revenue</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-2">Appts</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-2">Util</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-2">Rating</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-2">No-Show</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {providers.map((provider) => (
              <tr key={provider.name}>
                <td className="py-2.5 text-sm font-medium text-gray-900">{provider.name}</td>
                <td className="py-2.5 text-sm text-right text-gray-900">${provider.revenue.toLocaleString()}</td>
                <td className="py-2.5 text-sm text-right text-gray-600">{provider.appointments}</td>
                <td className="py-2.5 text-sm text-right">
                  <span className={`font-medium ${provider.utilization >= 70 ? 'text-green-600' : provider.utilization >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {provider.utilization}%
                  </span>
                </td>
                <td className="py-2.5 text-sm text-right text-gray-600">
                  {provider.avgRating > 0 ? `${provider.avgRating}/5` : '-'}
                </td>
                <td className="py-2.5 text-sm text-right">
                  <span className={`${provider.noShowRate > 10 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {provider.noShowRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
