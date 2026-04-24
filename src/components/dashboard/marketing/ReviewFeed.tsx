'use client';

import { motion } from 'framer-motion';
import { Star, MessageSquare, Clock, Send, CheckCircle2 } from 'lucide-react';
import type { Review, ResponseStatus } from '@/lib/marketing/review-engine';

const STATUS_CONFIG: Record<ResponseStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50', icon: Clock },
  drafted: { label: 'Drafted', color: 'text-blue-600 bg-blue-50', icon: MessageSquare },
  approved: { label: 'Approved', color: 'text-indigo-600 bg-indigo-50', icon: CheckCircle2 },
  published: { label: 'Published', color: 'text-emerald-600 bg-emerald-50', icon: Send },
  skipped: { label: 'Skipped', color: 'text-slate-400 bg-slate-50', icon: Clock },
};

interface ReviewFeedProps {
  reviews: Review[];
  loading?: boolean;
  onRespond?: (_review: Review) => void;
}

export default function ReviewFeed({ reviews, loading, onRespond }: ReviewFeedProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-rani-border/30 bg-white p-5 animate-pulse">
        <div className="h-5 w-36 bg-rani-cream rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-rani-cream rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
      <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-rani-gold" />
        Recent Reviews
      </h3>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {reviews.map((review, idx) => {
          const statusConfig = STATUS_CONFIG[review.responseStatus];
          const StatusIcon = statusConfig.icon;
          const sentimentColor = review.sentiment?.label === 'positive'
            ? 'border-l-emerald-400'
            : review.sentiment?.label === 'negative'
              ? 'border-l-red-400'
              : 'border-l-slate-300';

          return (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`border border-rani-border/20 border-l-4 ${sentimentColor} rounded-lg p-3`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-heading font-semibold text-rani-navy">
                      {review.reviewerName}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < review.rating ? 'fill-rani-gold text-rani-gold' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] font-body text-rani-muted">
                    {review.platform} &middot; {new Date(review.date).toLocaleDateString()}
                    {review.service && ` &middot; ${review.service}`}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body ${statusConfig.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </span>
              </div>

              {/* Review text (truncated) */}
              <p className="text-xs font-body text-rani-navy/80 line-clamp-2 mb-2">
                {review.reviewText}
              </p>

              {/* Sentiment topics */}
              {review.sentiment?.topics && review.sentiment.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {review.sentiment.topics.slice(0, 3).map(topic => (
                    <span
                      key={topic.topic}
                      className={`text-[10px] font-body px-1.5 py-0.5 rounded-full ${
                        topic.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-600' :
                        topic.sentiment === 'negative' ? 'bg-red-50 text-red-600' :
                        'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {topic.topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              {review.responseStatus === 'pending' && onRespond && (
                <button
                  onClick={() => onRespond(review)}
                  className="text-[11px] font-body text-rani-gold hover:text-rani-navy transition-colors flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  Draft Response
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
