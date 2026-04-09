'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  DollarSign, Target, TrendingUp, Users, CreditCard,
  Zap, ChevronRight, BarChart3, Calendar, ArrowUpRight,
} from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { useRevenueOptimizerSummary } from '@/hooks/useDashboardData';
import { ActionItemCard } from '@/components/dashboard/revenue-optimizer';
import type { RevenueActionItem } from '@/lib/revenue/gap-finder';

interface SummaryData {
  totalAddressableGap: number;
  todayTarget: number;
  todayBooked: number;
  weekTarget: number;
  weekBooked: number;
  monthForecast: number;
  monthTarget: number;
  retentionRate: number;
  avgTicket: number;
  membershipMRR: number;
  pricingHealthScore: number;
  opportunityCount: number;
  topActions: Array<{ title: string; revenue: number; priority: number }>;
}

const NAV_LINKS = [
  { href: '/dashboard/revenue-optimizer/gaps', label: 'Gap Analysis', icon: BarChart3, description: 'Find every unfilled slot and missed opportunity' },
  { href: '/dashboard/revenue-optimizer/upsells', label: 'Upsell Tracker', icon: TrendingUp, description: 'Smart cross-sell and ticket-size optimization' },
  { href: '/dashboard/revenue-optimizer/forecast', label: 'Forecasting', icon: Calendar, description: 'Scenarios, targets, and Monte Carlo projections' },
  { href: '/dashboard/revenue-optimizer/actions', label: 'Daily Actions', icon: Zap, description: 'Today\'s prioritized revenue-capture actions' },
];

function inferActionCategory(title: string): RevenueActionItem['category'] {
  const normalized = title.toLowerCase();
  if (normalized.includes('slot')) return 'fill-slot';
  if (normalized.includes('rebook')) return 'rebook-overdue';
  if (normalized.includes('member')) return 'activate-membership';
  if (normalized.includes('vip') || normalized.includes('win back')) return 'reactivate-vip';
  if (normalized.includes('boost')) return 'boost-service';
  return 'optimize-day';
}

function summarizeAction(title: string): string {
  return `${title}. Prioritize this move today to close the remaining revenue gap faster.`;
}

function toActionItems(summary: SummaryData | undefined): RevenueActionItem[] {
  if (!summary) return [];

  return summary.topActions.map((action, index) => ({
    id: `summary-action-${index + 1}`,
    category: inferActionCategory(action.title),
    title: action.title,
    description: summarizeAction(action.title),
    estimatedRevenue: action.revenue,
    effort: action.priority >= 85 ? 'low' : action.priority >= 70 ? 'medium' : 'high',
    timeToImpact: action.priority >= 85 ? 'same-day' : 'this-week',
    priority: action.priority,
  }));
}

export default function RevenueOptimizerPage() {
  return (
    <DashboardErrorBoundary pageName="Revenue Optimizer">
      <RevenueOptimizerContent />
    </DashboardErrorBoundary>
  );
}

