'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from 'recharts';
import KPICard from '@/components/dashboard/cards/KPICard';
import { DashboardErrorBoundary, KPIRowSkeleton, ChartSkeleton, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { GLP1DashboardData } from '@/app/api/dashboard/glp1/route';

const TIER_COLORS: Record<string, string> = {
  Starter: '#F3D6BE',
  Premium: '#C9A96E',
  VIP: '#0F1D2C',
};

const PIPELINE_COLORS = ['#E5E7EB', '#F3D6BE', '#C9A96E', '#1A2A3C', '#059669', '#0F1D2C'];

function useGLP1Data() {
  return useDashboardData<GLP1DashboardData>('/glp1', {
    refreshInterval: 60000,
  });
}

export default function GLP1Dashboard() {
  const { data, isLoading, error, mutate } = useGLP1Data();
  const [showRevenue, setShowRevenue] = useState(true);

  const summary = data?.summary || {
    activePatients: 0, totalRevenue: 0, monthlyRevenue: 0,
    avgLifetimeMonths: 0, churnRate: 0, crossSellRate: 0,
    newPatientsThisMonth: 0, pipeline: 0,
  };

  const tierData = data?.byTier || [];
  const totalTierPatients = tierData.reduce((s, t) => s + t.count, 0);
  const pipelineData = data?.pipeline || [];
  const crossSells = data?.crossSells || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <DashboardErrorBoundary pageName="GLP-1 Program">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">GLP-1 Weight Management</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Program tracking &middot; Enrollment pipeline &middot; Cross-sell analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-rani-cream px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 bg-rani-success rounded-full animate-pulse" />
              <span className="font-body text-xs text-rani-navy font-medium">
                {summary.activePatients} Active Patients
              </span>
            </span>
          </div>
        </div>

        {/* Hero KPIs */}
        {error ? (
          <InlineError message="Failed to load GLP-1 data" onRetry={() => mutate()} />
        ) : isLoading ? (
          <KPIRowSkeleton />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KPICard
              title="Active Patients"
              value={summary.activePatients}
              icon="users"
              size="hero"
            />
            <KPICard
              title="Monthly Program Revenue"
              value={summary.monthlyRevenue}
              prefix="$"
              icon="dollar-sign"
              size="hero"
            />
            <KPICard
              title="Avg Lifetime"
              value={summary.avgLifetimeMonths}
              suffix=" mo"
            />
            <KPICard
              title="New This Month"
              value={summary.newPatientsThisMonth}
              icon="users"
            />
          </div>
        )}

        {/* Secondary KPIs */}
        {!isLoading && !error && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KPICard title="Churn Rate" value={summary.churnRate} suffix="%" />
            <KPICard title="Cross-sell Rate" value={summary.crossSellRate} suffix="%" />
            <KPICard title="Pipeline" value={summary.pipeline} icon="target" />
            <KPICard title="Total Revenue (All Time)" value={summary.totalRevenue} prefix="$" />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Patients by Tier */}
          <div className="bg-white rounded-xl border border-rani-border p-6">
            <h2 className="font-heading text-lg text-rani-navy mb-4">Patients by Tier</h2>
            {totalTierPatients === 0 ? (
              <DashboardEmptyState
                title="No enrolled patients yet"
                description="Patient tier distribution will appear here as patients enroll."
              />
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-40 h-40 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tierData.filter(t => t.count > 0)}
                        dataKey="count"
                        nameKey="tier"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={65}
                      >
                        {tierData.map((t) => (
                          <Cell key={t.tier} fill={TIER_COLORS[t.tier] || '#ccc'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {tierData.map((t) => (
                    <div key={t.tier} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: TIER_COLORS[t.tier] }} />
                        <span className="font-body text-sm text-rani-navy">{t.tier}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-body text-sm font-bold text-rani-navy">{t.count}</span>
                        <span className="font-body text-xs text-rani-muted ml-2">
                          ${t.revenue.toLocaleString()}/mo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-xl border border-rani-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg text-rani-navy">Monthly Trend</h2>
              <div className="flex gap-1 bg-rani-cream rounded-lg p-0.5">
                <button
                  onClick={() => setShowRevenue(true)}
                  className={`px-3 py-1 rounded-md text-xs font-body font-medium transition-all ${
                    showRevenue ? 'bg-white text-rani-navy shadow-sm' : 'text-rani-muted'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setShowRevenue(false)}
                  className={`px-3 py-1 rounded-md text-xs font-body font-medium transition-all ${
                    !showRevenue ? 'bg-white text-rani-navy shadow-sm' : 'text-rani-muted'
                  }`}
                >
                  Patients
                </button>
              </div>
            </div>
            {monthlyTrend.length === 0 ? (
              <DashboardEmptyState
                title="No trend data yet"
                description="Monthly trends will populate as the program grows."
              />
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <Tooltip />
                    {showRevenue ? (
                      <Area type="monotone" dataKey="revenue" stroke="#C9A96E" fill="#F3D6BE" fillOpacity={0.5} />
                    ) : (
                      <Area type="monotone" dataKey="patients" stroke="#0F1D2C" fill="#1A2A3C" fillOpacity={0.2} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline + Cross-sell */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Enrollment Pipeline */}
          <div className="bg-white rounded-xl border border-rani-border p-6">
            <h2 className="font-heading text-lg text-rani-navy mb-4">Enrollment Pipeline</h2>
            <div className="space-y-3">
              {pipelineData.map((stage, i) => {
                const maxCount = Math.max(...pipelineData.map(s => s.count), 1);
                const pct = (stage.count / maxCount) * 100;
                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body text-xs text-rani-navy">{stage.stage}</span>
                      <span className="font-body text-xs font-bold text-rani-navy">{stage.count}</span>
                    </div>
                    <div className="w-full bg-rani-cream rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: PIPELINE_COLORS[i % PIPELINE_COLORS.length],
                        }}
                      />
                    </div>
                    {stage.avgDaysInStage > 0 && (
                      <p className="font-body text-[10px] text-rani-muted mt-0.5">
                        Avg {stage.avgDaysInStage}d in stage
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cross-sell Performance */}
          <div className="bg-white rounded-xl border border-rani-border p-6">
            <h2 className="font-heading text-lg text-rani-navy mb-4">Cross-sell Performance</h2>
            {crossSells.every(c => c.count === 0) ? (
              <DashboardEmptyState
                title="No cross-sells yet"
                description="Track which medspa services GLP-1 patients book."
              />
            ) : (
              <div className="space-y-3">
                {crossSells.map((cs) => (
                  <div key={cs.service} className="flex items-center justify-between py-2 border-b border-rani-border last:border-0">
                    <div>
                      <p className="font-body text-sm text-rani-navy font-medium">{cs.service}</p>
                      <p className="font-body text-xs text-rani-muted">
                        {cs.count} bookings &middot; {cs.conversionRate}% conversion
                      </p>
                    </div>
                    <span className="font-body text-sm font-bold text-rani-navy">
                      ${cs.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tier Revenue Breakdown */}
        <div className="bg-white rounded-xl border border-rani-border p-6">
          <h2 className="font-heading text-lg text-rani-navy mb-4">Revenue by Tier</h2>
          {tierData.every(t => t.count === 0) ? (
            <DashboardEmptyState
              title="No tier revenue yet"
              description="Revenue breakdown by Starter, Premium, and VIP tiers."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-rani-border">
                    <th className="text-left font-body text-xs text-rani-muted uppercase tracking-wider py-3 pr-4">Tier</th>
                    <th className="text-right font-body text-xs text-rani-muted uppercase tracking-wider py-3 px-4">Patients</th>
                    <th className="text-right font-body text-xs text-rani-muted uppercase tracking-wider py-3 px-4">MRR</th>
                    <th className="text-right font-body text-xs text-rani-muted uppercase tracking-wider py-3 px-4">Avg Lifetime</th>
                    <th className="text-right font-body text-xs text-rani-muted uppercase tracking-wider py-3 pl-4">Churn</th>
                  </tr>
                </thead>
                <tbody>
                  {tierData.map((t) => (
                    <tr key={t.tier} className="border-b border-rani-border last:border-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: TIER_COLORS[t.tier] }} />
                          <span className="font-body text-sm text-rani-navy font-medium">{t.tier}</span>
                          <span className="font-body text-xs text-rani-muted">
                            ${t.tier === 'Starter' ? '299' : t.tier === 'Premium' ? '399' : '499'}/mo
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-body text-sm text-rani-navy font-bold">{t.count}</td>
                      <td className="text-right py-3 px-4 font-body text-sm text-rani-navy font-bold">
                        ${t.revenue.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 font-body text-sm text-rani-navy">
                        {t.avgLifetime > 0 ? `${t.avgLifetime} mo` : ' - '}
                      </td>
                      <td className="text-right py-3 pl-4">
                        <span className={`font-body text-sm font-medium ${
                          t.churnRate > 15 ? 'text-red-500' : t.churnRate > 8 ? 'text-yellow-600' : 'text-rani-success'
                        }`}>
                          {t.churnRate > 0 ? `${t.churnRate}%` : ' - '}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Totals */}
                  <tr className="bg-rani-cream/50">
                    <td className="py-3 pr-4 font-body text-sm text-rani-navy font-bold">Total</td>
                    <td className="text-right py-3 px-4 font-body text-sm text-rani-navy font-bold">
                      {tierData.reduce((s, t) => s + t.count, 0)}
                    </td>
                    <td className="text-right py-3 px-4 font-body text-sm text-rani-navy font-bold">
                      ${tierData.reduce((s, t) => s + t.revenue, 0).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 font-body text-sm text-rani-navy">
                      {summary.avgLifetimeMonths > 0 ? `${summary.avgLifetimeMonths} mo` : ' - '}
                    </td>
                    <td className="text-right py-3 pl-4 font-body text-sm font-medium text-rani-navy">
                      {summary.churnRate > 0 ? `${summary.churnRate}%` : ' - '}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-rani-border p-6">
          <h2 className="font-heading text-lg text-rani-navy mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <DashboardEmptyState
              title="No activity yet"
              description="Enrollments, tier changes, milestones, and cross-sells will appear here."
            />
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 10).map((a, i) => {
                const typeStyles: Record<string, string> = {
                  enrollment: 'bg-rani-success/10 text-rani-success',
                  churn: 'bg-red-50 text-red-500',
                  tier_upgrade: 'bg-[#C9A96E]/10 text-[#C9A96E]',
                  cross_sell: 'bg-blue-50 text-blue-500',
                  milestone: 'bg-purple-50 text-purple-500',
                };
                const typeLabels: Record<string, string> = {
                  enrollment: 'Enrolled',
                  churn: 'Churned',
                  tier_upgrade: 'Upgraded',
                  cross_sell: 'Cross-sell',
                  milestone: 'Milestone',
                };
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-rani-border last:border-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-bold uppercase tracking-wider ${typeStyles[a.type] || ''}`}>
                      {typeLabels[a.type] || a.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-rani-navy truncate">
                        <span className="font-semibold">{a.patient}</span> - {a.details}
                      </p>
                    </div>
                    <span className="font-body text-xs text-rani-muted whitespace-nowrap">{a.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
