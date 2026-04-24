'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Copy, Check, Send, RefreshCw, Star } from 'lucide-react';
import type { Review } from '@/lib/marketing/review-engine';
import { draftReviewResponse } from '@/lib/marketing/review-engine';

interface ReviewResponseDrafterProps {
  review: Review;
  onApprove?: (_reviewId: string, _response: string) => void;
  onClose?: () => void;
}

export default function ReviewResponseDrafter({ review, onApprove, onClose }: ReviewResponseDrafterProps) {
  const initial = draftReviewResponse(review);
  const [draft, setDraft] = useState(initial.draft);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  const handleRegenerate = () => {
    const newDraft = draftReviewResponse(review);
    setDraft(newDraft.draft);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-lg"
    >
      {/* Review being responded to */}
      <div className="mb-4 pb-3 border-b border-rani-border/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-heading font-semibold text-rani-navy">{review.reviewerName}</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < review.rating ? 'fill-rani-gold text-rani-gold' : 'text-slate-200'}`}
              />
            ))}
          </div>
        </div>
        <p className="text-xs font-body text-rani-muted line-clamp-3">{review.reviewText}</p>
      </div>

      {/* Draft header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-heading font-semibold text-rani-navy flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          AI Response Draft
        </h4>
        <span className="text-[10px] font-body text-rani-muted">
          Confidence: {Math.round(initial.confidence * 100)}%
        </span>
      </div>

      {/* Editable draft */}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={5}
        className="w-full text-xs font-body text-rani-navy/80 border border-rani-border/30 rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-rani-gold/50 mb-3"
      />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={handleRegenerate}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-body text-rani-muted hover:text-rani-navy border border-rani-border/30 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-body text-rani-muted hover:text-rani-navy border border-rani-border/30 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="flex gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-body text-rani-muted hover:text-rani-navy transition-colors"
            >
              Cancel
            </button>
          )}
          {onApprove && (
            <button
              onClick={() => onApprove(review.id, draft)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-body text-white bg-rani-navy hover:bg-rani-navy/90 rounded-lg transition-colors"
            >
              <Send className="w-3 h-3" />
              Approve
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
