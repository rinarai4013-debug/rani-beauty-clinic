'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import { useRevenueData } from '@/hooks/useDashboardData';
import type { DateRange, RevenueData } from '@/types/dashboard';

const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'wtd' },
  { label: 'This Month', value: 'mtd' },
  { label: 'Last 30 Days', value: 'last30' },
  { label: 'YTD', value: 'ytd' },
];

const PIE_COLORS = ['#F3D6BE', '#0F1D2C', '#C9A96E', '#3B82F6', '#10B981', '#EF4444'];

export default function RevenueDashboard() {
  const [range, setRange] = useState<DateRange>('wtd');
  const { data, isLoading } = useRevenueData(range) as { data: RevenueData | undefined; isLoading: boolean };

  const summary = data?.summary || { gross: 0, net: 0, deposits: 0, refunds: 0, outstanding: 0, revenuePerHour: 0, revenuePerVisit: 0 };
  const dailyData = (data?.daily || []).map(d => ({
    day: d.date?.split('-').pop() || '',
    revenue: d.amount,
  }));
  const providerData = (data?.byProvider || []).map((p, i) => ({
    name: p.provider,
    value: p.revenue,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));
  const categoryData = data?.byCategory || [];
  const totalCatRevenue = categoryData.reduce((s, c) => s + c.revenue, 0);
  const monthlyData = (data?.monthly || []).map(m => ({
    month: m.date,
    revenue: m.amount,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading text-rani-navy">Revenue Center</h1>
          <p className="text-sm font-body text-rani-muted mt-1">Track every dollar</p>
        </div>
        <div className="flex gap-1 bg-rani-cream rounded-lg p-1">
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                range === r.value
                  ? 'bg-white text-rani-navy shadow-sm'
                  : 'text-rani-muted hover:text-rani-text'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard title="Gross Revenue" value={summary.gross} prefix="$" icon="dollar-sign" size="hero" />
        <KPICard title="Net Revenue" value={summary.net} prefix="$" icon="dollar-sign" />
        <KPICard title="Revenue/Visit" value={summary.revenuePerVisit} prefix="$" />
        <KPICard title="Revenue/Hour" value={summary.revenuePerHour} prefix="$" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Daily Revenue
          </h3>
          <div className="h-64">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-rani-muted font-body text-sm">Loading...</div>
            ) : dailyData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-rani-muted font-body text-sm">No revenue data for this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#F3D6BE" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Provider Split Pie */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            By Provider
          </h3>
          {providerData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-rani-muted font-body text-sm">No provider data.</div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={providerData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {providerData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {providerData.map((p) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-sm font-body text-rani-text">{p.name}</span>
                    </div>
                    <span className="text-sm font-body font-semibold text-rani-navy">
                      ${p.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
          Revenue by Service Category
        </h3>
        {categoryData.length === 0 ? (
          <div className="text-center py-8 text-rani-muted font-body text-sm">No category data for this period.</div>
        ) : (
          <div className="space-y-3">
            {categoryData.map((cat) => {
              const pct = totalCatRevenue > 0 ? Math.round((cat.revenue / totalCatRevenue) * 100) : 0;
              return (
                <div key={cat.category} className="flex items-center gap-4">
                  <span className="text-sm font-body text-rani-text w-40 truncate">{cat.category}</span>
                  <div className="flex-1">
                    <ProgressBar current={pct} target={100} showPercentage={false} height={8} colorMode="gold" />
                  </div>
                  <span className="text-sm font-body font-semibold text-rani-navy w-20 text-right">
                    ${cat.revenue.toLocaleString()}
                  </span>
                  <span className="text-xs font-body text-rani-muted w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly Trend */}
      {monthlyData.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Monthly Revenue Trend
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#F3D6BE" strokeWidth={3} dot={{ fill: '#0F1D2C', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
