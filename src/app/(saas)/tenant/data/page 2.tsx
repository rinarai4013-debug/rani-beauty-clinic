'use client';

import { useState } from 'react';

const exportHistory = [
  { id: 'exp_1', scope: ['clients', 'appointments'], format: 'csv', status: 'completed', recordCount: 1750, requestedAt: '2026-03-25 14:30', size: '2.4 MB' },
  { id: 'exp_2', scope: ['full'], format: 'json', status: 'completed', recordCount: 8920, requestedAt: '2026-03-20 09:00', size: '12.8 MB' },
  { id: 'exp_3', scope: ['transactions'], format: 'csv', status: 'completed', recordCount: 3200, requestedAt: '2026-03-15 16:45', size: '1.8 MB' },
];

const scheduledExports = [
  { id: 's1', scope: 'Full Backup', frequency: 'weekly', nextRun: '2026-03-30 06:00', destination: 'email', enabled: true },
  { id: 's2', scope: 'Transactions', frequency: 'daily', nextRun: '2026-03-27 00:00', destination: 'download', enabled: true },
];

const SCOPES = ['Full Export', 'Clients', 'Appointments', 'Transactions', 'Reviews', 'Messages', 'Inventory', 'KPIs', 'Memberships', 'Packages', 'Intakes'];
const IMPORT_SOURCES = ['Zenoti', 'Vagaro', 'Boulevard', 'MindBody', 'CSV File', 'JSON File'];

export default function TenantData() {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'gdpr'>('export');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
        <p className="text-gray-500">Export, import, and manage your clinic data</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'export' as const, label: 'Export Data' },
          { key: 'import' as const, label: 'Import Data' },
          { key: 'gdpr' as const, label: 'GDPR / Privacy' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Export</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Data</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SCOPES.map(s => (
                    <label key={s} className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" /> {s}</label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>CSV</option><option>JSON</option><option>XLSX</option>
                  </select>
                </div>
                <button className="mt-6 px-6 py-2 bg-[#C9A96E] text-white rounded-lg text-sm font-medium">Start Export</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Exports</h2>
            <div className="space-y-3">
              {scheduledExports.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.scope}</p>
                    <p className="text-xs text-gray-500">{s.frequency} | Next: {s.nextRun} | {s.destination}</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative cursor-pointer ${s.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow ${s.enabled ? 'left-4' : 'left-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export History</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 border-b">
                <tr>
                  <th className="pb-3 font-medium">Scope</th>
                  <th className="pb-3 font-medium">Format</th>
                  <th className="pb-3 font-medium">Records</th>
                  <th className="pb-3 font-medium">Size</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exportHistory.map(e => (
                  <tr key={e.id}>
                    <td className="py-3 text-gray-900">{e.scope.join(', ')}</td>
                    <td className="py-3 text-gray-600 uppercase text-xs">{e.format}</td>
                    <td className="py-3 text-gray-600">{e.recordCount.toLocaleString()}</td>
                    <td className="py-3 text-gray-600">{e.size}</td>
                    <td className="py-3 text-gray-600 text-xs">{e.requestedAt}</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">{e.status}</span></td>
                    <td className="py-3"><button className="text-[#C9A96E] text-xs font-medium hover:underline">Download</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Data</h2>
          <p className="text-sm text-gray-600 mb-6">Migrate data from another platform or import from file.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {IMPORT_SOURCES.map(source => (
              <button key={source} className="p-4 border border-gray-200 rounded-xl text-center hover:border-[#C9A96E] hover:bg-[#C9A96E]/5 transition-colors">
                <p className="font-medium text-gray-900">{source}</p>
                <p className="text-xs text-gray-500 mt-1">Import from {source}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'gdpr' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">GDPR Data Request</h2>
            <p className="text-sm text-gray-600 mb-4">Process data access, portability, and erasure requests.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>Data Access (Right to Access)</option>
                    <option>Data Portability</option>
                    <option>Data Erasure (Right to be Forgotten)</option>
                    <option>Data Rectification</option>
                    <option>Processing Restriction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification Method</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>Email Verification</option>
                    <option>ID Check</option>
                    <option>Phone Verification</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Email</label>
                  <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="email@example.com" />
                </div>
              </div>
              <button className="px-6 py-2 bg-[#0F1D2C] text-white rounded-lg text-sm font-medium">Submit Request</button>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            GDPR requests must be processed within 30 days. All actions are logged in the audit trail for compliance.
          </div>
        </div>
      )}
    </div>
  );
}
