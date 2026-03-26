'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, RefreshCw } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import { ReviewFeed, SentimentGauge, ReviewResponseDrafter } from '@/components/dashboard/marketing';
import { DashboardErrorBoundary, PanelSkeleton } from '@/components/dashboard/shared';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Review, ReviewStats } from '@/lib/marketing/review-engine';

interface ReviewDashboardData {
  reviews: Review[];
  stats: ReviewStats;
  competitorComparison: {
    ourRank: number;
    totalCompetitors: number;
    insights: string[];
  };
}

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function ReviewsPage() {
  const { data, isLoading, retry } = useDashboardData<ReviewDashboardData>('/marketing/reviews', {
    refreshInterval: 300000,
  });
  const [respondingTo, setRespondingTo] = useState<Review | null>(null);

  const stats = data?.stats;
  const reviews = data?.reviews || [];

  return (
    <DashboardErrorBoundary pageName="Review Management">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 sm:space-y-8">
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Review Management</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Monitor reviews, analyze sentiment, and draft responses
            </p>
          </div>
          <button onClick={retry} className="p-2 rounded-lg border border-rani-border/30 hover:bg-rani-cream transition-colors">
            <RefreshCw className="w-4 h-4 text-rani-muted" />
          </button>
        </motion.div>

        {/* KPIs */}
        <motion.div variants={item}>
          {isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-rani-cream rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
              <KPICard title="Avg Rating" value={stats?.avgRating ?? 0} icon="star" suffix="/5" />
              <KPICard title="Total Reviews" value={stats?.totalReviews ?? 0} />
              <KPICard
                title="This Month"
                value={stats?.reviewsThisMonth ?? 0}
                trend={{
                  value: stats?.reviewVelocity?.current ?? 0,
                  direction: stats?.reviewVelocity?.trend === 'accelerating' ? 'up' : stats?.reviewVelocity?.trend === 'decelerating' ? 'down' : 'flat',
                  label: `${stats?.reviewVelocity?.current ?? 0}/week velocity`,
                }}
              />
              <KPICard title="Response Rate" value={stats?.responseRate ?? 0} suffix="%" />
            </div>
          )}
        </motion.div>

        {/* Sentiment + Review velocity */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SentimentGauge
            positive={stats?.sentimentBreakdown?.positive ?? 0}
            neutral={stats?.sentimentBreakdown?.neutral ?? 0}
            negative={stats?.sentimentBreakdown?.negative ?? 0}
            nps={stats?.nps ?? 0}
            loading={isLoading}
          />

          {/* Rating distribution */}
          <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
            <h3 className="font-heading text-sm font-semibold text-rani-navy mb-4">Rating Distribution</h3>
            {isLoading ? <PanelSkeleton /> : (
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = stats?.ratingDistribution?.[rating] ?? 0;
                  const total = stats?.totalReviews || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 w-10">
                        <span className="text-xs font-body text-rani-navy">{rating}</span>
                        <Star className="w-3 h-3 fill-rani-gold text-rani-gold" />
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-rani-cream overflow-hidden">
                        <div className="h-full rounded-full bg-rani-gold" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-body text-rani-muted w-10 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Competitor rank */}
          <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
            <h3 className="font-heading text-sm font-semibold text-rani-navy mb-4">Competitor Rank</h3>
            {isLoading ? <PanelSkeleton /> : (
              <div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-heading font-bold text-rani-gold">
                    #{data?.competitorComparison?.ourRank ?? '-'}
                  </div>
                  <div className="text-xs font-body text-rani-muted">
                    of {data?.competitorComparison?.totalCompetitors ?? 0} competitors
                  </div>
                </div>
                <div className="space-y-1.5">
                  {(data?.competitorComparison?.insights || []).slice(0, 3).map((insight, i) => (
                    <p key={i} className="text-[11px] font-body text-rani-muted">&bull; {insight}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Response drafter modal */}
        {respondingTo && (
          <motion.div variants={item}>
            <ReviewResponseDrafter
              review={respondingTo}
              onApprove={(id, response) => {
                setRespondingTo(null);
                // Would call API to save response
              }}
              onClose={() => setRespondingTo(null)}
            />
          </motion.div>
        )}

        {/* Review feed */}
        <motion.div variants={item}>
          <ReviewFeed
            reviews={reviews}
            loading={isLoading}
            onRespond={(review) => setRespondingTo(review)}
          />
        </motion.div>
      </motion.div>
    </DashboardErrorBoundary>
  );
}
