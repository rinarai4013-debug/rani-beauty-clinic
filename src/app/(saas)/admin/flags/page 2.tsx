'use client';

import { useState } from 'react';

const mockFlags = [
  { key: 'ai_intake_intelligence', name: 'AI Intake Intelligence', type: 'boolean', enabled: true, tags: ['ai', 'core'], tiers: { starter: true, pro: true, enterprise: true } },
  { key: 'ai_consult_copilot', name: 'AI Consult Co-Pilot', type: 'boolean', enabled: true, tags: ['ai', 'premium'], tiers: { starter: false, pro: true, enterprise: true } },
  { key: 'ai_phone_agent', name: 'AI Phone Agent', type: 'boolean', enabled: true, tags: ['ai', 'premium'], tiers: { starter: false, pro: false, enterprise: true } },
  { key: 'dynamic_pricing', name: 'Dynamic Pricing Engine', type: 'boolean', enabled: true, tags: ['analytics', 'premium'], tiers: { starter: false, pro: true, enterprise: true } },
  { key: 'white_label', name: 'White Label Branding', type: 'boolean', enabled: true, tags: ['branding', 'enterprise'], tiers: { starter: false, pro: false, enterprise: true } },
  { key: 'marketplace_access', name: 'Plugin Marketplace', type: 'boolean', enabled: true, tags: ['marketplace', 'pro'], tiers: { starter: false, pro: true, enterprise: true } },
  { key: 'new_dashboard_design', name: 'New Dashboard Design', type: 'percentage', enabled: true, tags: ['ui', 'experiment'], tiers: { starter: true, pro: true, enterprise: true } },
  { key: 'checkout_flow_v2', name: 'Checkout Flow v2', type: 'variant', enabled: true, tags: ['ui', 'experiment'], tiers: { starter: true, pro: true, enterprise: true } },
  { key: 'hipaa_compliance', name: 'HIPAA Compliance Pack', type: 'boolean', enabled: true, tags: ['compliance', 'enterprise'], tiers: { starter: false, pro: false, enterprise: true } },
  { key: 'multi_location', name: 'Multi-Location Support', type: 'boolean', enabled: false, tags: ['operations', 'enterprise'], tiers: { starter: false, pro: false, enterprise: true } },
];

export default function FlagsAdmin() {
  const [tagFilter, setTagFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const allTags = [...new Set(mockFlags.flatMap(f => f.tags))].sort();
  const filtered = mockFlags
    .filter(f => tagFilter === 'all' || f.tags.includes(tagFilter))
    .filter(f => typeFilter === 'all' || f.type === typeFilter);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <p className="text-gray-500">Manage feature rollouts, A/B tests, and tier-based access</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Total Flags</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockFlags.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Enabled</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{mockFlags.filter(f => f.enabled).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">A/B Tests</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{mockFlags.filter(f => f.type === 'variant').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Rollouts</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{mockFlags.filter(f => f.type === 'percentage').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">All Tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">All Types</option>
            <option value="boolean">Boolean</option>
            <option value="percentage">Percentage</option>
            <option value="variant">Variant</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map(f => (
            <div key={f.key} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{f.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    f.type === 'boolean' ? 'bg-blue-50 text-blue-700' :
                    f.type === 'percentage' ? 'bg-orange-50 text-orange-700' :
                    'bg-purple-50 text-purple-700'
                  }`}>{f.type}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-gray-500 font-mono">{f.key}</code>
                  <span className="text-gray-300">|</span>
                  {f.tags.map(t => (
                    <span key={t} className="text-xs text-gray-400">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {(['starter', 'pro', 'enterprise'] as const).map(tier => (
                    <span key={tier} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      f.tiers[tier] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {tier[0].toUpperCase()}
                    </span>
                  ))}
                </div>
                <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${f.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${f.enabled ? 'left-4' : 'left-0.5'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
