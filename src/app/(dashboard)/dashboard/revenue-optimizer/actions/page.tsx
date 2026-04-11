'use client';

import { DashboardErrorBoundary, PanelSkeleton, InlineError } from '@/components/dashboard/shared';
import { useOpportunityScorer } from '@/hooks/useDashboardData';
import {
  OpportunityScoreCard, CategoryBreakdownList,
} from '@/components/dashboard/revenue-optimizer';
import type { OpportunityScorerResult } from '@/lib/revenue/opportunity-scorer';

export default function ActionsPage() {
  return (
    <DashboardErrorBoundary pageName="Revenue Actions">
      <ActionsContent />
    </DashboardErrorBoundary>
  );
}

function ActionsContent() {
  const { data, isLoading, error, mutate } = useOpportunityScorer() as {
    data: OpportunityScorerResult | undefined; isLoading: boolean; error: unknown; mutate: () => void;
  };

  if (error) return <InlineError message="Failed to load opportunities" onRetry={mutate} />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Prioritized Revenue Actions</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
          Every opportunity scored and ranked -- act on the highest-impact items first
        </p>
      </div>

      {isLoading ? <PanelSkeleton /> : data && (
        <>
          {/* Weekly Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <p className="text-xs font-body text-rani-muted">Total Opportunity Value</p>
              <p className="text-xl font-heading text-rani-navy">
                ${data.weeklyReport.totalOpportunityValue.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <p className="text-xs font-body text-rani-muted">Opportunities Found</p>
              <p className="text-xl font-heading text-rani-navy">{data.scoredOpportunities.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <p className="text-xs font-body text-rani-muted">Last Week Revenue</p>
              <p className="text-xl font-heading text-rani-navy">
                ${data.weeklyReport.previousWeekComparison.revenueCapture.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <p className="text-xs font-body text-rani-muted">Action Success Rate</p>
              <p className="text-xl font-heading text-rani-navy">
                {data.roiTracking.successRate}%
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-heading text-rani-navy mb-4">Opportunity by Category</h3>
            <CategoryBreakdownList categories={data.categoryBreakdown} />
          </div>

          {/* Top 10 Daily Actions */}
          <div>
            <h3 className="text-sm font-heading text-rani-navy mb-4">Top 10 Actions Today</h3>
            <div className="space-y-3">
              {data.dailyTopTen.map((opp, i) => (
                <OpportunityScoreCard key={opp.id} opportunity={opp} rank={i + 1} />
              ))}
            </div>
          </div>

          {/* All Scored Opportunities */}
          {data.scoredOpportunities.length > 10 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-heading text-rani-navy mb-4">All Opportunities (Ranked)</h3>
              <div className="space-y-1">
                {data.scoredOpportunities.slice(10).map((opp, i) => (
                  <OpportunityScoreCard key={opp.id} opportunity={opp} rank={i + 11} compact />
                ))}
              </div>
            </div>
          )}

          {/* Learnings */}
          {data.learnings.length > 0 && (
            <div className="bg-rani-cream/30 rounded-xl border border-rani-gold/20 p-5">
              <h3 className="text-sm font-heading text-rani-navy mb-3">System Learnings</h3>
              <div className="space-y-2">
                {data.learnings.map((learning, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs font-body text-rani-gold mt-0.5">💡</span>
                    <div>
                      <p className="text-xs font-body text-rani-navy font-medium">{learning.insight}</p>
                      <p className="text-xs font-body text-rani-muted mt-0.5">{learning.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Recommendations */}
          {data.weeklyReport.recommendations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-heading text-rani-navy mb-3">Weekly Recommendations</h3>
              <ul className="space-y-2">
                {data.weeklyReport.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs font-body text-rani-text flex items-start gap-2">
                    <span className="text-rani-gold font-heading">{i + 1}.</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