function RevenueOptimizerContent() {
  const { data: summary, isLoading, error, mutate } = useRevenueOptimizerSummary() as {
    data: SummaryData | undefined; isLoading: boolean; error: unknown; mutate: () => void;
  };
  const actions = toActionItems(summary);

  if (error) return <InlineError message="Failed to load revenue optimizer" onRetry={mutate} />;

  const todayPace = summary ? Math.round((summary.todayBooked / Math.max(1, summary.todayTarget)) * 100) : 0;
  const monthPace = summary ? Math.round((summary.monthForecast / Math.max(1, summary.monthTarget)) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Revenue Optimizer</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
          Find and capture every dollar of revenue
        </p>
      </div>

      {/* Hero KPIs */}
      {isLoading ? <KPIRowSkeleton /> : summary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
          <KPICard
            title="Total Revenue Gap"
            value={summary.totalAddressableGap}
            prefix="$"
            icon="dollar-sign"
            size="hero"
          />
          <KPICard
            title="Today's Pace"
            value={todayPace}
            suffix="%"
            icon="trending-up"
          />
          <KPICard
            title="Month Forecast"
            value={summary.monthForecast}
            prefix="$"
            icon="calendar"
          />
          <KPICard
            title="Opportunities"
            value={summary.opportunityCount}
            icon="zap"
          />
        </div>
      )}

      {/* Today's Progress */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border-2 p-5 ${
            todayPace >= 80 ? 'border-emerald-200 bg-emerald-50/30' :
            todayPace >= 50 ? 'border-blue-200 bg-blue-50/30' :
            todayPace >= 25 ? 'border-amber-200 bg-amber-50/30' :
            'border-red-200 bg-red-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-rani-navy">Today&apos;s Revenue Target</h3>
            <span className={`text-xs px-3 py-1 rounded-full font-body font-medium ${
              todayPace >= 80 ? 'bg-emerald-100 text-emerald-700' :
              todayPace >= 50 ? 'bg-blue-100 text-blue-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {todayPace >= 80 ? 'On Track' : todayPace >= 50 ? 'On Pace' : 'Behind'}
            </span>
          </div>
          <div className="flex items-end gap-8 mb-3">
            <div>
              <p className="text-xs font-body text-rani-muted">Booked</p>
              <p className="text-2xl font-heading text-rani-navy">${summary.todayBooked.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-body text-rani-muted">Target</p>
              <p className="text-2xl font-heading text-rani-navy">${summary.todayTarget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-body text-rani-muted">Gap</p>
              <p className="text-2xl font-heading text-red-600">
                ${Math.max(0, summary.todayTarget - summary.todayBooked).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="h-3 bg-white/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, todayPace)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                todayPace >= 80 ? 'bg-emerald-500' :
                todayPace >= 50 ? 'bg-blue-500' :
                'bg-amber-500'
              }`}
            />
          </div>
        </motion.div>
      )}

      {/* Quick Nav + Top Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Cards */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-heading text-rani-navy">Deep Dive</h3>
          {NAV_LINKS.map((link, i) => (
            <Link key={link.href} href={link.href}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white hover:border-rani-gold/30 hover:shadow-sm transition-all group"
              >
                <div className="p-2 rounded-lg bg-rani-cream group-hover:bg-rani-gold/10 transition-colors">
                  <link.icon className="w-4 h-4 text-rani-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-rani-navy">{link.label}</p>
                  <p className="text-xs font-body text-rani-muted">{link.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-rani-muted group-hover:text-rani-gold transition-colors" />
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Today's Actions */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading text-rani-navy">Today&apos;s Top Actions</h3>
            {summary && (
              <span className="text-xs font-body text-rani-muted">
                {actions.length} ready now
              </span>
            )}
          </div>

          {actions.length > 0 ? (
            <div className="space-y-2">
              {actions.slice(0, 5).map((action, i) => (
                <ActionItemCard
                  key={action.id}
                  action={action}
                  rank={i + 1}
                />
              ))}
            </div>
          ) : (
            <PanelSkeleton />
          )}
        </div>
      </div>

      {/* Snapshot Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-rani-gold" />
              <p className="text-xs font-body text-rani-muted">Retention Rate</p>
            </div>
            <p className="text-xl font-heading text-rani-navy">{summary.retentionRate}%</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-rani-gold" />
              <p className="text-xs font-body text-rani-muted">Avg Ticket</p>
            </div>
            <p className="text-xl font-heading text-rani-navy">${summary.avgTicket}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-rani-gold" />
              <p className="text-xs font-body text-rani-muted">Membership MRR</p>
            </div>
            <p className="text-xl font-heading text-rani-navy">${summary.membershipMRR.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-rani-gold" />
              <p className="text-xs font-body text-rani-muted">Pricing Health</p>
            </div>
            <p className="text-xl font-heading text-rani-navy">{summary.pricingHealthScore}/100</p>
          </div>
        </div>
      )}
    </div>
  );
}
