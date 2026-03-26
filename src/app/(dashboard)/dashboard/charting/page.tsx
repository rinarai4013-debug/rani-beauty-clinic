'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Syringe,
  Activity,
  Users,
  Dumbbell,
  TestTubes,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import ComplianceBanner from '@/components/dashboard/charting/ComplianceBanner';
import type { ChartTemplateType } from '@/lib/charting/templates';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TEMPLATE_OPTIONS: Array<{ value: ChartTemplateType; label: string; icon: React.ReactNode }> = [
  { value: 'injection_log', label: 'Injection Log', icon: <Syringe className="h-4 w-4" /> },
  { value: 'soap_note', label: 'SOAP Note', icon: <FileText className="h-4 w-4" /> },
  { value: 'consultation', label: 'Consultation', icon: <Users className="h-4 w-4" /> },
  { value: 'program_note', label: 'Program Note', icon: <Activity className="h-4 w-4" /> },
  { value: 'body_treatment', label: 'Body Treatment', icon: <Dumbbell className="h-4 w-4" /> },
  { value: 'lab_draw', label: 'Lab Draw', icon: <TestTubes className="h-4 w-4" /> },
];

const STATUS_BADGE: Record<string, { color: string; icon: React.ReactNode }> = {
  draft: { color: 'bg-amber-100 text-amber-800', icon: <Clock className="h-3 w-3" /> },
  complete: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3" /> },
  signed: { color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="h-3 w-3" /> },
  reviewed: { color: 'bg-purple-100 text-purple-800', icon: <CheckCircle className="h-3 w-3" /> },
  amended: { color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="h-3 w-3" /> },
};

interface ChartRecord {
  id: string;
  chartId: string;
  templateType: ChartTemplateType;
  clientName: string;
  providerName: string;
  appointmentDate: string;
  status: string;
  complianceStatus: string;
  requiresMdReview: boolean;
  mdReviewDate?: string;
}

interface ComplianceSummary {
  totalChartsToday: number;
  completedCharts: number;
  pendingCharts: number;
  blockedCheckouts: number;
  mdReviewPending: number;
}

export default function ChartingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTemplate, setFilterTemplate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showNewChart, setShowNewChart] = useState(false);
  const [newChartForm, setNewChartForm] = useState({
    templateType: '' as ChartTemplateType | '',
    clientName: '',
    providerName: 'Mom',
    appointmentDate: new Date().toISOString().split('T')[0],
  });
  const [creating, setCreating] = useState(false);

  // Build query string
  const queryParts: string[] = [];
  if (searchQuery) queryParts.push(`clientName=${encodeURIComponent(searchQuery)}`);
  if (filterTemplate) queryParts.push(`templateType=${filterTemplate}`);
  if (filterStatus) queryParts.push(`status=${filterStatus}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  const { data, error, mutate } = useSWR(
    `/api/dashboard/charting${queryString}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const charts: ChartRecord[] = data?.charts || [];
  const compliance: ComplianceSummary = data?.compliance || {
    totalChartsToday: 0,
    completedCharts: 0,
    pendingCharts: 0,
    blockedCheckouts: 0,
    mdReviewPending: 0,
  };

  const handleCreateChart = useCallback(async () => {
    if (!newChartForm.templateType || !newChartForm.clientName) return;
    setCreating(true);
    try {
      const res = await fetch('/api/dashboard/charting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: newChartForm.templateType,
          clientName: newChartForm.clientName,
          providerName: newChartForm.providerName,
          appointmentDate: newChartForm.appointmentDate,
          data: {},
        }),
      });
      const result = await res.json();
      if (result.success && result.recordId) {
        router.push(`/dashboard/charting/${result.recordId}`);
      }
    } catch (err) {
      console.error('Failed to create chart:', err);
    } finally {
      setCreating(false);
    }
  }, [newChartForm, router]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1D2C] font-[Playfair_Display]">
            Clinical Charting
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Every treatment must be charted before checkout. No exceptions.
          </p>
        </div>
        <button
          onClick={() => setShowNewChart(!showNewChart)}
          className="flex items-center gap-2 rounded-lg bg-[#C9A96E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b89960] shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Chart
        </button>
      </div>

      {/* Compliance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Today</p>
          <p className="text-2xl font-bold text-[#0F1D2C]">{compliance.totalChartsToday}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-emerald-600 uppercase tracking-wide">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{compliance.completedCharts}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-amber-600 uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{compliance.pendingCharts}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-red-600 uppercase tracking-wide">Blocked</p>
          <p className="text-2xl font-bold text-red-600">{compliance.blockedCheckouts}</p>
        </div>
        <div className="rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-purple-600 uppercase tracking-wide">MD Review</p>
          <p className="text-2xl font-bold text-purple-600">{compliance.mdReviewPending}</p>
        </div>
      </div>

      {/* New Chart Form */}
      {showNewChart && (
        <div className="rounded-xl border border-[#C9A96E]/20 bg-[#F8F6F1] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0F1D2C] mb-4">Create New Chart</h3>

          {/* Template Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {TEMPLATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNewChartForm((f) => ({ ...f, templateType: opt.value }))}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition ${
                    newChartForm.templateType === opt.value
                      ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Client & Provider */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input
                type="text"
                value={newChartForm.clientName}
                onChange={(e) => setNewChartForm((f) => ({ ...f, clientName: e.target.value }))}
                placeholder="Search client..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select
                value={newChartForm.providerName}
                onChange={(e) => setNewChartForm((f) => ({ ...f, providerName: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50"
              >
                <option value="Mom">Mom (Sukhraj)</option>
                <option value="Rina">Rina</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newChartForm.appointmentDate}
                onChange={(e) => setNewChartForm((f) => ({ ...f, appointmentDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowNewChart(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateChart}
              disabled={!newChartForm.templateType || !newChartForm.clientName || creating}
              className="rounded-lg bg-[#0F1D2C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a2d42] disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create & Open Chart'}
            </button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name..."
            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50"
          />
        </div>
        <select
          value={filterTemplate}
          onChange={(e) => setFilterTemplate(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50"
        >
          <option value="">All Types</option>
          {TEMPLATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="complete">Complete</option>
          <option value="signed">Signed</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      {/* Charts List */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load charts. The Chart Notes table may need to be created in Airtable.</p>
          </div>
        ) : charts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No charts found</p>
            <p className="text-sm mt-1">Create a new chart to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Provider</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Compliance</th>
                <th className="px-4 py-3 text-left">MD Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {charts.map((chart) => {
                const badge = STATUS_BADGE[chart.status] || STATUS_BADGE.draft;
                const templateLabel = TEMPLATE_OPTIONS.find((t) => t.value === chart.templateType)?.label || chart.templateType;
                const templateIcon = TEMPLATE_OPTIONS.find((t) => t.value === chart.templateType)?.icon;

                return (
                  <tr
                    key={chart.id}
                    onClick={() => router.push(`/dashboard/charting/${chart.id}`)}
                    className="cursor-pointer transition hover:bg-[#F8F6F1]"
                  >
                    <td className="px-4 py-3 font-medium text-[#0F1D2C]">{chart.clientName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        {templateIcon}
                        <span>{templateLabel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{chart.providerName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {chart.appointmentDate
                        ? new Date(chart.appointmentDate + 'T12:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : ' - '}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${badge.color}`}>
                        {badge.icon}
                        {chart.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {chart.complianceStatus === 'complete' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {chart.requiresMdReview ? (
                        chart.mdReviewDate ? (
                          <span className="text-xs text-purple-600">Reviewed</span>
                        ) : (
                          <span className="text-xs text-red-500 font-medium">Pending</span>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
