'use client';

import { BarChart3 } from 'lucide-react';
import {
  CommunicationAnalytics,
  SendTimeHeatmap,
} from '@/components/dashboard/communications';
import { DashboardErrorBoundary, InlineError } from '@/components/dashboard/shared';
import { useCommunicationAnalytics } from '@/hooks/useDashboardData';
import type { CommunicationAnalytics as AnalyticsData } from '@/types/communications';

export default function AnalyticsPage() {
  const { data, isLoading, error, mutate } = useCommunicationAnalytics();

  const analyticsData = data as { data: AnalyticsData } | undefined;

  return (
    <DashboardErrorBoundary pageName="Communication Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Communication Analytics
          </h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Performance metrics, delivery insights, and revenue attribution
          </p>
        </div>

        {error ? (
          <InlineError message="Failed to load analytics" onRetry={() => mutate()} />
        ) : analyticsData?.data ? (
          <>
            <CommunicationAnalytics data={analyticsData.data} isLoading={isLoading} />
            <SendTimeHeatmap data={analyticsData.data.bestSendTimes} />
          </>
        ) : isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="animate-pulse h-72 bg-gray-100 rounded-xl" />
              <div className="animate-pulse h-72 bg-gray-100 rounded-xl" />
            </div>
          </div>
        ) : null}
      </div>
    </DashboardErrorBoundary>
  );
}
