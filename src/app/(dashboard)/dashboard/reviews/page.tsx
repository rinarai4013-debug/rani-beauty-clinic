'use client';

import { motion } from 'framer-motion';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Minus, Clock, CheckCircle2, Send, AlertCircle } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton, TableSkeleton, SkeletonBar, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';

interface ReviewEntry {
  id: string;
  rating: number;
  source: string;
  date: string;
  comment: string;
  reviewerName: string;
  sentiment: string;
  responseStatus: string;
  responseDraft: string;
  responseSent: string;
  service: string;
  provider: string;
}

interface ReviewStats {
  totalReviews: number;
  avgRating: number;
  fiveStarPercent: number;
  pendingResponses: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sourceBreakdown: Record<string, number>;
}

interface ReviewResponse {
  success: boolean;
  data: {
    reviews: ReviewEntry[];
    stats: ReviewStats;
  };
}

function useReviews() {
  return useDashboardData<ReviewResponse>('/reviews', {
    refreshInterval: 300000, // 5 min
  });
}

const SENTIMENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  positive: { icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50', label: 'Positive' },
  neutral: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Neutral' },
  negative: { icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-50', label: 'Negative' },
};

const RESPONSE_STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending' },
  drafted: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Drafted' },
  sent: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Sent' },
  skipped: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Skipped' },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <DashboardErrorBoundary pageName="Review Command Center">
      <ReviewsContent />
    </DashboardErrorBoundary>
  );
}

function ReviewsContent() {
  const { data: raw, isLoading, error, mutate } = useReviews();
  const data = raw?.data;

  const reviews = data?.reviews || [];
  const stats = data?.stats;

  /* ─── Error State ──────────────────────────────────────────────── */
  if (error) {
    return <InlineError message="Failed to load review data" onRetry={() => mutate()} />;
  }

  /* ─── Loading State ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="animate-pulse space-y-2">
          <SkeletonBar className="h-7 w-52" />
          <SkeletonBar className="h-3 w-72" />
        </div>
        <KPIRowSkeleton count={4} />
        <PanelSkeleton rows={3} />
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  }

  /* ─── Empty State ───────────────────────────────────────────────── */
  if (!data || reviews.length === 0) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Review Command Center</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Monitor and respond to client reviews across all platforms</p>
        </div>
        <DashboardEmptyState
          icon="star"
          title="No Reviews Yet"
          description="Client reviews will appear here once the Review Commander workflow begins scanning. Reviews are monitored daily at 9 AM via n8n."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Review Command Center</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Monitor and respond to client reviews across all platforms</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
        <KPICard title="Average Rating" value={stats?.avgRating || 0} suffix="/5" icon="star" size="hero" />
        <KPICard title="Total Reviews" value={stats?.totalReviews || 0} icon="message-square" />
        <KPICard title="5-Star Rate" value={stats?.fiveStarPercent || 0} suffix="%" icon="trending-up" />
        <KPICard title="Pending Responses" value={stats?.pendingResponses || 0} icon="clock" />
      </div>

      {/* Sentiment Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-4 sm:p-6 text-white"
        >
          <h3 className="text-xs sm:text-sm font-body font-semibold uppercase tracking-wider text-rani-gold mb-4">Sentiment Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            {(['positive', 'neutral', 'negative'] as const).map((sentiment) => {
              const config = SENTIMENT_CONFIG[sentiment];
              const Icon = config.icon;
              const count = stats.sentimentBreakdown[sentiment];
              const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
              return (
                <div key={sentiment} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Icon className="w-4 h-4 text-rani-gold" />
                    <span className="text-lg sm:text-xl font-heading">{count}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-body text-white/60 capitalize">{sentiment} ({pct}%)</p>
                </div>
              );
            })}
          </div>

          {/* Source Breakdown */}
          {Object.keys(stats.sourceBreakdown).length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-[10px] sm:text-xs font-body text-white/50 uppercase tracking-wider">Sources:</span>
                {Object.entries(stats.sourceBreakdown).map(([source, count]) => (
                  <span key={source} className="text-xs font-body text-white/70">
                    {source}: <span className="text-white font-semibold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
          Recent Reviews
        </h3>
        <div className="space-y-4">
          {reviews.map((review, i) => {
            const sentimentConfig = SENTIMENT_CONFIG[review.sentiment] || SENTIMENT_CONFIG.neutral;
            const SentimentIcon = sentimentConfig.icon;
            const responseConfig = RESPONSE_STATUS_CONFIG[review.responseStatus] || RESPONSE_STATUS_CONFIG.pending;
            const ResponseIcon = responseConfig.icon;

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 rounded-lg border border-rani-border/50 hover:border-rani-gold/30 transition-colors bg-white/50"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <StarRating rating={review.rating} />
                    <span className="text-sm font-body font-semibold text-rani-navy truncate">{review.reviewerName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sentimentConfig.bg} ${sentimentConfig.color} flex items-center gap-1`}>
                      <SentimentIcon className="w-2.5 h-2.5" />
                      {sentimentConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rani-cream text-rani-navy">
                      {review.source}
                    </span>
                    <span className="text-[10px] text-rani-muted">
                      {review.date
                        ? new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : ' - '}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-xs sm:text-sm font-body text-rani-text leading-relaxed mb-3 line-clamp-3">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}

                {/* Meta Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 text-[10px] sm:text-xs font-body text-rani-muted">
                    {review.service && <span>Service: {review.service}</span>}
                    {review.provider && <span>Provider: {review.provider}</span>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${responseConfig.bg} ${responseConfig.color}`}>
                    <ResponseIcon className="w-2.5 h-2.5" />
                    {responseConfig.label}
                  </span>
                </div>

                {/* Response Draft */}
                {review.responseDraft && review.responseStatus === 'drafted' && (
                  <div className="mt-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Send className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-body font-semibold text-blue-700 uppercase tracking-wider">Draft Response</span>
                    </div>
                    <p className="text-xs font-body text-blue-800 leading-relaxed line-clamp-3">{review.responseDraft}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
