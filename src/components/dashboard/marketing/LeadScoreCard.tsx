'use client';

import { motion } from 'framer-motion';
import { User, Zap, Clock, ArrowRight } from 'lucide-react';
import type { LeadScore, LeadGrade } from '@/lib/marketing/lead-scoring';

const GRADE_COLORS: Record<LeadGrade, { bg: string; text: string; ring: string }> = {
  A: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-500' },
  B: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-500' },
  C: { bg: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-400' },
  D: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-400' },
};

const URGENCY_LABELS: Record<string, { label: string; color: string }> = {
  immediate: { label: 'Immediate', color: 'text-red-600' },
  today: { label: 'Today', color: 'text-amber-600' },
  this_week: { label: 'This Week', color: 'text-blue-600' },
  nurture: { label: 'Nurture', color: 'text-slate-500' },
  archive: { label: 'Archive', color: 'text-slate-400' },
};

interface LeadScoreCardProps {
  leadName: string;
  leadSource: string;
  score: LeadScore;
  onAction?: () => void;
}

export default function LeadScoreCard({ leadName, leadSource, score, onAction }: LeadScoreCardProps) {
  const colors = GRADE_COLORS[score.grade];
  const urgency = URGENCY_LABELS[score.urgency] || URGENCY_LABELS.nurture;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-rani-border/30 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rani-cream flex items-center justify-center">
            <User className="w-5 h-5 text-rani-navy" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-rani-navy">{leadName}</h3>
            <p className="text-xs font-body text-rani-muted capitalize">{leadSource.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}>
          <span className="text-lg font-bold font-heading">{score.grade}</span>
          <span className="text-xs font-body">{score.totalScore}</span>
        </div>
      </div>

      {/* Score Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs font-body text-rani-muted mb-1">
          <span>Lead Score</span>
          <span>{score.totalScore}/100</span>
        </div>
        <div className="h-2 rounded-full bg-rani-cream overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score.totalScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              score.grade === 'A' ? 'bg-emerald-500' :
              score.grade === 'B' ? 'bg-amber-500' :
              score.grade === 'C' ? 'bg-slate-400' :
              'bg-red-400'
            }`}
          />
        </div>
        {score.decayApplied > 0 && (
          <p className="text-[10px] font-body text-rani-muted mt-0.5">
            {score.decayApplied}% decay applied (raw: {score.rawScore})
          </p>
        )}
      </div>

      {/* Factor breakdown (compact) */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {['demographic', 'behavioral', 'engagement', 'intent'].map(dim => {
          const dimFactors = score.factors.filter(f => f.dimension === dim);
          const dimScore = Math.round(dimFactors.reduce((s, f) => s + f.weightedScore, 0));
          return (
            <div key={dim} className="text-center">
              <div className="text-[10px] font-body text-rani-muted capitalize">{dim.slice(0, 5)}.</div>
              <div className="text-sm font-heading font-semibold text-rani-navy">{dimScore}</div>
            </div>
          );
        })}
      </div>

      {/* Action */}
      <div className="flex items-center justify-between pt-3 border-t border-rani-border/20">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-rani-muted" />
          <span className={`text-xs font-body font-medium ${urgency.color}`}>{urgency.label}</span>
          {score.autoAssign && (
            <span className="text-[10px] font-body bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
              Auto-assigned
            </span>
          )}
        </div>
        {onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-1 text-xs font-body text-rani-gold hover:text-rani-navy transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Act
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
