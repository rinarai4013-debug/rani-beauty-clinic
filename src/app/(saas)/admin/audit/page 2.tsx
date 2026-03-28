'use client';

import { useState } from 'react';

const mockEntries = [
  { id: 'a1', user: 'Dr. Lisa Park', action: 'update', resource: 'Client Profile', resourceId: 'c_1234', severity: 'medium', ip: '192.168.1.45', timestamp: Date.now() - 5 * 60000, tags: [] },
  { id: 'a2', user: 'System', action: 'login', resource: 'Authentication', resourceId: null, severity: 'low', ip: '10.0.0.12', timestamp: Date.now() - 15 * 60000, tags: [] },
  { id: 'a3', user: 'Sarah Mitchell', action: 'hipaa_access', resource: 'Patient Records', resourceId: 'c_5678', severity: 'high', ip: '192.168.1.50', timestamp: Date.now() - 30 * 60000, tags: ['hipaa', 'phi_access'] },
  { id: 'a4', user: 'Admin', action: 'config_change', resource: 'Feature Flags', resourceId: 'ai_phone_agent', severity: 'high', ip: '10.0.0.1', timestamp: Date.now() - 45 * 60000, tags: [] },
  { id: 'a5', user: 'Dr. James Reed', action: 'create', resource: 'Appointment', resourceId: 'apt_9012', severity: 'low', ip: '192.168.1.55', timestamp: Date.now() - 60 * 60000, tags: [] },
  { id: 'a6', user: 'System', action: 'export', resource: 'Client Data', resourceId: 'exp_3456', severity: 'medium', ip: '10.0.0.1', timestamp: Date.now() - 90 * 60000, tags: ['gdpr'] },
  { id: 'a7', user: 'Unknown', action: 'login', resource: 'Authentication', resourceId: null, severity: 'critical', ip: '203.0.113.42', timestamp: Date.now() - 120 * 60000, tags: ['failed_auth'] },
  { id: 'a8', user: 'Maria Santos', action: 'delete', resource: 'Inventory Item', resourceId: 'inv_7890', severity: 'high', ip: '192.168.1.60', timestamp: Date.now() - 180 * 60000, tags: [] },
];

const anomalies = [
  { type: 'failed_auth_burst', severity: 'critical', description: '5 failed login attempts from IP 203.0.113.42', resolved: false },
  { type: 'unusual_access_time', severity: 'medium', description: 'Access at 3:00 AM by Dr. Lisa Park', resolved: true },
];

const severityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-50 text-yellow-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-red-50 text-red-700',
};

export default function AuditLogViewer() {
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filtered = mockEntries
    .filter(e => actionFilter === 'all' || e.action === actionFilter)
    .filter(e => severityFilter === 'all' || e.severity === severityFilter);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500">Compliance-ready logging of all data modifications</p>
      </div>

      {/* Anomalies */}
      {anomalies.filter(a => !a.resolved).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2">Active Anomalies</h3>
          {anomalies.filter(a => !a.resolved).map((a, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-red-700">{a.description}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${severityColors[a.severity]}`}>{a.severity}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Total Entries (30d)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">12,456</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">HIPAA Access</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">234</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">High Severity</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">45</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Anomalies</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{anomalies.filter(a => !a.resolved).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">All Actions</option>
            {['create', 'read', 'update', 'delete', 'login', 'export', 'config_change', 'hipaa_access'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">All Severities</option>
            {['low', 'medium', 'high', 'critical'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Action</th>
                <th className="pb-3 font-medium">Resource</th>
                <th className="pb-3 font-medium">Severity</th>
                <th className="pb-3 font-medium">IP</th>
                <th className="pb-3 font-medium">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="py-3 text-gray-600 text-xs">{new Date(e.timestamp).toLocaleTimeString()}</td>
                  <td className="py-3 font-medium text-gray-900">{e.user}</td>
                  <td className="py-3"><span className="font-mono text-xs text-gray-600">{e.action}</span></td>
                  <td className="py-3 text-gray-700">{e.resource} {e.resourceId && <span className="text-gray-400 text-xs">({e.resourceId})</span>}</td>
                  <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${severityColors[e.severity]}`}>{e.severity}</span></td>
                  <td className="py-3 font-mono text-xs text-gray-500">{e.ip}</td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {e.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700">{t}</span>)}
                    </div>
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
