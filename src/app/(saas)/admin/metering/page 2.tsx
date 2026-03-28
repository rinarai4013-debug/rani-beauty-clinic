'use client';

import { useState } from 'react';

const mockTenantUsage = [
  { tenantId: 't_007', name: 'Zen Medspa', tier: 'enterprise', apiCalls: 892_340, aiTokens: 8_234_500, smsCount: 4_320, emailCount: 12_450, storageGb: 24.5, overageCost: 0 },
  { tenantId: 't_002', name: 'Radiance Aesthetics', tier: 'enterprise', apiCalls: 756_200, aiTokens: 6_890_000, smsCount: 3_100, emailCount: 9_870, storageGb: 18.2, overageCost: 0 },
  { tenantId: 't_004', name: 'Derma Elite Clinic', tier: 'pro', apiCalls: 89_450, aiTokens: 1_780_000, smsCount: 1_890, emailCount: 18_900, storageGb: 12.3, overageCost: 45.20 },
  { tenantId: 't_001', name: 'Glow Medical Spa', tier: 'pro', apiCalls: 67_800, aiTokens: 1_450_000, smsCount: 980, emailCount: 8_200, storageGb: 8.7, overageCost: 0 },
  { tenantId: 't_008', name: 'Aura Skin Clinic', tier: 'starter', apiCalls: 8_900, aiTokens: 420_000, smsCount: 340, emailCount: 2_100, storageGb: 2.1, overageCost: 12.50 },
  { tenantId: 't_003', name: 'Luxe Skin Studio', tier: 'starter', apiCalls: 3_200, aiTokens: 180_000, smsCount: 120, emailCount: 890, storageGb: 0.8, overageCost: 0 },
];

const platformTotals = {
  totalApiCalls: 1_817_890,
  totalAiTokens: 18_954_500,
  totalSms: 10_750,
  totalEmails: 52_410,
  totalStorageGb: 66.6,
  totalOverage: 57.70,
  totalMrr: 4_393,
};

export default function MeteringDashboard() {
  const [timeRange, setTimeRange] = useState('30d');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usage Metering</h1>
          <p className="text-gray-500">Track and monitor resource consumption across all tenants</p>
        </div>
        <select
          value={timeRange}
          onChange={e => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Platform Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'API Calls', value: platformTotals.totalApiCalls.toLocaleString() },
          { label: 'AI Tokens', value: `${(platformTotals.totalAiTokens / 1_000_000).toFixed(1)}M` },
          { label: 'SMS Sent', value: platformTotals.totalSms.toLocaleString() },
          { label: 'Emails Sent', value: platformTotals.totalEmails.toLocaleString() },
          { label: 'Storage Used', value: `${platformTotals.totalStorageGb.toFixed(1)} GB` },
          { label: 'Total MRR', value: `$${platformTotals.totalMrr.toLocaleString()}` },
          { label: 'Overage Revenue', value: `$${platformTotals.totalOverage.toFixed(2)}` },
          { label: 'Active Tenants', value: String(mockTenantUsage.length) },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tenant Usage Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tenant Usage (Current Billing Period)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="pb-3 font-medium">Tenant</th>
                <th className="pb-3 font-medium">Tier</th>
                <th className="pb-3 font-medium text-right">API Calls</th>
                <th className="pb-3 font-medium text-right">AI Tokens</th>
                <th className="pb-3 font-medium text-right">SMS</th>
                <th className="pb-3 font-medium text-right">Emails</th>
                <th className="pb-3 font-medium text-right">Storage</th>
                <th className="pb-3 font-medium text-right">Overage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockTenantUsage.map(t => (
                <tr key={t.tenantId}>
                  <td className="py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.tier === 'enterprise' ? 'bg-purple-50 text-purple-700' :
                      t.tier === 'pro' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {t.tier}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-600">{t.apiCalls.toLocaleString()}</td>
                  <td className="py-3 text-right text-gray-600">{(t.aiTokens / 1_000_000).toFixed(1)}M</td>
                  <td className="py-3 text-right text-gray-600">{t.smsCount.toLocaleString()}</td>
                  <td className="py-3 text-right text-gray-600">{t.emailCount.toLocaleString()}</td>
                  <td className="py-3 text-right text-gray-600">{t.storageGb.toFixed(1)} GB</td>
                  <td className="py-3 text-right">
                    {t.overageCost > 0 ? (
                      <span className="text-red-600 font-medium">${t.overageCost.toFixed(2)}</span>
                    ) : (
                      <span className="text-green-600">$0.00</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
