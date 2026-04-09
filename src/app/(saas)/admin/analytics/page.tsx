'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

// =============================================================================
// Platform Analytics Admin Page
// Key metrics, revenue trends, feature adoption, risk, growth, benchmarking
// =============================================================================

// Revenue trend data (12 months)
const revenueTrend = [
  { month: 'Apr', mrr: 12400, arr: 148800, tenants: 18 },
  { month: 'May', mrr: 15200, arr: 182400, tenants: 22 },
  { month: 'Jun', mrr: 18900, arr: 226800, tenants: 26 },
  { month: 'Jul', mrr: 22100, arr: 265200, tenants: 30 },
  { month: 'Aug', mrr: 25800, arr: 309600, tenants: 33 },
  { month: 'Sep', mrr: 28400, arr: 340800, tenants: 35 },
  { month: 'Oct', mrr: 31200, arr: 374400, tenants: 38 },
  { month: 'Nov', mrr: 34500, arr: 414000, tenants: 40 },
  { month: 'Dec', mrr: 36800, arr: 441600, tenants: 42 },
  { month: 'Jan', mrr: 38400, arr: 460800, tenants: 44 },
  { month: 'Feb', mrr: 40100, arr: 481200, tenants: 45 },
  { month: 'Mar', mrr: 42800, arr: 513600, tenants: 47 },
];

const featureAdoption = [
  { feature: 'AI Intake', adoption: 92, trend: '+3%' },
  { feature: 'Consult Co-pilot', adoption: 88, trend: '+5%' },
  { feature: 'Schedule Optimizer', adoption: 85, trend: '+2%' },
  { feature: 'Review Commander', adoption: 81, trend: '+8%' },
  { feature: 'Churn Prediction', adoption: 78, trend: '+4%' },
  { feature: 'Social Engine', adoption: 71, trend: '+6%' },
  { feature: 'P&L Intelligence', adoption: 67, trend: '+3%' },
  { feature: 'Dynamic Pricing', adoption: 64, trend: '-1%' },
  { feature: 'Inventory Mgmt', adoption: 59, trend: '+7%' },
  { feature: 'Meta Ads AI', adoption: 56, trend: '+12%' },
  { feature: 'Phone Agent', adoption: 42, trend: '+15%' },
  { feature: 'Knowledge Base', adoption: 38, trend: '+9%' },
];

const engagementData = [
  { feature: 'Dashboard', value: 95 },
  { feature: 'AI Tools', value: 82 },
  { feature: 'Automation', value: 76 },
  { feature: 'Analytics', value: 68 },
  { feature: 'Settings', value: 45 },
  { feature: 'API', value: 32 },
];

const churnRiskDistribution = [
  { name: 'Low Risk', value: 30, color: '#059669' },
  { name: 'Medium Risk', value: 10, color: '#F59E0B' },
  { name: 'High Risk', value: 5, color: '#EF4444' },
  { name: 'Critical', value: 2, color: '#7F1D1D' },
];

const churnPredictions = [
  { tenant: 'Ethereal Med Aesthetics', score: 82, reason: 'Login frequency dropped 60% in 30 days', plan: 'Pro', mrr: 499, daysAtRisk: 14 },
  { tenant: 'Aura Skin Clinic', score: 68, reason: 'Only using 2 of 12 available features', plan: 'Starter', mrr: 199, daysAtRisk: 21 },
  { tenant: 'Nova Aesthetics', score: 61, reason: 'Support ticket escalations increased', plan: 'Pro', mrr: 499, daysAtRisk: 7 },
  { tenant: 'Crystal Clear Clinic', score: 55, reason: 'Failed payment + no dashboard access in 14 days', plan: 'Starter', mrr: 199, daysAtRisk: 30 },
  { tenant: 'Premier Skin Center', score: 48, reason: 'Downgrade inquiry submitted', plan: 'Pro', mrr: 499, daysAtRisk: 3 },
];

const tierDistribution = [
  { name: 'Starter ($199)', value: 22, color: '#6B7280' },
  { name: 'Pro ($499)', value: 18, color: '#0F1D2C' },
  { name: 'Enterprise ($999)', value: 7, color: '#C9A96E' },
];

const conversionFunnel = [
  { stage: 'Website Visitors', count: 12400, rate: '100%' },
  { stage: 'Demo Requests', count: 842, rate: '6.8%' },
  { stage: 'Demos Completed', count: 624, rate: '74.1%' },
  { stage: 'Trial Started', count: 312, rate: '50.0%' },
  { stage: 'Trial Activated', count: 218, rate: '69.9%' },
  { stage: 'Converted to Paid', count: 156, rate: '71.6%' },
];

const benchmarkData = [
  { metric: 'Logo-to-Signup', ours: 6.8, industry: 3.2, unit: '%' },
  { metric: 'Trial-to-Paid', ours: 50.0, industry: 25.0, unit: '%' },
  { metric: 'Monthly Churn', ours: 3.2, industry: 6.5, unit: '%' },
  { metric: 'NRR', ours: 112, industry: 100, unit: '%' },
  { metric: 'LTV:CAC', ours: 4.8, industry: 3.0, unit: 'x' },
  { metric: 'Time to Value', ours: 3, industry: 14, unit: 'days' },
];

