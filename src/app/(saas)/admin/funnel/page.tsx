'use client';

import { useState } from 'react';

const STAGES = [
  { name: 'Visitors', count: 12450, color: 'bg-gray-400' },
  { name: 'Leads', count: 847, color: 'bg-blue-400' },
  { name: 'MQLs', count: 312, color: 'bg-indigo-400' },
  { name: 'Demos Booked', count: 156, color: 'bg-purple-400' },
  { name: 'Demos Done', count: 98, color: 'bg-pink-400' },
  { name: 'Trials Started', count: 72, color: 'bg-orange-400' },
  { name: 'Trials Active', count: 34, color: 'bg-amber-400' },
  { name: 'Paid', count: 47, color: 'bg-emerald-400' },
];

const RECENT_LEADS = [
  { name: 'Glow Aesthetics', email: 'sarah@glowaesthetics.com', providers: 4, software: 'Mindbody', score: 72, stage: 'Demo Booked', daysAgo: 1 },
  { name: 'Luxe Med Spa', email: 'jessica@luxemedspa.com', providers: 2, software: 'None', score: 85, stage: 'Trial Active', daysAgo: 3 },
  { name: 'Zen Beauty', email: 'emily@zenbeauty.com', providers: 7, software: 'Vagaro', score: 64, stage: 'MQL', daysAgo: 5 },
  { name: 'Radiance Clinic', email: 'dr.chen@radianceclinic.com', providers: 12, software: 'Boulevard', score: 91, stage: 'Demo Completed', daysAgo: 2 },
  { name: 'Pure Skin Studio', email: 'amanda@pureskinstudio.com', providers: 1, software: 'Spreadsheets', score: 58, stage: 'Lead', daysAgo: 0 },
];

const AB_TESTS = [
  { name: 'Welcome Email Subject', variants: ['A: "Welcome to RaniOS"', 'B: "Your Clinic, Automated"'], winner: 'B', improvement: '+12% open rate' },
  { name: 'CTA Button Text', variants: ['A: "Start Free Trial"', 'B: "Get Started Free"'], winner: null, improvement: 'Running...' },
  { name: 'Pricing Page Layout', variants: ['A: 3-column', 'B: Horizontal cards'], winner: 'A', improvement: '+8% conversion' },
];

export default function FunnelDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const maxCount = STAGES[0].count;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Funnel</h1>
          <p className="text-sm text-gray-500 mt-1">Lead capture, scoring, and conversion tracking</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-6">Conversion Funnel</h2>
        <div className="space-y-3">
          {STAGES.map((stage, i) => {
            const width = Math.max(8, (stage.count / maxCount) * 100);
            const convRate = i > 0 ? ((stage.count / STAGES[i - 1].count) * 100).toFixed(1) : '100';
            return (
              <div key={stage.name} className="flex items-center gap-4">
                <div className="w-28 text-right">
                  <p className="text-xs font-medium text-gray-700">{stage.name}</p>
                </div>
                <div className="flex-1 relative">
                  <div
                    className={`h-8 ${stage.color} rounded-lg transition-all relative flex items-center`}
                    style={{ width: `${width}%` }}
                  >
                    <span className="absolute right-2 text-xs font-bold text-white">
                      {stage.count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className="text-xs text-gray-500">{convRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">Overall Visitor-to-Paid: {((47 / 12450) * 100).toFixed(2)}%</span>
          <span className="text-xs text-gray-500">Pipeline Value: $284,000</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Leads This Month', value: '127', change: '+23%' },
          { label: 'Avg Lead Score', value: '68', change: '+5 pts' },
          { label: 'Avg Days to Convert', value: '14', change: '-3 days' },
          { label: 'Pipeline Velocity', value: '1.6/day', change: '+0.3' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">{kpi.change}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Recent Leads</h2>
          <div className="space-y-3">
            {RECENT_LEADS.map((lead) => (
              <div key={lead.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                  <p className="text-xs text-gray-500">{lead.providers} providers - {lead.software}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      lead.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      lead.score >= 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      Score: {lead.score}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{lead.stage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* A/B Tests */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">A/B Tests</h2>
          <div className="space-y-4">
            {AB_TESTS.map((test) => (
              <div key={test.name} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">{test.name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    test.winner ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {test.winner ? `Winner: ${test.winner}` : 'Running'}
                  </span>
                </div>
                <div className="space-y-1">
                  {test.variants.map((v) => (
                    <p key={v} className="text-xs text-gray-500">{v}</p>
                  ))}
                </div>
                <p className="text-xs text-emerald-600 font-medium mt-2">{test.improvement}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
