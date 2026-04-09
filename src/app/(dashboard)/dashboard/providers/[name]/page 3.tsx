'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Clock, Star, Users, TrendingUp, Calendar } from 'lucide-react';
import { useProviderPerformance, useProviderTrends } from '@/hooks/useProviderData';
import KPICard from '@/components/dashboard/cards/KPICard';
import { MetricGauge, ServiceMixChart, PerformanceTrend } from '@/components/dashboard/providers';
import { DashboardErrorBoundary, PanelSkeleton, KPIRowSkeleton, InlineError } from '@/components/dashboard/shared';

export default function ProviderDetailPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const decodedId = decodeURIComponent(name || '');
  const [period, setPeriod] = useState('monthly');

  const { data: metrics, isLoading, error, mutate } = useProviderPerformance(decodedId, period);
  const { data: revenueTrend } = useProviderTrends(decodedId, 'revenue');

  if (error) {
    return (
      <DashboardErrorBoundary pageName="Provider Detail">
        <div className="space-y-6">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <InlineError message="Failed to load provider data" onRetry={() => mutate()} />
        </div>
      </DashboardErrorBoundary>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-rani-navy">{decodedId}</h1>
            <p className="text-sm text-rani-muted font-body">Individual performance metrics</p>
          </div>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="text-sm font-body border border-gray-200 rounded-lg px-3 py-2 text-rani-navy"
        >
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="quarterly">This Quarter</option>
          <option value="yearly">This Year</option>
        </select>
      </div>

      {isLoading ? (
        <>
          <KPIRowSkeleton count={4} />
          <PanelSkeleton />
        </>
      ) : metrics ? (
        <>
          {/* Revenue KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Total Revenue" value={metrics.revenue.totalRevenue} prefix="$" icon="dollar-sign" />
            <KPICard title="Revenue/Hour" value={metrics.revenuePerHour.revenuePerHour} prefix="$" icon="dollar-sign" />
            <KPICard title="Avg Ticket" value={metrics.avgTicketSize} prefix="$" icon="dollar-sign" />
            <KPICard title="Appointments" value={metrics.appointmentsCompleted} icon="calendar" />
          </div>

          {/* Metric Gauges */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-rani-navy mb-4">Performance Metrics</h2>
            <div className="flex flex-wrap justify-around gap-6">
              <MetricGauge label="Utilization" value={metrics.utilizationRate} max={100} color="#C9A96E" />
              <MetricGauge label="Rebook Rate" value={metrics.rebookRate} max={100} color="#059669" />
              <MetricGauge label="Retention" value={metrics.clientRetentionRate} max={100} color="#3B82F6" />
              <MetricGauge label="No-Show Rate" value={metrics.noShowRate} max={20} unit="%" color={metrics.noShowRate > 10 ? '#EF4444' : '#6B7280'} />
              <MetricGauge label="Upsell Rate" value={metrics.upsellRate} max={100} color="#7C3AED" />
              <MetricGauge label="New Client Conv." value={metrics.newClientConversionRate} max={100} color="#F59E0B" />
              <MetricGauge label="Review Rating" value={metrics.avgReviewRating} max={5} unit="★" color="#C9A96E" />
              <MetricGauge label="Outcome Score" value={metrics.treatmentOutcomeScore} max={100} color="#059669" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Mix */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-display font-semibold text-rani-navy mb-4">Service Mix</h2>
              <ServiceMixChart services={metrics.serviceMix.topServices} />
              {metrics.serviceMix.diversityScore !== undefined && (
                <p className="text-xs text-rani-muted font-body mt-3 pt-2 border-t border-gray-50">
                  Service diversity score: {metrics.serviceMix.diversityScore}/100
                </p>
              )}
            </div>

            {/* Revenue Trend */}
            {revenueTrend && (
              <PerformanceTrend
                trend={revenueTrend}
                formatValue={v => `$${v.toLocaleString()}`}
                height={120}
              />
            )}
          </div>

          {/* Revenue Growth */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-rani-navy mb-4">Revenue Breakdown</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-rani-muted font-body">Service Revenue</p>
                <p className="font-display font-bold text-rani-navy text-lg">${metrics.revenue.serviceRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-rani-muted font-body">Product Revenue</p>
                <p className="font-display font-bold text-rani-navy text-lg">${metrics.revenue.productRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-rani-muted font-body">Membership Revenue</p>
                <p className="font-display font-bold text-rani-navy text-lg">${metrics.revenue.membershipRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-rani-muted font-body">Growth Rate</p>
                <p className={`font-display font-bold text-lg ${metrics.revenue.growthRate >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {metrics.revenue.growthRate >= 0 ? '+' : ''}{metrics.revenue.growthRate}%
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