const unitEconomics = {
  cac: 820,
  ltv: 3940,
  ltvCac: 4.8,
  paybackMonths: 4.2,
  arpu: 456,
  grossMargin: 82,
  nrr: 112,
  grr: 96.8,
};

type TabId = 'overview' | 'revenue' | 'growth' | 'health';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '12m'>('12m');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Revenue, growth, feature adoption, and platform health intelligence</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['7d', '30d', '90d', '12m'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeRange === range ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { id: 'overview' as TabId, label: 'Overview' },
          { id: 'revenue' as TabId, label: 'Revenue & Economics' },
          { id: 'growth' as TabId, label: 'Growth & Funnel' },
          { id: 'health' as TabId, label: 'Health & Churn' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all text-center ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Monthly Recurring Revenue', value: '$42,800', change: '+23.7%', positive: true },
              { label: 'Annual Run Rate', value: '$513.6K', change: '+12.4%', positive: true },
              { label: 'Total Tenants', value: '47', change: '+8 this month', positive: true },
              { label: 'Net Revenue Retention', value: '112%', change: '+4pp', positive: true },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <span className={`text-xs font-semibold ${stat.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* MRR Trend + Tier Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">MRR Growth Trend</h3>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={revenueTrend} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F1D2C" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0F1D2C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}K`} />
                  <Tooltip
                    formatter={((value: number) => [`$${value.toLocaleString()}`, 'MRR']) as any}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="mrr" stroke="#0F1D2C" strokeWidth={2.5} fill="url(#mrrGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Tier Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={tierDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {tierDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={((value: number, name: string) => [`${value} tenants`, name]) as any}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {tierDistribution.map((tier) => (
                  <div key={tier.name} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{tier.name}</span>
                    <span className="font-bold text-gray-900">{tier.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Adoption + Engagement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Feature Adoption Rates</h3>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={featureAdoption} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="feature" type="category" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                  <Tooltip
                    formatter={((value: number) => [`${value}%`, 'Adoption']) as any}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="adoption" fill="#0F1D2C" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Tenant Engagement Radar</h3>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={engagementData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="feature" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Radar name="Avg Engagement" dataKey="value" stroke="#0F1D2C" fill="#0F1D2C" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: 'Avg DAU/MAU', value: '72%' },
                  { label: 'Avg Session', value: '18 min' },
                  { label: 'Power Users', value: '34%' },
                  { label: 'Feature Breadth', value: '6.2 avg' },
                ].map((stat) => (
                  <div key={stat.label} className="p-2 bg-gray-50 rounded-lg text-center">
                    <p className="text-[10px] text-gray-500">{stat.label}</p>
                    <p className="text-sm font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Revenue & Economics Tab ───────────────────────────── */}
      {activeTab === 'revenue' && (
        <>
          {/* Unit Economics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'CAC', value: `$${unitEconomics.cac}`, desc: 'Cost to acquire' },
              { label: 'LTV', value: `$${unitEconomics.ltv.toLocaleString()}`, desc: 'Lifetime value' },
              { label: 'LTV:CAC', value: `${unitEconomics.ltvCac}x`, desc: 'Target: 3x+' },
              { label: 'Payback', value: `${unitEconomics.paybackMonths}mo`, desc: 'Months to recover' },
              { label: 'ARPU', value: `$${unitEconomics.arpu}`, desc: 'Avg revenue/user' },
              { label: 'Gross Margin', value: `${unitEconomics.grossMargin}%`, desc: 'After COGS' },
              { label: 'NRR', value: `${unitEconomics.nrr}%`, desc: 'Net revenue retention' },
              { label: 'GRR', value: `${unitEconomics.grr}%`, desc: 'Gross revenue retention' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{stat.desc}</p>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Growth (MRR + Tenant Count)</h3>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={revenueTrend} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}K`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Line yAxisId="left" type="monotone" dataKey="mrr" stroke="#0F1D2C" strokeWidth={2.5} name="MRR" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="tenants" stroke="#C9A96E" strokeWidth={2} name="Tenants" dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Benchmark Comparison */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Industry Benchmark Comparison</h3>
            <div className="space-y-3">
              {benchmarkData.map((b) => {
                const isBetter = b.metric === 'Monthly Churn' || b.metric === 'Time to Value'
                  ? b.ours < b.industry
                  : b.ours > b.industry;
                return (
                  <div key={b.metric} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className="w-32 flex-shrink-0">
                      <p className="text-xs font-medium text-gray-700">{b.metric}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">RaniOS</span>
                        <span className="text-xs font-bold text-gray-900">{b.ours}{b.unit}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isBetter ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min((b.ours / Math.max(b.ours, b.industry)) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-400">Industry avg</span>
                        <span className="text-[10px] text-gray-400">{b.industry}{b.unit}</span>
                      </div>
                    </div>
                    <div className={`w-16 text-right text-xs font-bold ${isBetter ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isBetter ? 'Above' : 'Below'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Growth & Funnel Tab ──────────────────────────────── */}
      {activeTab === 'growth' && (
        <>
          {/* Growth Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'MoM Growth Rate', value: '6.7%', sub: 'Revenue growth' },
              { label: 'New Tenants / Month', value: '8', sub: 'Avg last 3 months' },
              { label: 'Demo-to-Trial', value: '50%', sub: 'Conversion rate' },
              { label: 'Trial-to-Paid', value: '71.6%', sub: 'Activation rate' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
            <div className="space-y-2">
              {conversionFunnel.map((step, i) => {
                const widthPct = (step.count / conversionFunnel[0].count) * 100;
                return (
                  <div key={step.stage} className="flex items-center gap-4">
                    <div className="w-36 flex-shrink-0">
                      <p className="text-xs font-medium text-gray-700">{step.stage}</p>
                    </div>
                    <div className="flex-1 relative">
                      <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg flex items-center justify-end pr-3 transition-all"
                          style={{
                            width: `${Math.max(widthPct, 8)}%`,
                            backgroundColor: `rgba(15, 29, 44, ${0.15 + (i * 0.15)})`,
                          }}
                        >
                          <span className="text-xs font-bold text-gray-800">
                            {step.count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-xs font-semibold text-gray-600">{step.rate}</span>
                    </div>
                    {i > 0 && (
                      <div className="w-16 text-right">
                        <span className="text-[10px] text-gray-400">
                          {((step.count / conversionFunnel[i - 1].count) * 100).toFixed(1)}% step
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tenant Growth Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tenant Growth Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrend} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tenantGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="tenants" stroke="#C9A96E" strokeWidth={2.5} fill="url(#tenantGrad)" name="Total Tenants" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Feature Adoption Table */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Feature Adoption Detail</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Feature</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Adoption</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Trend</th>
                    <th className="text-left py-2 pl-4 text-gray-500 font-medium">Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {featureAdoption.map((f) => (
                    <tr key={f.feature} className="border-b border-gray-50">
                      <td className="py-2 font-medium text-gray-900">{f.feature}</td>
                      <td className="text-right py-2 font-bold text-gray-900">{f.adoption}%</td>
                      <td className={`text-right py-2 font-semibold ${f.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                        {f.trend}
                      </td>
                      <td className="py-2 pl-4">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0F1D2C] rounded-full" style={{ width: `${f.adoption}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Health & Churn Tab ────────────────────────────────── */}
      {activeTab === 'health' && (
        <>
          {/* Health Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Platform Health', value: '96/100', positive: true, change: '+2' },
              { label: 'Monthly Churn', value: '3.2%', positive: true, change: '-0.8%' },
              { label: 'At-Risk Tenants', value: '7', positive: false, change: '+2' },
              { label: 'MRR at Risk', value: '$2,894', positive: false, change: '+$498' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <span className={`text-xs font-semibold ${stat.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Churn Risk Pie + Top Risks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Churn Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={churnRiskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {churnRiskDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={((value: number, name: string) => [`${value} tenants`, name]) as any}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Churn Risks</h3>
              <div className="space-y-3">
                {churnPredictions.map((tenant) => (
                  <div key={tenant.tenant} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{tenant.tenant}</p>
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                          {tenant.plan}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{tenant.reason}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">At risk for {tenant.daysAtRisk} days</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">${tenant.mrr}/mo</p>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white ${
                          tenant.score >= 70 ? 'bg-red-500' : tenant.score >= 50 ? 'bg-amber-500' : 'bg-amber-400'
                        }`}
                      >
                        {tenant.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Indicators */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Risk Indicators</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: 'Failed Payments', value: '3', severity: 'high', desc: '2 Starter, 1 Pro' },
                { label: 'Inactive 7+ Days', value: '4', severity: 'medium', desc: 'No login activity' },
                { label: 'Low Feature Usage', value: '6', severity: 'medium', desc: 'Using < 3 features' },
                { label: 'Support Escalations', value: '2', severity: 'low', desc: 'Last 30 days' },
                { label: 'Downgrade Requests', value: '1', severity: 'medium', desc: 'Pro to Starter' },
                { label: 'Contract Expiring', value: '3', severity: 'low', desc: 'Next 30 days' },
              ].map((risk) => (
                <div key={risk.label} className={`p-4 rounded-xl border ${
                  risk.severity === 'high' ? 'border-red-200 bg-red-50' :
                  risk.severity === 'medium' ? 'border-amber-200 bg-amber-50' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-700">{risk.label}</p>
                    <span className={`text-lg font-bold ${
                      risk.severity === 'high' ? 'text-red-600' :
                      risk.severity === 'medium' ? 'text-amber-600' :
                      'text-gray-600'
                    }`}>{risk.value}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">{risk.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
