'use client';

import { motion } from 'framer-motion';
import { Target, AlertCircle, CheckCircle } from 'lucide-react';
import type { GoalDecomposition } from '@/lib/revenue/forecasting-v2';

interface GoalDecompositionPanelProps {
  goals: GoalDecomposition;
}

export default function GoalDecompositionPanel({ goals }: GoalDecompositionPanelProps) {
  const difficultyColors: Record<string, string> = {
    achievable: 'text-emerald-600 bg-emerald-50',
    stretch: 'text-amber-600 bg-amber-50',
    aggressive: 'text-red-600 bg-red-50',
  };

  return (
    <div className="space-y-4">
      <div className="bg-rani-cream/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-rani-gold" />
          <h4 className="font-heading text-rani-navy">Monthly Target: ${goals.monthlyTarget.toLocaleString()}</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-xs font-body text-rani-muted">Appointments Needed</p>
            <p className="text-lg font-heading text-rani-navy">{goals.requiredAppointments}</p>
          </div>
          <div>
            <p className="text-xs font-body text-rani-muted">Avg Ticket Needed</p>
            <p className="text-lg font-heading text-rani-navy">${goals.requiredAvgTicket}</p>
          </div>
          <div>
            <p className="text-xs font-body text-rani-muted">New Clients Needed</p>
            <p className="text-lg font-heading text-rani-navy">{goals.requiredNewClients}</p>
          </div>
          <div>
            <p className="text-xs font-body text-rani-muted">Rebook Rate Needed</p>
            <p className="text-lg font-heading text-rani-navy">{goals.requiredRebookRate}%</p>
          </div>
        </div>
      </div>

      {goals.gaps.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-heading text-rani-navy flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Gaps to Close
          </h4>
          {goals.gaps.map((gap, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-lg border border-gray-100 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-body font-medium text-rani-navy">{gap.metric}</h5>
                <span className={`text-xs px-2 py-0.5 rounded-full font-body ${difficultyColors[gap.difficulty]}`}>
                  {gap.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-2">
                <div>
                  <p className="text-xs font-body text-rani-muted">Current</p>
                  <p className="text-sm font-heading text-rani-navy">{gap.current}</p>
                </div>
                <div className="text-rani-muted">→</div>
                <div>
                  <p className="text-xs font-body text-rani-muted">Required</p>
                  <p className="text-sm font-heading text-rani-navy">{gap.required}</p>
                </div>
                <div className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 font-body">
                  Gap: {gap.gap}
                </div>
              </div>
              <ul className="space-y-1">
                {gap.actions.map((action, j) => (
                  <li key={j} className="text-xs font-body text-rani-muted flex items-start gap-1.5">
                    <CheckCircle className="w-3 h-3 text-rani-gold mt-0.5 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-100 p-3">
        <h4 className="text-sm font-heading text-rani-navy mb-2">The Plan</h4>
        <ul className="space-y-1.5">
          {goals.plan.map((step, i) => (
            <li key={i} className="text-xs font-body text-rani-text flex items-start gap-2">
              <span className="text-rani-gold font-heading mt-px">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
