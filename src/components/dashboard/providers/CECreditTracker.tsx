'use client';

import { motion } from 'framer-motion';
import { GraduationCap, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { CECreditSummary } from '@/types/providers';

interface CECreditTrackerProps {
  summary: CECreditSummary;
}

export default function CECreditTracker({ summary }: CECreditTrackerProps) {
  const progress = summary.requiredCredits > 0
    ? Math.min(100, (summary.completedCredits / summary.requiredCredits) * 100)
    : 0;
  const deadline = new Date(summary.renewalDeadline);
  const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / 86400000);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-rani-gold-accessible" />
          <h3 className="font-display font-semibold text-rani-navy">CE Credits</h3>
        </div>
        <div className={`flex items-center gap-1 text-xs font-body px-2 py-1 rounded-full ${summary.onTrack ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
          {summary.onTrack ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {summary.onTrack ? 'On Track' : 'Behind Schedule'}
        </div>
      </div>

      <div className="flex items-end gap-1 mb-1">
        <span className="font-display font-bold text-3xl text-rani-navy">{summary.completedCredits}</span>
        <span className="text-rani-muted font-body text-sm mb-1">/ {summary.requiredCredits} credits</span>
      </div>

      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full bg-rani-gold"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>

      <div className="flex justify-between text-xs font-body text-rani-muted mb-4">
        <span>{summary.pendingCredits} credits in progress</span>
        <span className={daysUntilDeadline < 90 ? 'text-red-500 font-semibold' : ''}>
          Deadline: {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {daysUntilDeadline > 0 ? ` (${daysUntilDeadline}d)` : ' (OVERDUE)'}
        </span>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {summary.credits.map(credit => (
          <div key={credit.id} className="flex items-center gap-3 text-sm">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${credit.status === 'completed' ? 'bg-green-50' : credit.status === 'in_progress' ? 'bg-blue-50' : 'bg-gray-50'}`}>
              {credit.status === 'completed' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-rani-navy truncate">{credit.title}</p>
              <p className="text-xs text-rani-muted">{credit.credits} credits &middot; {credit.provider}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
