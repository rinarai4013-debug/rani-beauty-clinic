/**
 * Tenant Dashboard — Schedule / Calendar Page
 */

'use client';

import { useState } from 'react';
import { useTenantSchedule, useTenantNoShowPredictions, useTenantScheduleOptimization } from '@/hooks/useTenantDashboard';
import type { CalendarView } from '@/lib/saas/tenant-dashboard/schedule';

export default function TenantSchedulePage() {
  const [view, setView] = useState<CalendarView>('day');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'calendar' | 'no-show' | 'optimize' | 'waitlist'>('calendar');

  const { data: calendarData, isLoading } = useTenantSchedule(view, date, selectedProvider);
  const { data: noShowPredictions } = useTenantNoShowPredictions(date);
  const { data: optimization } = useTenantScheduleOptimization(date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule</h2>
          <p className="text-sm text-gray-500 mt-1">
            {calendarData?.events?.length ?? 0} appointments | {calendarData?.utilizationRate ?? 0}% utilization
          </p>
        </div>
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${view === v ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Date + Provider Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
        <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">All Providers</option>
          {calendarData?.providers?.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="flex gap-2 ml-auto">
          {(['calendar', 'no-show', 'optimize', 'waitlist'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {tab === 'no-show' ? 'No-Show Risk' : tab === 'optimize' ? 'Optimize' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Potential */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Revenue Potential</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${(calendarData?.totalRevenuePotential ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Schedule Efficiency</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{optimization?.score ?? 0}/100</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">High No-Show Risk</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{noShowPredictions?.filter(p => p.riskLevel === 'high').length ?? 0}</p>
        </div>
      </div>

      {/* Calendar / Appointment List */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading schedule...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Provider</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">No-Show Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {calendarData?.events?.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{event.clientName}</div>
                        {event.isNewClient && <span className="text-xs text-blue-600">New Client</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{event.service}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                          <span className="text-sm text-gray-600">{event.provider}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{event.room || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          event.status === 'completed' ? 'bg-green-100 text-green-800' :
                          event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          event.status === 'no_show' ? 'bg-red-100 text-red-800' :
                          event.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">${event.amount}</td>
                      <td className="px-4 py-3 text-center">
                        {event.noShowRisk > 0 && (
                          <span className={`text-xs font-bold ${event.noShowRisk >= 50 ? 'text-red-600' : event.noShowRisk >= 25 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {event.noShowRisk}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!calendarData?.events || calendarData.events.length === 0) && (
                <div className="p-8 text-center text-gray-400">No appointments for this date</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No-Show Predictions */}
      {activeTab === 'no-show' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">No-Show Risk Predictions</h3>
          <div className="space-y-3">
            {noShowPredictions?.map((pred) => (
              <div key={pred.appointmentId} className={`p-4 rounded-lg border ${pred.riskLevel === 'high' ? 'border-red-200 bg-red-50' : pred.riskLevel === 'moderate' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{pred.clientName}</span>
                    <span className="text-xs text-gray-500 ml-2">{pred.service} at {new Date(pred.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className={`text-sm font-bold ${pred.riskLevel === 'high' ? 'text-red-600' : pred.riskLevel === 'moderate' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {pred.riskScore}% risk
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{pred.recommendation}</p>
                <div className="flex gap-3 mt-2">
                  {pred.factors.map((f) => (
                    <span key={f.name} className="text-xs text-gray-500">{f.name}: {f.score}</span>
                  ))}
                </div>
              </div>
            ))}
            {(!noShowPredictions || noShowPredictions.length === 0) && (
              <p className="text-sm text-gray-400">No predictions available for this date</p>
            )}
          </div>
        </div>
      )}

      {/* Schedule Optimization */}
      {activeTab === 'optimize' && optimization && (
        <div className="space-y-4">
          {optimization.conflicts.length > 0 && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-5">
              <h3 className="text-sm font-semibold text-red-800 mb-3">Conflicts ({optimization.conflicts.length})</h3>
              {optimization.conflicts.map((c, i) => (
                <div key={i} className="p-3 bg-white rounded-lg mb-2 last:mb-0">
                  <p className="text-sm text-gray-900">{c.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Resolution: {c.resolution}</p>
                </div>
              ))}
            </div>
          )}
          {optimization.gaps.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Schedule Gaps ({optimization.gaps.length})</h3>
              {optimization.gaps.map((g, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg mb-2 last:mb-0">
                  <div>
                    <span className="text-sm text-gray-900">{g.provider}: {g.duration}min gap</span>
                    <span className="text-xs text-gray-500 ml-2">Suggest: {g.suggestedService}</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">${g.revenuePotential}</span>
                </div>
              ))}
            </div>
          )}
          {optimization.suggestions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Suggestions</h3>
              {optimization.suggestions.map((s, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg mb-2 last:mb-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.priority === 'high' ? 'bg-red-500' : s.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <span className="text-sm text-gray-900">{s.action}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{s.impact}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'waitlist' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <p>Waitlist management coming soon</p>
          <p className="text-xs mt-1">Clients can be added to the waitlist when preferred slots are unavailable</p>
        </div>
      )}
    </div>
  );
}
