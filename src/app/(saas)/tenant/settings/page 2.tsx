/**
 * Tenant Dashboard — Settings Page (Branding, Team, Billing)
 */

'use client';

import { useState } from 'react';

export default function TenantSettingsPage() {
  const [activeTab, setActiveTab] = useState<'branding' | 'team' | 'billing' | 'general'>('general');

  const tabs = [
    { id: 'general' as const, label: 'General' },
    { id: 'branding' as const, label: 'Branding' },
    { id: 'team' as const, label: 'Team' },
    { id: 'billing' as const, label: 'Billing' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Clinic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                <input type="text" defaultValue="" placeholder="Your Clinic Name" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                <input type="email" placeholder="support@yourclinic.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                <input type="tel" placeholder="(555) 000-0000" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" placeholder="123 Main St, City, State, ZIP" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="url" placeholder="https://yourclinic.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain</label>
                <input type="text" placeholder="dashboard.yourclinic.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">Save Changes</button>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Brand Customization</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input type="url" placeholder="https://..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input type="text" placeholder="Your clinic tagline" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Colors</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Primary', key: 'primary', default: '#0F1D2C' },
                { label: 'Secondary', key: 'secondary', default: '#C9A96E' },
                { label: 'Accent', key: 'accent', default: '#D4AF37' },
                { label: 'Background', key: 'background', default: '#F8F6F1' },
                { label: 'Text', key: 'text', default: '#1A1A1A' },
                { label: 'Muted', key: 'muted', default: '#6B7280' },
              ].map((color) => (
                <div key={color.key} className="flex items-center gap-3">
                  <input type="color" defaultValue={color.default} className="w-10 h-10 rounded border border-gray-200 cursor-pointer" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{color.label}</p>
                    <p className="text-xs text-gray-400">{color.default}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Fonts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Heading Font</label>
                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                  <option>Playfair Display</option>
                  <option>Inter</option>
                  <option>Poppins</option>
                  <option>Roboto</option>
                  <option>Open Sans</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Body Font</label>
                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                  <option>Montserrat</option>
                  <option>Inter</option>
                  <option>Poppins</option>
                  <option>Roboto</option>
                  <option>Open Sans</option>
                </select>
              </div>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">Save Branding</button>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-900">Team Members</h3>
            <button className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800">Invite Member</button>
          </div>
          <div className="text-sm text-gray-500">Team management allows you to add providers, front desk staff, and managers with role-based access control.</div>
          <div className="mt-4 space-y-3">
            {['Owner (CEO)', 'Provider', 'Front Desk', 'Marketing', 'Operations'].map((role) => (
              <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                    {role[0]}
                  </div>
                  <span className="text-sm text-gray-900">{role}</span>
                </div>
                <span className="text-xs text-gray-400">No members assigned</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Current Plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { name: 'Starter', price: '$199/mo', features: ['Basic dashboard', 'KPIs & scheduling', 'Client management', 'Gamification'] },
                { name: 'Professional', price: '$499/mo', features: ['All Starter features', 'AI engines (8)', 'Dynamic pricing', 'Communication templates', 'Plaid bank connection'], current: false },
                { name: 'Enterprise', price: '$999/mo', features: ['All Professional features', 'White-label', 'RAG knowledge base', 'AI phone agent', 'Priority support'] },
              ].map((plan) => (
                <div key={plan.name} className={`p-5 rounded-xl border-2 ${plan.current ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{plan.price}</p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">&#10003;</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full mt-4 px-4 py-2 text-sm font-medium rounded-lg ${
                    plan.current ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                    {plan.current ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Usage This Period</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'API Calls', used: 0, limit: 10000 },
                { label: 'AI Tokens', used: 0, limit: 500000 },
                { label: 'SMS Sent', used: 0, limit: 500 },
                { label: 'Emails Sent', used: 0, limit: 2000 },
                { label: 'Storage', used: '0 MB', limit: '1 GB' },
              ].map((usage) => (
                <div key={usage.label}>
                  <p className="text-xs text-gray-500">{usage.label}</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{typeof usage.used === 'number' ? usage.used.toLocaleString() : usage.used}</p>
                  <p className="text-xs text-gray-400">of {typeof usage.limit === 'number' ? usage.limit.toLocaleString() : usage.limit}</p>
                  {typeof usage.used === 'number' && typeof usage.limit === 'number' && (
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
