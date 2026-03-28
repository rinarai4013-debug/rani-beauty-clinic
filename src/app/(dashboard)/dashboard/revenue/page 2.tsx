'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import { DashboardErrorBoundary, KPIRowSkeleton, ChartSkeleton, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { useRevenueData } from '@/hooks/useDashboardData';
import type { DateRange, RevenueData } from '@/types/dashboard';

const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: 'Today', value: 'today' },
  { label: 'WTD', value: 'wtd' },
  { label: 'MTD', value: 'mtd' },
  { label: 'Last 30', value: 'last30' },
  { label: 'YTD', value: 'ytd' },
];

const PIE_COLORS = ['#F3D6BE', '#0F1D2C', '#C9A96E', '#3B82F6', '#10B981', '#EF4444'];

export default function RevenueDashboard() {
  const [range, setRange] = useState<DateRange>('wtd');
  const { data, isLoading, error, mutate } = useRevenueData(range) as { data: RevenueData | undefined; isLoading: boolean; error: unknown; mutate: () => void };

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
    <DashboardErrorBoundary pageName="Revenue">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Revenue Center</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Track every dollar</p>
          </div>
          <div className="flex gap-1 bg-rani-cream rounded-lg p-1 overflow-x-auto">
            {DATE_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all whitespace-nowrap ${
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
        {error ? (
          <InlineError message="Failed to load revenue data" onRetry={() => mutate()} />
        ) : isLoading ? (
          <KPIRowSkeleton />
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
            <KPICard title="Gross Revenue" value={summary.gross} prefix="$" icon="dollar-sign" size="hero" />
            <KPICard title="Net Revenue" value={summary.net} prefix="$" icon="dollar-sign" />
            <KPICard title="Revenue/Visit" value={summary.revenuePerVisit} prefix="$" />
            <KPICard title="Revenue/Hour" value={summary.revenuePerHour} prefix="$" />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Daily Revenue Bar Chart */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Daily Revenue
            </h3>
            <div className="h-48 sm:h-64">
              {isLoading ? (
                <div className="flex items-end gap-1.5 h-full animate-pulse">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-gray-100 rounded-t" style={{ height: `${30 + Math.random() * 60}%` }} />
                  ))}
                </div>
              ) : dailyData.length === 0 ? (
                <DashboardEmptyState icon="dollar" title="No revenue data" description="Revenue will appear once transactions are recorded." compact />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
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
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              By Provider
            </h3>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="w-36 h-36 mx-auto bg-gray-100 rounded-full" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-100 rounded" />
                  <div className="h-3 w-3/4 bg-gray-100 rounded" />
                </div>
              </div>
            ) : providerData.length === 0 ? (
              <DashboardEmptyState icon="users" title="No provider data" compact />
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
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
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
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Revenue by Service Category
          </h3>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : categoryData.length === 0 ? (
            <DashboardEmptyState icon="chart" title="No category data" description="Service categories will populate as revenue is recorded." compact />
          ) : (
            <div className="space-y-3">
              {categoryData.map((cat) => {
                const pct = totalCatRevenue > 0 ? Math.round((cat.revenue / totalCatRevenue) * 100) : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-2 sm:gap-4">
                    <span className="text-xs sm:text-sm font-body text-rani-text w-28 sm:w-40 truncate flex-shrink-0">{cat.category}</span>
                    <div className="flex-1 min-w-0">
                      <ProgressBar current={pct} target={100} showPercentage={false} height={8} colorMode="gold" />
                    </div>
                    <span className="text-xs sm:text-sm font-body font-semibold text-rani-navy w-16 sm:w-20 text-right flex-shrink-0">
                      ${cat.revenue.toLocaleString()}
                    </span>
                    <span className="text-[10px] sm:text-xs font-body text-rani-muted w-8 sm:w-10 text-right flex-shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        {monthlyData.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Monthly Revenue Trend
            </h3>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#F3D6BE" strokeWidth={3} dot={{ fill: '#0F1D2C', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
