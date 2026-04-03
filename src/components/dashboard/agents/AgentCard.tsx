'use client';

/**
 * AgentCard — Single agent status card for the command center grid.
 *
 * Reuses: Card (src/components/ui/Card.tsx) pattern
 * Reuses: ClinicScoreMeter animation pattern
 * Follows: StatCard visual language (trends, color coding)
 */

import { motion } from 'framer-motion';
import type { AgentStatusSummary } from '@/types/agent';
import type { ScoreStatus } from '@/types/agent';

interface AgentCardProps {
  agent: AgentStatusSummary;
  onClick?: () => void;
  rank?: number;
}

const STATUS_COLORS: Record<ScoreStatus, { bg: string; text: string; ring: string }> = {
  excellent: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  good: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' },
  attention: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
};

const AGENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  live: { label: 'Live', color: 'text-emerald-600' },
  partial: { label: 'Partial', color: 'text-amber-600' },
  'recommendation-only': { label: 'Manual', color: 'text-slate-500' },
  offline: { label: 'Offline', color: 'text-slate-400' },
};

function getScoreStatus(score: number): ScoreStatus {
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 40) return 'attention';
  return 'critical';
}

export default function AgentCard({ agent, onClick, rank }: AgentCardProps) {
  const scoreStatus = agent.score > 0 ? getScoreStatus(agent.score) : 'attention';
  const colors = STATUS_COLORS[scoreStatus];
  const statusInfo = AGENT_STATUS_LABELS[agent.status] || AGENT_STATUS_LABELS.offline;

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative w-full text-left rounded-xl border border-rani-border
        bg-white p-4 sm:p-5
        shadow-[0_1px_3px_rgba(0,0,0,0.04)]
        hover:shadow-[0_10px_40px_rgba(15,29,44,0.08)]
        transition-shadow duration-300
        focus:outline-none focus:ring-2 focus:ring-rani-gold/40
      `}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank ? rank * 0.04 : 0 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl" role="img" aria-label={agent.name}>
            {agent.icon}
          </span>
          <div>
            <h3 className="font-heading text-sm font-semibold text-rani-navy leading-tight">
              {agent.name}
            </h3>
            <span className={`text-[11px] font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Score ring */}
        {agent.score > 0 && (
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full
            ring-2 ${colors.ring} ${colors.bg}
          `}>
            <span className={`text-sm font-bold ${colors.text}`}>
              {agent.score}
            </span>
          </div>
        )}
      </div>

      {/* Category badge */}
      <div className="mb-3">
        <span className="inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-rani-muted bg-rani-cream rounded-full">
          {agent.category}
        </span>
      </div>

      {/* Alert summary */}
      {agent.alertCount > 0 && (
        <div className="flex items-center gap-1.5 text-xs">
          {agent.criticalCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-700 rounded font-medium">
              {agent.criticalCount} critical
            </span>
          )}
          {agent.alertCount - agent.criticalCount > 0 && (
            <span className="text-rani-muted">
              +{agent.alertCount - agent.criticalCount} alert{agent.alertCount - agent.criticalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Top alert preview */}
      {agent.topAlert && (
        <p className="mt-2 text-[11px] text-rani-muted leading-snug line-clamp-2">
          {agent.topAlert}
        </p>
      )}

      {/* No data state */}
      {agent.score === 0 && agent.alertCount === 0 && (
        <p className="text-[11px] text-rani-muted italic">
          {agent.status === 'recommendation-only'
            ? 'Manual scorecard — no engine data'
            : 'Awaiting data...'}
        </p>
      )}
    </motion.button>
  );
}
