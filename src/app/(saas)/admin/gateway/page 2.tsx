'use client';

import { useState } from 'react';

interface GatewayMetrics {
  totalRequests: number;
  avgLatency: number;
  errorRate: number;
  cacheHitRate: number;
  activeCircuitBreakers: number;
  topPaths: { path: string; count: number }[];
}

const mockMetrics: GatewayMetrics = {
  totalRequests: 1_245_890,
  avgLatency: 42,
  errorRate: 0.3,
  cacheHitRate: 67.2,
  activeCircuitBreakers: 0,
  topPaths: [
    { path: '/v1/clients', count: 345_200 },
    { path: '/v1/appointments', count: 287_100 },
    { path: '/v1/ai/recommend', count: 156_700 },
    { path: '/v1/kpis', count: 134_500 },
    { path: '/v1/schedule', count: 98_300 },
    { path: '/v1/reviews', count: 76_200 },
    { path: '/v1/inventory', count: 52_100 },
    { path: '/v1/revenue', count: 45_800 },
  ],
};

const services = [
  { name: 'Airtable API', status: 'up' as const, latency: 120, circuitState: 'closed', errorRate: 0.1 },
  { name: 'Claude AI', status: 'up' as const, latency: 450, circuitState: 'closed', errorRate: 0.2 },
  { name: 'Mangomint', status: 'up' as const, latency: 200, circuitState: 'closed', errorRate: 0.0 },
  { name: 'Square POS', status: 'up' as const, latency: 180, circuitState: 'closed', errorRate: 0.1 },
  { name: 'Twilio SMS', status: 'up' as const, latency: 95, circuitState: 'closed', errorRate: 0.0 },
  { name: 'Resend Email', status: 'degraded' as const, latency: 2100, circuitState: 'half_open', errorRate: 5.2 },
  { name: 'Pinecone Vector DB', status: 'up' as const, latency: 35, circuitState: 'closed', errorRate: 0.0 },
];

export default function GatewayDashboard() {
  const [timeRange, setTimeRange] = useState('24h');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Gateway</h1>
          <p className="text-gray-500">Monitor and manage API traffic across all tenants</p>
        </div>
        <select
          value={timeRange}
          onChange={e => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Requests', value: mockMetrics.totalRequests.toLocaleString(), color: 'blue' },
          { label: 'Avg Latency', value: `${mockMetrics.avgLatency}ms`, color: 'green' },
          { label: 'Error Rate', value: `${mockMetrics.errorRate}%`, color: 'red' },
          { label: 'Cache Hit Rate', value: `${mockMetrics.cacheHitRate}%`, color: 'purple' },
          { label: 'Circuit Breakers', value: String(mockMetrics.activeCircuitBreakers), color: 'yellow' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Service Health */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Health</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="pb-3 font-medium">Service</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Latency</th>
                <th className="pb-3 font-medium">Circuit</th>
                <th className="pb-3 font-medium">Error Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map(s => (
                <tr key={s.name}>
                  <td className="py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      s.status === 'up' ? 'bg-green-50 text-green-700' :
                      s.status === 'degraded' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        s.status === 'up' ? 'bg-green-500' :
                        s.status === 'degraded' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">{s.latency}ms</td>
                  <td className="py-3">
                    <span className={`text-xs ${s.circuitState === 'closed' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {s.circuitState}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">{s.errorRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Endpoints */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Endpoints</h2>
        <div className="space-y-3">
          {mockMetrics.topPaths.map(p => {
            const pct = (p.count / mockMetrics.topPaths[0].count) * 100;
            return (
              <div key={p.path} className="flex items-center gap-4">
                <code className="text-sm font-mono text-gray-700 w-48 truncate">{p.path}</code>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-[#C9A96E] h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-24 text-right">{p.count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
