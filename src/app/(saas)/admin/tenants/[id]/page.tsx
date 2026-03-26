'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

// Mock tenant data (would come from API in production)
const tenant = {
  id: 't_002',
  name: 'Radiance Aesthetics',
  slug: 'radiance',
  email: 'hello@radianceaesthetics.com',
  phone: '(503) 555-0142',
  plan: 'enterprise' as const,
  status: 'active' as const,
  mrr: 999,
  location: 'Portland, OR',
  website: 'https://radianceaesthetics.com',
  createdAt: '2025-09-01',
  lastActive: '2026-03-24T09:15:00Z',
  owner: 'Dr. Sarah Mitchell',
  providers: 5,
  monthlyClients: 340,
};

const usageData = [
  { month: 'Oct', aiCalls: 4200, sms: 380, emails: 620 },
  { month: 'Nov', aiCalls: 5800, sms: 510, emails: 740 },
  { month: 'Dec', aiCalls: 6100, sms: 490, emails: 680 },
  { month: 'Jan', aiCalls: 7400, sms: 620, emails: 890 },
  { month: 'Feb', aiCalls: 8200, sms: 710, emails: 960 },
  { month: 'Mar', aiCalls: 8760, sms: 780, emails: 1040 },
];

const aiTokenUsage = [
  { month: 'Oct', tokens: 2100000 },
  { month: 'Nov', tokens: 2900000 },
  { month: 'Dec', tokens: 3100000 },
  { month: 'Jan', tokens: 3700000 },
  { month: 'Feb', tokens: 4100000 },
  { month: 'Mar', tokens: 4380000 },
];

const featureFlags = [
  { name: 'AI Intake Intelligence', key: 'ai_intake', enabled: true },
  { name: 'Churn Prediction', key: 'churn_prediction', enabled: true },
  { name: 'Dynamic Pricing', key: 'dynamic_pricing', enabled: true },
  { name: 'AI Phone Agent', key: 'ai_phone', enabled: true },
  { name: 'Meta Ads Manager', key: 'meta_ads', enabled: true },
  { name: 'RAG Knowledge Base', key: 'rag_kb', enabled: true },
  { name: 'Custom Workflows', key: 'custom_workflows', enabled: false },
  { name: 'Multi-Location', key: 'multi_location', enabled: false },
  { name: 'White-Label Portal', key: 'white_label', enabled: true },
  { name: 'API Access', key: 'api_access', enabled: true },
];

const subscriptionHistory = [
  { date: '2025-09-01', event: 'Started Growth plan trial', amount: 0 },
  { date: '2025-09-15', event: 'Converted to Growth plan', amount: 499 },
  { date: '2025-12-01', event: 'Upgraded to Enterprise', amount: 999 },
  { date: '2026-01-01', event: 'Renewed Enterprise', amount: 999 },
  { date: '2026-02-01', event: 'Renewed Enterprise', amount: 999 },
  { date: '2026-03-01', event: 'Renewed Enterprise', amount: 999 },
];

const supportNotes = [
  { date: '2026-03-20', author: 'Support Team', note: 'Helped configure custom n8n workflow for birthday campaign automation.' },
  { date: '2026-03-05', author: 'Success Manager', note: 'QBR completed. Clinic reports 22% increase in rebooking rate since onboarding. Expanding to second location in Q2.' },
  { date: '2026-02-15', author: 'Support Team', note: 'Resolved Mangomint sync issue causing duplicate appointments. Root cause: webhook timeout.' },
  { date: '2026-01-10', author: 'Success Manager', note: 'Onboarding complete. All 5 providers trained on dashboard. Owner very satisfied with AI intake intelligence.' },
];

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'features' | 'billing' | 'support'>('overview');
  const [featureStates, setFeatureStates] = useState(
    featureFlags.reduce((acc, f) => ({ ...acc, [f.key]: f.enabled }), {} as Record<string, boolean>)
  );

  const toggleFeature = (key: string) => {
    setFeatureStates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'usage', label: 'Usage' },
    { key: 'features', label: 'Features' },
    { key: 'billing', label: 'Billing' },
    { key: 'support', label: 'Support' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/tenants" className="hover:text-gray-900">Tenants</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{tenant.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#0F1D2C] to-[#1A2A3C] rounded-2xl flex items-center justify-center">
              <span className="text-[#F3D6BE] font-bold text-lg">RA</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                  Active
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                  Enterprise
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {tenant.location} &middot; {tenant.owner} &middot; Since {new Date(tenant.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              Impersonate
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors">
              Edit Tenant
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-100">
          {[
            { label: 'MRR', value: `$${tenant.mrr}` },
            { label: 'Providers', value: tenant.providers },
            { label: 'Monthly Clients', value: tenant.monthlyClients },
            { label: 'AI Calls (MTD)', value: '8,760' },
            { label: 'Last Active', value: '30 min ago' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              {[
                { label: 'Email', value: tenant.email },
                { label: 'Phone', value: tenant.phone },
                { label: 'Website', value: tenant.website },
                { label: 'Owner', value: tenant.owner },
                { label: 'Slug', value: tenant.slug },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-sm text-gray-900 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">This Month</h3>
            <div className="space-y-3">
              {[
                { label: 'AI API Calls', value: '8,760', limit: 'Unlimited', pct: 100 },
                { label: 'SMS Sent', value: '780', limit: '10,000', pct: 7.8 },
                { label: 'Emails Sent', value: '1,040', limit: 'Unlimited', pct: 100 },
                { label: 'AI Tokens', value: '4.38M', limit: 'Unlimited', pct: 100 },
                { label: 'Storage Used', value: '2.1 GB', limit: '50 GB', pct: 4.2 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className="text-xs text-gray-700 font-medium">
                      {item.value} / {item.limit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F1D2C] rounded-full transition-all"
                      style={{ width: `${Math.min(item.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">API Calls & Communications</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="aiCalls" name="AI Calls" fill="#0F1D2C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sms" name="SMS" fill="#F3D6BE" radius={[4, 4, 0, 0]} />
                <Bar dataKey="emails" name="Emails" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">AI Token Consumption</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={aiTokenUsage} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value: number) => [`${(value / 1000000).toFixed(2)}M tokens`, 'Usage']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="tokens"
                  stroke="#0F1D2C"
                  strokeWidth={2.5}
                  dot={{ fill: '#0F1D2C', r: 4, strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Feature Flags</h3>
          <div className="divide-y divide-gray-100">
            {featureFlags.map((flag) => (
              <div key={flag.key} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{flag.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{flag.key}</p>
                </div>
                <button
                  onClick={() => toggleFeature(flag.key)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    featureStates[flag.key] ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      featureStates[flag.key] ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Subscription */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Subscription Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Plan', value: 'Enterprise' },
                { label: 'MRR', value: '$999' },
                { label: 'Billing Cycle', value: 'Monthly' },
                { label: 'Next Renewal', value: 'Apr 1, 2026' },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Subscription History</h3>
            <div className="space-y-3">
              {subscriptionHistory.map((event, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#0F1D2C] rounded-full" />
                    <div>
                      <p className="text-sm text-gray-900">{event.event}</p>
                      <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {event.amount > 0 ? `$${event.amount}/mo` : 'Free'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="space-y-6">
          {/* Add Note */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Support Note</h3>
            <textarea
              placeholder="Add a note about this tenant..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C] resize-none"
            />
            <div className="flex justify-end mt-2">
              <button className="px-4 py-2 text-sm font-medium text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors">
                Save Note
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Support Notes</h3>
            <div className="space-y-4">
              {supportNotes.map((note, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#0F1D2C]">{note.author}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{note.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
