'use client';

import { useState } from 'react';

const mockTemplates = [
  { name: 'payment_successful', category: 'billing', channels: ['in_app', 'email'], active: true },
  { name: 'payment_failed', category: 'billing', channels: ['in_app', 'email', 'sms'], active: true },
  { name: 'usage_exceeded', category: 'usage', channels: ['in_app', 'email', 'sms'], active: true },
  { name: 'new_login', category: 'security', channels: ['in_app', 'email'], active: true },
  { name: 'suspicious_activity', category: 'security', channels: ['in_app', 'email', 'sms'], active: true },
  { name: 'new_review', category: 'review', channels: ['in_app', 'email'], active: true },
  { name: 'negative_review', category: 'review', channels: ['in_app', 'email', 'sms'], active: true },
  { name: 'ai_churn_alert', category: 'ai_insight', channels: ['in_app', 'email'], active: true },
  { name: 'low_stock', category: 'inventory', channels: ['in_app', 'email'], active: true },
  { name: 'appointment_booked', category: 'appointment', channels: ['in_app'], active: true },
  { name: 'campaign_results', category: 'campaign', channels: ['in_app', 'email'], active: true },
  { name: 'integration_disconnected', category: 'integration', channels: ['in_app', 'email'], active: true },
];

const stats = { total: 52, active: 48, byChannel: { in_app: 52, email: 38, sms: 8, webhook: 4 } };

export default function NotificationsAdmin() {
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [...new Set(mockTemplates.map(t => t.category))];
  const filtered = categoryFilter === 'all' ? mockTemplates : mockTemplates.filter(t => t.category === categoryFilter);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Management</h1>
        <p className="text-gray-500">Manage notification templates and delivery channels</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Total Templates</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Email Templates</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.byChannel.email}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">SMS Templates</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.byChannel.sms}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="pb-3 font-medium">Template</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Channels</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(t => (
                <tr key={t.name}>
                  <td className="py-3 font-medium text-gray-900 font-mono text-xs">{t.name}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                      {t.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {t.channels.map(ch => (
                        <span key={ch} className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">{ch}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 text-xs ${t.active ? 'text-green-600' : 'text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${t.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {t.active ? 'Active' : 'Disabled'}
                    </span>
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
