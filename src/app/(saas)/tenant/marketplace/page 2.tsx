'use client';

import { useState } from 'react';

const plugins = [
  { slug: 'online-booking-widget', name: 'Online Booking Widget', description: 'Embeddable booking widget for your website with real-time availability.', category: 'Scheduling', price: 'Free', rating: 4.6, installs: 398, icon: '📅', installed: true },
  { slug: 'google-reviews-auto-response', name: 'Google Reviews Auto-Response', description: 'AI-powered automatic responses to Google reviews.', category: 'Marketing', price: '$29/mo', rating: 4.7, installs: 198, icon: '⭐', installed: true },
  { slug: 'client-birthday-automator', name: 'Client Birthday Automator', description: 'Automated birthday messages with personalized offers.', category: 'Communication', price: '$19/mo', rating: 4.8, installs: 234, icon: '🎂', installed: false },
  { slug: 'instagram-post-scheduler', name: 'Instagram Post Scheduler', description: 'Schedule and auto-publish Instagram posts with AI captions.', category: 'Marketing', price: '$39/mo', rating: 4.5, installs: 267, icon: '📸', installed: false },
  { slug: 'loyalty-program', name: 'Loyalty Program', description: 'Points-based loyalty with tiers and rewards catalog.', category: 'Client Experience', price: '$49/mo', rating: 4.7, installs: 176, icon: '🏆', installed: false },
  { slug: 'consent-form-builder', name: 'Treatment Consent Form Builder', description: 'Digital consent forms with e-signatures.', category: 'Operations', price: '$39/mo', rating: 4.6, installs: 189, icon: '📝', installed: false },
  { slug: 'referral-program-manager', name: 'Referral Program Manager', description: 'Track and reward client referrals.', category: 'Marketing', price: '$39/mo', rating: 4.5, installs: 123, icon: '🔗', installed: false },
  { slug: 'revenue-forecasting', name: 'Revenue Forecasting', description: 'AI-powered revenue forecasting with scenario planning.', category: 'Analytics', price: '$59/mo', rating: 4.7, installs: 118, icon: '📈', installed: false },
  { slug: 'gift-card-system', name: 'Gift Card System', description: 'Digital and physical gift cards with online purchasing.', category: 'Finance', price: '$29/mo', rating: 4.4, installs: 145, icon: '🎁', installed: false },
  { slug: 'waitlist-manager', name: 'Waitlist Manager', description: 'Smart waitlist with auto-fill and priority rules.', category: 'Scheduling', price: '$29/mo', rating: 4.5, installs: 95, icon: '📋', installed: false },
  { slug: 'staff-scheduling-optimizer', name: 'Staff Scheduling Optimizer', description: 'AI-optimized staff scheduling with demand forecasting.', category: 'Scheduling', price: '$59/mo', rating: 4.6, installs: 112, icon: '👥', installed: false },
  { slug: 'patient-photo-gallery', name: 'Patient Photo Gallery', description: 'Secure before/after photo management with consent tracking.', category: 'Client Experience', price: '$49/mo', rating: 4.8, installs: 156, icon: '📷', installed: false },
];

export default function TenantMarketplace() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [...new Set(plugins.map(p => p.category))].sort();
  const filtered = plugins
    .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
    .filter(p => search === '' || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plugin Marketplace</h1>
        <p className="text-gray-500">Extend your clinic with powerful integrations</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search plugins..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm"
        />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.slug} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-xs text-gray-500">{p.category}</p>
                </div>
              </div>
              {p.installed && (
                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">Installed</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-3">{p.description}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{'★'.repeat(Math.floor(p.rating))} {p.rating}</span>
                <span>{p.installs} installs</span>
              </div>
              <span className="text-sm font-semibold text-[#C9A96E]">{p.price}</span>
            </div>
            {!p.installed && (
              <button className="w-full mt-3 bg-[#0F1D2C] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#1a2d3d] transition-colors">
                Install Plugin
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
