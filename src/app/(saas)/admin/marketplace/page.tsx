'use client';

import { useState } from 'react';

// =============================================================================
// Integration Marketplace Admin Page
// Grid of integrations, category filters, search, install status, usage stats
// =============================================================================

type IntegrationCategory =
  | 'All'
  | 'CRM'
  | 'Payments'
  | 'Communications'
  | 'EHR'
  | 'Scheduling'
  | 'Accounting'
  | 'Marketing'
  | 'AI'
  | 'Reviews'
  | 'Analytics';

type IntegrationStatus = 'connected' | 'available' | 'coming_soon';

interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  icon: string;
  status: IntegrationStatus;
  tier: 'starter' | 'pro' | 'enterprise';
  apiCalls?: number;
  lastSync?: string;
  health?: 'healthy' | 'degraded' | 'error';
  version?: string;
}

const integrations: Integration[] = [
  // CRM
  { id: 'mangomint', name: 'Mangomint', category: 'CRM', description: 'Salon and spa management platform with client tracking, scheduling, and POS.', icon: 'M', status: 'connected', tier: 'starter', apiCalls: 12480, lastSync: '2 min ago', health: 'healthy', version: '2.4.1' },
  { id: 'boulevard', name: 'Boulevard', category: 'CRM', description: 'Client experience platform for appointment-based self-care businesses.', icon: 'B', status: 'available', tier: 'starter' },
  { id: 'vagaro', name: 'Vagaro', category: 'CRM', description: 'All-in-one salon, spa, and fitness booking and management software.', icon: 'V', status: 'available', tier: 'starter' },
  { id: 'mindbody', name: 'MindBody', category: 'CRM', description: 'Business management software for the wellness industry.', icon: 'MB', status: 'available', tier: 'pro' },
  { id: 'zenoti', name: 'Zenoti', category: 'CRM', description: 'Enterprise cloud solution for spas, salons, and med spas.', icon: 'Z', status: 'available', tier: 'enterprise' },
  // Payments
  { id: 'square', name: 'Square', category: 'Payments', description: 'Payment processing with POS, invoicing, and financial reporting.', icon: 'S', status: 'connected', tier: 'starter', apiCalls: 8920, lastSync: '5 min ago', health: 'healthy', version: '3.1.0' },
  { id: 'stripe', name: 'Stripe', category: 'Payments', description: 'Online payment processing for internet businesses of all sizes.', icon: 'St', status: 'connected', tier: 'starter', apiCalls: 4210, lastSync: '1 min ago', health: 'healthy', version: '2.8.0' },
  { id: 'cherry', name: 'Cherry', category: 'Payments', description: 'Patient financing for elective medical procedures and treatments.', icon: 'Ch', status: 'available', tier: 'pro' },
  { id: 'patientfi', name: 'PatientFi', category: 'Payments', description: 'Buy now, pay later for healthcare and aesthetics treatments.', icon: 'PF', status: 'available', tier: 'pro' },
  { id: 'carecredit', name: 'CareCredit', category: 'Payments', description: 'Healthcare credit card for cosmetic and wellness services.', icon: 'CC', status: 'available', tier: 'starter' },
  // Communications
  { id: 'twilio', name: 'Twilio', category: 'Communications', description: 'Programmable SMS, voice, and messaging APIs.', icon: 'Tw', status: 'connected', tier: 'starter', apiCalls: 6340, lastSync: '3 min ago', health: 'healthy', version: '1.9.2' },
  { id: 'mailchimp', name: 'Mailchimp', category: 'Communications', description: 'Email marketing and audience management platform.', icon: 'MC', status: 'available', tier: 'starter' },
  { id: 'klaviyo', name: 'Klaviyo', category: 'Communications', description: 'Email and SMS marketing automation for ecommerce.', icon: 'K', status: 'available', tier: 'pro' },
  { id: 'mailgun', name: 'Mailgun', category: 'Communications', description: 'Transactional email API service for developers.', icon: 'MG', status: 'available', tier: 'pro' },
  // EHR
  { id: 'drchrono', name: 'DrChrono', category: 'EHR', description: 'EHR, practice management, and medical billing for healthcare.', icon: 'DC', status: 'available', tier: 'enterprise' },
  { id: 'modmed', name: 'ModMed', category: 'EHR', description: 'Specialty-specific EHR and practice management.', icon: 'MM', status: 'available', tier: 'enterprise' },
  { id: 'nextech', name: 'Nextech', category: 'EHR', description: 'Integrated EHR and PM software for specialty practices.', icon: 'NT', status: 'coming_soon', tier: 'enterprise' },
  // Scheduling
  { id: 'acuity', name: 'Acuity Scheduling', category: 'Scheduling', description: 'Online appointment scheduling for businesses of all types.', icon: 'A', status: 'available', tier: 'starter' },
  { id: 'calendly', name: 'Calendly', category: 'Scheduling', description: 'Modern scheduling platform for teams and individuals.', icon: 'Ca', status: 'available', tier: 'starter' },
  { id: 'janeapp', name: 'Jane App', category: 'Scheduling', description: 'Practice management for health and wellness practitioners.', icon: 'J', status: 'available', tier: 'pro' },
  // Accounting
  { id: 'quickbooks', name: 'QuickBooks', category: 'Accounting', description: 'Small business accounting and financial management.', icon: 'QB', status: 'connected', tier: 'pro', apiCalls: 1890, lastSync: '15 min ago', health: 'healthy', version: '1.3.0' },
  { id: 'xero', name: 'Xero', category: 'Accounting', description: 'Cloud-based accounting software for small businesses.', icon: 'X', status: 'available', tier: 'pro' },
  { id: 'freshbooks', name: 'FreshBooks', category: 'Accounting', description: 'Invoicing and accounting software for small businesses.', icon: 'FB', status: 'available', tier: 'pro' },
  // Marketing
  { id: 'meta-ads', name: 'Meta Ads', category: 'Marketing', description: 'Facebook and Instagram advertising campaign management.', icon: 'MA', status: 'connected', tier: 'pro', apiCalls: 3420, lastSync: '10 min ago', health: 'healthy', version: '2.1.0' },
  { id: 'google-ads', name: 'Google Ads', category: 'Marketing', description: 'Search and display advertising on Google network.', icon: 'GA', status: 'available', tier: 'pro' },
  { id: 'yelp', name: 'Yelp', category: 'Marketing', description: 'Local business listings and review management.', icon: 'Y', status: 'available', tier: 'starter' },
  { id: 'healthgrades', name: 'Healthgrades', category: 'Marketing', description: 'Provider directory and patient review platform.', icon: 'HG', status: 'available', tier: 'pro' },
  // AI
  { id: 'claude', name: 'Claude AI', category: 'AI', description: 'Advanced AI assistant for clinical analysis and content generation.', icon: 'Cl', status: 'connected', tier: 'starter', apiCalls: 28900, lastSync: '1 min ago', health: 'healthy', version: '3.5.0' },
  { id: 'openai', name: 'OpenAI', category: 'AI', description: 'GPT models for text generation and analysis.', icon: 'OA', status: 'available', tier: 'pro' },
  { id: 'gemini', name: 'Gemini', category: 'AI', description: 'Google multimodal AI for content and reasoning tasks.', icon: 'G', status: 'coming_soon', tier: 'enterprise' },
  // Reviews
  { id: 'google-reviews', name: 'Google Reviews', category: 'Reviews', description: 'Google Business Profile review monitoring and response management.', icon: 'GR', status: 'connected', tier: 'starter', apiCalls: 2140, lastSync: '30 min ago', health: 'healthy', version: '1.5.0' },
  { id: 'realself', name: 'RealSelf', category: 'Reviews', description: 'Aesthetic treatment reviews and provider profiles.', icon: 'RS', status: 'available', tier: 'pro' },
  { id: 'birdeye', name: 'Birdeye', category: 'Reviews', description: 'Reputation management and customer experience platform.', icon: 'BE', status: 'available', tier: 'pro' },
  // Analytics
  { id: 'ga4', name: 'Google Analytics 4', category: 'Analytics', description: 'Web and app analytics for tracking user behavior and conversions.', icon: 'G4', status: 'connected', tier: 'starter', apiCalls: 5670, lastSync: '8 min ago', health: 'healthy', version: '4.0.2' },
  { id: 'mixpanel', name: 'Mixpanel', category: 'Analytics', description: 'Product analytics for tracking user interactions and funnels.', icon: 'MP', status: 'available', tier: 'pro' },
  { id: 'amplitude', name: 'Amplitude', category: 'Analytics', description: 'Digital analytics platform for understanding user behavior.', icon: 'Am', status: 'available', tier: 'enterprise' },
];

