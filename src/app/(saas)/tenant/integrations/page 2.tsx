/**
 * Tenant Dashboard — Integration Hub Page
 */

'use client';

import { useState } from 'react';
import { useTenantIntegrations } from '@/hooks/useTenantDashboard';
import type { IntegrationId } from '@/lib/saas/tenant-dashboard/integrations';

export default function TenantIntegrationsPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationId | null>(null);
  const [category, setCategory] = useState<string>('all');
  const { data: hub, isLoading } = useTenantIntegrations();

  const filtered = hub?.integrations?.filter(i => category === 'all' || i.category === category) ?? [];
  const categories = ['all', 'booking', 'payments', 'communication', 'marketing', 'analytics', 'automation'];

  if (isLoading) return <div className="animate-pulse space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-gray-200" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-500 mt-1">
            {hub?.connected ?? 0} of {hub?.total ?? 0} connected | Sync Health: {hub?.syncHealth ?? 0}%
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap capitalize transition-colors ${
              category === cat ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((integration) => (
          <div key={integration.id}
            className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
              integration.status === 'connected' ? 'border-green-200' : 'border-gray-200'
            } ${selectedIntegration === integration.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedIntegration(selectedIntegration === integration.id ? null : integration.id)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                  {integration.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{integration.name}</h3>
                  <span className="text-xs text-gray-400 capitalize">{integration.category}</span>
                </div>
              </div>
              <span className={`w-3 h-3 rounded-full ${
                integration.status === 'connected' ? 'bg-green-500' :
                integration.status === 'syncing' ? 'bg-blue-500 animate-pulse' :
                integration.status === 'error' ? 'bg-red-500' :
                'bg-gray-300'
              }`} />
            </div>
            <p className="text-xs text-gray-500 mb-3">{integration.description}</p>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                integration.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
              </span>
              {integration.status === 'connected' && integration.lastSync && (
                <span className="text-xs text-gray-400">Synced {new Date(integration.lastSync).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Integration Detail */}
      {selectedIntegration && (() => {
        const integration = hub?.integrations?.find(i => i.id === selectedIntegration);
        if (!integration) return null;
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{integration.name} Configuration</h3>
                <p className="text-sm text-gray-500 mt-1">{integration.description}</p>
              </div>
              <button className={`px-4 py-2 text-sm font-medium rounded-lg ${
                integration.status === 'connected'
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            {/* Config Fields */}
            <div className="space-y-4 mb-6">
              {integration.configFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type === 'password' ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {field.helpText && <p className="text-xs text-gray-400 mt-1">{field.helpText}</p>}
                </div>
              ))}
            </div>

            {/* Capabilities */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Capabilities</h4>
              <div className="flex flex-wrap gap-2">
                {integration.capabilities.map((cap) => (
                  <span key={cap} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{cap}</span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800">Save Configuration</button>
              <button className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50">Test Connection</button>
              {integration.status === 'connected' && (
                <button className="px-4 py-2 text-sm font-medium border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50">Sync Now</button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
