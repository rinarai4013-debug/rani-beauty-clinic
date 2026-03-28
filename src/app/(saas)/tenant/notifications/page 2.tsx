'use client';

import { useState } from 'react';

const CATEGORIES = [
  { key: 'billing', label: 'Billing', description: 'Payment confirmations, invoices, subscription alerts' },
  { key: 'usage', label: 'Usage Alerts', description: 'Quota warnings, overage notifications' },
  { key: 'security', label: 'Security', description: 'Login alerts, API key changes, suspicious activity' },
  { key: 'system', label: 'System', description: 'Maintenance, updates, incidents' },
  { key: 'ai_insight', label: 'AI Insights', description: 'Churn alerts, revenue anomalies, recommendations' },
  { key: 'appointment', label: 'Appointments', description: 'Bookings, cancellations, reminders' },
  { key: 'client', label: 'Clients', description: 'New leads, milestones, birthdays' },
  { key: 'review', label: 'Reviews', description: 'New reviews, negative review alerts' },
  { key: 'inventory', label: 'Inventory', description: 'Low stock, expiring products' },
  { key: 'schedule', label: 'Schedule', description: 'Gap detection, overtime alerts' },
  { key: 'campaign', label: 'Campaigns', description: 'Campaign results, reactivation wins' },
  { key: 'integration', label: 'Integrations', description: 'Sync status, disconnection alerts' },
  { key: 'feature', label: 'Features', description: 'New features, beta invites' },
  { key: 'marketing', label: 'Marketing', description: 'Content ready, ad performance' },
];

export default function TenantNotificationPrefs() {
  const [prefs, setPrefs] = useState(
    Object.fromEntries(CATEGORIES.map(c => [c.key, { enabled: true, inApp: true, email: c.key === 'security' || c.key === 'billing', sms: c.key === 'security' }]))
  );
  const [digestFreq, setDigestFreq] = useState('immediate');

  const toggle = (cat: string, channel: string) => {
    setPrefs(prev => ({
      ...prev,
      [cat]: { ...prev[cat], [channel]: !prev[cat][channel as keyof typeof prev[typeof cat]] },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="text-gray-500">Choose how and when you receive notifications</p>
      </div>

      {/* Global Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Digest</label>
            <select value={digestFreq} onChange={e => setDigestFreq(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="immediate">Send Immediately</option>
              <option value="hourly">Hourly Digest</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Digest</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiet Hours</label>
            <div className="flex items-center gap-2">
              <input type="time" defaultValue="22:00" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <span className="text-gray-500">to</span>
              <input type="time" defaultValue="07:00" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Preferences */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Category Preferences</h2>
          <div className="flex gap-8 text-xs text-gray-500 font-medium">
            <span className="w-16 text-center">In-App</span>
            <span className="w-16 text-center">Email</span>
            <span className="w-16 text-center">SMS</span>
          </div>
        </div>
        <div className="space-y-1">
          {CATEGORIES.map(cat => {
            const p = prefs[cat.key];
            return (
              <div key={cat.key} className="flex items-center justify-between py-3 border-b border-gray-50">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{cat.label}</p>
                  <p className="text-xs text-gray-500">{cat.description}</p>
                </div>
                <div className="flex gap-8">
                  {['inApp', 'email', 'sms'].map(ch => (
                    <div key={ch} className="w-16 flex justify-center">
                      <button
                        onClick={() => toggle(cat.key, ch)}
                        className={`w-9 h-5 rounded-full relative transition-colors ${
                          p[ch as keyof typeof p] ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          p[ch as keyof typeof p] ? 'left-4' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-2 bg-[#C9A96E] text-white rounded-lg text-sm font-medium hover:bg-[#b89558]">Save Preferences</button>
      </div>
    </div>
  );
}