const categories: IntegrationCategory[] = [
  'All', 'CRM', 'Payments', 'Communications', 'EHR', 'Scheduling',
  'Accounting', 'Marketing', 'AI', 'Reviews', 'Analytics',
];

const statusColors: Record<IntegrationStatus, { bg: string; text: string; label: string }> = {
  connected: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Connected' },
  available: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Available' },
  coming_soon: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Coming Soon' },
};

const healthColors: Record<string, string> = {
  healthy: 'bg-emerald-400',
  degraded: 'bg-amber-400',
  error: 'bg-red-400',
};

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory>('All');
  const [search, setSearch] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'available'>('all');

  const filtered = integrations.filter((i) => {
    const matchesCategory = selectedCategory === 'All' || i.category === selectedCategory;
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesCategory && matchesSearch && matchesStatus;
  });

  const connectedCount = integrations.filter((i) => i.status === 'connected').length;
  const totalApiCalls = integrations.reduce((sum, i) => sum + (i.apiCalls || 0), 0);
  const selected = integrations.find((i) => i.id === selectedIntegration);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integration Marketplace</h1>
        <p className="text-sm text-gray-500 mt-1">Connect your practice tools and manage active integrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Connected', value: String(connectedCount), sub: `of ${integrations.length} available` },
          { label: 'API Calls (30d)', value: `${(totalApiCalls / 1000).toFixed(1)}K`, sub: '+18% vs last month' },
          { label: 'Sync Health', value: '100%', sub: 'All systems operational' },
          { label: 'Data Synced', value: '2.4GB', sub: 'Last 30 days' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['all', 'connected', 'available'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                statusFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {f === 'all' ? 'All Status' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const count = cat === 'All'
            ? integrations.length
            : integrations.filter((i) => i.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0F1D2C] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Integration Grid */}
        <div className={`${selected ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((integration) => {
              const statusStyle = statusColors[integration.status];
              return (
                <button
                  key={integration.id}
                  onClick={() => setSelectedIntegration(
                    selectedIntegration === integration.id ? null : integration.id
                  )}
                  className={`bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md ${
                    selectedIntegration === integration.id
                      ? 'border-[#0F1D2C] ring-1 ring-[#0F1D2C]'
                      : 'border-gray-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-700">{integration.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{integration.name}</p>
                        <p className="text-[10px] text-gray-400">{integration.category}</p>
                      </div>
                    </div>
                    {integration.health && (
                      <div className={`w-2 h-2 rounded-full ${healthColors[integration.health]}`} />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{integration.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                      {statusStyle.label}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize">{integration.tier}</span>
                  </div>
                  {integration.apiCalls && (
                    <div className="mt-2 pt-2 border-t border-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">{(integration.apiCalls / 1000).toFixed(1)}K calls/mo</span>
                        <span className="text-[10px] text-gray-400">Synced {integration.lastSync}</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
              <p className="text-sm text-gray-500">No integrations found matching your search.</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm sticky top-4 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700">{selected.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selected.name}</h3>
                  <p className="text-xs text-gray-500">{selected.category}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600">{selected.description}</p>

              {/* Status Fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs font-semibold ${statusColors[selected.status].text}`}>
                    {statusColors[selected.status].label}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs text-gray-500">Required Plan</span>
                  <span className="text-xs font-semibold text-gray-700 capitalize">{selected.tier}</span>
                </div>
                {selected.version && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-500">Version</span>
                    <span className="text-xs font-mono text-gray-700">{selected.version}</span>
                  </div>
                )}
              </div>

              {/* Usage Stats (connected only) */}
              {selected.status === 'connected' && selected.apiCalls && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700">Usage This Month</h4>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">API Calls</span>
                      <span className="text-xs font-bold text-gray-900">{selected.apiCalls.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Last Sync</span>
                      <span className="text-xs text-gray-700">{selected.lastSync}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Health</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${healthColors[selected.health || 'healthy']}`} />
                        <span className="text-xs text-gray-700 capitalize">{selected.health}</span>
                      </div>
                    </div>
                    {/* Usage bar */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-400">API Quota</span>
                        <span className="text-[10px] text-gray-400">
                          {Math.round((selected.apiCalls / 50000) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0F1D2C] rounded-full"
                          style={{ width: `${Math.min((selected.apiCalls / 50000) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Webhook Events */}
              {selected.status === 'connected' && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700">Recent Events</h4>
                  <div className="space-y-1">
                    {[
                      { event: 'appointment.created', time: '12s ago' },
                      { event: 'client.updated', time: '45s ago' },
                      { event: 'payment.completed', time: '2m ago' },
                    ].map((ev, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-[10px] font-mono text-gray-600">{ev.event}</span>
                        <span className="text-[10px] text-gray-400">{ev.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {selected.status === 'connected' ? (
                  <>
                    <button className="w-full py-2.5 text-xs font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors">
                      Configure Settings
                    </button>
                    <button className="w-full py-2.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                      Force Sync Now
                    </button>
                    <button className="w-full py-2.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                      View Logs
                    </button>
                    <button className="w-full py-2.5 text-xs font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                      Disconnect
                    </button>
                  </>
                ) : selected.status === 'available' ? (
                  <button className="w-full py-2.5 text-xs font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors">
                    Connect {selected.name}
                  </button>
                ) : (
                  <button disabled className="w-full py-2.5 text-xs font-medium text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed">
                    Coming Soon
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedIntegration(null)}
                className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
