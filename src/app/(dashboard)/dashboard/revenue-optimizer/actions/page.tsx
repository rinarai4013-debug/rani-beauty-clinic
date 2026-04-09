'use client';

import { DollarSign, Target, TrendingUp, Zap } from 'lucide-react';
import { DashboardErrorBoundary, PanelSkeleton, InlineError } from '@/components/dashboard/shared';
import { ActionItemCard } from '@/components/dashboard/revenue-optimizer';
import { useRevenueOptimizerSummary } from '@/hooks/useDashboardData';
import type { RevenueActionItem } from '@/lib/revenue/gap-finder';

interface SummaryData {
  totalAddressableGap: number;
  todayTarget: number;
  todayBooked: number;
  monthForecast: number;
  monthTarget: number;
  opportunityCount: number;
  topActions: Array<{ title: string; revenue: number; priority: number }>;
}

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
  return `${title}. This is one of the fastest available revenue moves still open to the team.`;
}

function toActionItems(summary: SummaryData | undefined): RevenueActionItem[] {
  if (!summary) return [];

  return summary.topActions.map((action, index) => ({
    id: `top-action-${index + 1}`,
    category: inferActionCategory(action.title),
    title: action.title,
    description: summarizeAction(action.title),
    estimatedRevenue: action.revenue,
    effort: action.priority >= 85 ? 'low' : action.priority >= 70 ? 'medium' : 'high',
    timeToImpact: action.priority >= 85 ? 'same-day' : 'this-week',
    priority: action.priority,
  }));
}

export default function ActionsPage() {
  return (
    <DashboardErrorBoundary pageName="Revenue Actions">
      <ActionsContent />
    </DashboardErrorBoundary>
  );
}

function ActionsContent() {
  const { data: summary, isLoading, error, mutate } = useRevenueOptimizerSummary() as {
    data: SummaryData | undefined; isLoading: boolean; error: unknown; mutate: () => void;
  };

  const actions = toActionItems(summary);
  const todayGap = summary ? Math.max(0, summary.todayTarget - summary.todayBooked) : 0;
  const forecastGap = summary ? Math.max(0, summary.monthTarget - summary.monthForecast) : 0;

  if (error) return <InlineError message="Failed to load revenue actions" onRetry={mutate} />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Prioritized Revenue Actions</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
          The fastest moves still available today, ranked by urgency and revenue impact.
        </p>
      </div>

      {isLoading ? <PanelSkeleton /> : summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-rani-gold" />
                <p className="text-xs font-body text-rani-muted">Addressable Gap</p>
              </div>
              <p className="text-xl font-heading text-rani-navy">
                ${summary.totalAddressableGap.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-rani-gold" />
                <p className="text-xs font-body text-rani-muted">Today&apos;s Remaining Gap</p>
              </div>
              <p className="text-xl font-heading text-rani-navy">
                ${todayGap.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-rani-gold" />
                <p className="text-xs font-body text-rani-muted">Forecast Shortfall</p>
              </div>
              <p className="text-xl font-heading text-rani-navy">
                ${forecastGap.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-rani-gold" />
                <p className="text-xs font-body text-rani-muted">Live Opportunities</p>
              </div>
              <p className="text-xl font-heading text-rani-navy">{summary.opportunityCount}</p>
            </div>
          </div>

          <div className="space-y-3">
            {actions.map((action, index) => (
              <ActionItemCard key={action.id} action={action} rank={index + 1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
