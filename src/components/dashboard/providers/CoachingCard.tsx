'use client';

import { motion } from 'framer-motion';
import { Lightbulb, ChevronRight } from 'lucide-react';
import type { CoachingRecommendation } from '@/types/providers';

interface CoachingCardProps {
  recommendations: CoachingRecommendation[];
}

const PRIORITY_STYLES: Record<string, { border: string; bg: string; dot: string }> = {
  high: { border: 'border-red-200', bg: 'bg-red-50', dot: 'bg-red-500' },
  medium: { border: 'border-amber-200', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  low: { border: 'border-green-200', bg: 'bg-green-50', dot: 'bg-green-500' },
};

export default function CoachingCard({ recommendations }: CoachingCardProps) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-100 p-5 text-center">
        <Lightbulb className="w-6 h-6 mx-auto text-green-500 mb-2" />
        <p className="font-body text-sm text-green-700">All goals on track — outstanding performance!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec, i) => {
        const style = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.medium;
        return (
          <motion.div
            key={rec.goalId}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl border p-4 ${style.border}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-body font-semibold text-sm text-rani-navy">{rec.goalTitle}</h4>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${style.bg} font-body`}>
                    {rec.priority} priority
                  </span>
                </div>
                <p className="text-xs text-rani-muted font-body mb-2">{rec.recommendation}</p>
                <ul className="space-y-1">
                  {rec.actionItems.map((item, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-xs font-body text-rani-navy">
                      <ChevronRight className="w-3 h-3 text-rani-gold-accessible mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
