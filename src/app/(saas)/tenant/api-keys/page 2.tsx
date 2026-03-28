'use client';

import { useState } from 'react';

const mockKeys = [
  { id: 'key_1', name: 'Production API Key', prefix: 'rani_live_glow...', environment: 'live', status: 'active', scopes: ['clients:read', 'appointments:read', 'ai:use'], lastUsed: '2 hours ago', usageCount: 45230, createdAt: '2025-10-15' },
  { id: 'key_2', name: 'Webhook Integration', prefix: 'rani_live_glow...', environment: 'live', status: 'active', scopes: ['webhooks:read', 'webhooks:write', 'clients:read'], lastUsed: '5 min ago', usageCount: 12890, createdAt: '2025-11-01' },
  { id: 'key_3', name: 'Testing Key', prefix: 'rani_test_glow...', environment: 'test', status: 'active', scopes: ['clients:read', 'clients:write', 'appointments:read', 'appointments:write'], lastUsed: '3 days ago', usageCount: 890, createdAt: '2026-01-15' },
  { id: 'key_4', name: 'Old Integration', prefix: 'rani_live_glow...', environment: 'live', status: 'revoked', scopes: ['clients:read'], lastUsed: 'Never', usageCount: 0, createdAt: '2025-09-01' },
];

const SCOPES = [
  'clients:read', 'clients:write', 'appointments:read', 'appointments:write',
  'analytics:read', 'ai:use', 'templates:read', 'templates:write',
  'webhooks:read', 'webhooks:write', 'inventory:read', 'reviews:read',
  'schedule:read', 'billing:read',
];

export default function TenantApiKeys() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500">Manage your API keys for programmatic access</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-[#0F1D2C] text-white rounded-lg text-sm font-medium hover:bg-[#1a2d3d]"
        >
          Create API Key
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New API Key</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
              <input type="text" placeholder="e.g., Production API Key" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="env" defaultChecked /> Live</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="env" /> Test</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scopes</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SCOPES.map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" /> {s}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IP Allowlist (optional)</label>
              <input type="text" placeholder="Comma-separated IPs" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button className="px-4 py-2 bg-[#C9A96E] text-white rounded-lg text-sm font-medium">Generate Key</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {mockKeys.map(k => (
          <div key={k.id} className={`bg-white rounded-xl border p-5 ${k.status === 'revoked' ? 'border-gray-200 opacity-60' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{k.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    k.environment === 'live' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>{k.environment}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    k.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>{k.status}</span>
                </div>
                <code className="text-sm text-gray-500 font-mono mt-1 block">{k.prefix}</code>
              </div>
              {k.status === 'active' && (
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">Rotate</button>
                  <button className="px-3 py-1.5 border border-red-200 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50">Revoke</button>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <span>Last used: {k.lastUsed}</span>
              <span>{k.usageCount.toLocaleString()} requests</span>
              <span>Created: {k.createdAt}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {k.scopes.map(s => (
                <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
