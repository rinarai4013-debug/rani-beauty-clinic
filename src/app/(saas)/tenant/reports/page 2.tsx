/**
 * Tenant Dashboard — Reports Library Page
 */

'use client';

import { useState } from 'react';
import { useTenantReports } from '@/hooks/useTenantDashboard';
import type { ReportId } from '@/lib/saas/tenant-dashboard/reports';

const CATEGORY_LABELS: Record<string, string> = {
  financial: 'Financial',
  operational: 'Operational',
  marketing: 'Marketing',
  clinical: 'Clinical',
  custom: 'Custom',
};

export default function TenantReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportId | null>(null);
  const [category, setCategory] = useState<string>('all');
  const { data: reportDefs } = useTenantReports();

  const filteredReports = reportDefs?.filter(r => category === 'all' || r.category === category) ?? [];
  const categories = ['all', ...new Set(reportDefs?.map(r => r.category) ?? [])];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500 mt-1">{reportDefs?.length ?? 0} pre-built reports available</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800">
          Custom Report Builder
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap capitalize transition-colors ${
              category === cat ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {cat === 'all' ? 'All Reports' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Report Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => (
          <div key={report.id}
            className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
              selectedReport === report.id ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200'
            }`}
            onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}>
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                report.category === 'financial' ? 'bg-green-100 text-green-700' :
                report.category === 'operational' ? 'bg-blue-100 text-blue-700' :
                report.category === 'marketing' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {CATEGORY_LABELS[report.category] || report.category}
              </span>
              <span className="text-xs text-gray-400 capitalize">{report.requiredTier}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{report.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{report.description}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="flex gap-1">
                {report.chartTypes.slice(0, 3).map((ct) => (
                  <span key={ct} className="text-xs text-gray-400 capitalize">{ct}</span>
                ))}
              </div>
              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Generate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Scheduling Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Report Scheduling</h3>
        <p className="text-sm text-gray-500">Schedule reports for automatic delivery via email. Choose daily, weekly, or monthly frequency.</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Daily Reports</p>
            <p className="text-lg font-bold text-gray-900">0 scheduled</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Weekly Reports</p>
            <p className="text-lg font-bold text-gray-900">0 scheduled</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Monthly Reports</p>
            <p className="text-lg font-bold text-gray-900">0 scheduled</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Export Options</h3>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50">Export to CSV</button>
          <button className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50">Export to PDF</button>
          <button className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50">Download All Reports</button>
        </div>
      </div>
    </div>
  );
}
