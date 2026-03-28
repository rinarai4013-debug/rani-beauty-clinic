'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Shield, TrendingUp, AlertTriangle, Gift, Heart } from 'lucide-react';
import type { ClientLifecycle, LifecycleStage, LifecycleMetrics } from '@/types/crm';
import { LIFECYCLE_STAGE_LABELS, LIFECYCLE_STAGE_COLORS, LIFECYCLE_STAGES } from '@/types/crm';

interface LifecycleJourneyProps {
  client?: ClientLifecycle;
  metrics?: LifecycleMetrics;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function StageIndicator({ stage, isActive, count }: { stage: LifecycleStage; isActive: boolean; count?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
          isActive
            ? `${LIFECYCLE_STAGE_COLORS[stage]} ring-2 ring-offset-2 ring-rani-gold scale-110`
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {count !== undefined ? count : stage.charAt(0).toUpperCase()}
      </div>
      <span className={`text-[9px] text-center max-w-[60px] leading-tight ${isActive ? 'font-semibold text-rani-navy' : 'text-rani-muted'}`}>
        {LIFECYCLE_STAGE_LABELS[stage]}
      </span>
    </div>
  );
}

export default function LifecycleJourney({ client, metrics }: LifecycleJourneyProps) {
  // Stage order for the journey visualization
  const journeyStages: LifecycleStage[] = ['prospect', 'first_visit', 'active', 'loyal', 'vip'];

  if (metrics) {
    return (
      <div className="space-y-6">
        {/* Journey Flow */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Client Lifecycle Overview
          </h3>
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
            {LIFECYCLE_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center">
                <StageIndicator
                  stage={stage}
                  isActive={metrics.clientsByStage[stage] > 0}
                  count={metrics.clientsByStage[stage]}
                />
                {i < LIFECYCLE_STAGES.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-gray-300 mx-1 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-rani-muted mb-1">
              <AlertTriangle className="w-3 h-3" />
              At-Risk Clients
            </div>
            <p className="text-lg font-heading text-red-600">{metrics.atRiskCount}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-rani-muted mb-1">
              <Heart className="w-3 h-3" />
              Reactivation Rate
            </div>
            <p className="text-lg font-heading text-green-600">{metrics.reactivationRate}%</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-rani-muted mb-1">
              <Shield className="w-3 h-3" />
              VIP Clients
            </div>
            <p className="text-lg font-heading text-amber-700">{metrics.clientsByStage.vip}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-rani-muted mb-1">
              <TrendingUp className="w-3 h-3" />
              Active Clients
            </div>
            <p className="text-lg font-heading text-rani-navy">{metrics.clientsByStage.active}</p>
          </div>
        </div>

        {/* LTV by Stage */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Projected LTV by Stage
          </h3>
          <div className="space-y-2">
            {(Object.entries(metrics.avgLTVByStage) as [LifecycleStage, number][])
              .filter(([, ltv]) => ltv > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([stage, ltv]) => (
                <div key={stage} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded ${LIFECYCLE_STAGE_COLORS[stage]}`}>
                    {LIFECYCLE_STAGE_LABELS[stage]}
                  </span>
                  <span className="text-xs font-medium text-rani-navy">{formatCurrency(ltv)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Transitions */}
        {metrics.transitionsThisMonth.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Recent Lifecycle Changes
            </h3>
            <div className="space-y-2">
              {metrics.transitionsThisMonth.slice(0, 10).map((movement, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                  <span className="font-medium text-rani-navy">{movement.clientName}</span>
                  <span className="text-rani-muted flex items-center gap-1">
                    <span className={`px-1.5 py-0.5 rounded ${LIFECYCLE_STAGE_COLORS[movement.from]}`}>
                      {LIFECYCLE_STAGE_LABELS[movement.from]}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                    <span className={`px-1.5 py-0.5 rounded ${LIFECYCLE_STAGE_COLORS[movement.to]}`}>
                      {LIFECYCLE_STAGE_LABELS[movement.to]}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Single client journey view
  if (client) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
          Lifecycle Journey
        </h3>

        {/* Journey progress */}
        <div className="flex items-center justify-between gap-1 mb-6">
          {journeyStages.map((stage, i) => {
            const isActive = stage === client.stage;
            const isPast = journeyStages.indexOf(client.stage) > i;
            return (
              <div key={stage} className="flex items-center">
                <StageIndicator stage={stage} isActive={isActive || isPast} />
                {i < journeyStages.length - 1 && (
                  <div className={`h-0.5 w-8 mx-1 ${isPast ? 'bg-rani-gold' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Client stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <span className="text-[10px] text-rani-muted">Projected LTV</span>
            <p className="text-sm font-heading text-rani-navy">{formatCurrency(client.projectedLTV)}</p>
          </div>
          <div>
            <span className="text-[10px] text-rani-muted">Retention Risk</span>
            <p className={`text-sm font-heading ${client.retentionRiskScore > 60 ? 'text-red-600' : client.retentionRiskScore > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
              {client.retentionRiskScore}/100
            </p>
          </div>
          <div>
            <span className="text-[10px] text-rani-muted">Total Visits</span>
            <p className="text-sm font-heading text-rani-navy">{client.totalVisits}</p>
          </div>
          <div>
            <span className="text-[10px] text-rani-muted">Total Invested</span>
            <p className="text-sm font-heading text-rani-navy">{formatCurrency(client.totalSpend)}</p>
          </div>
        </div>

        {/* Milestones */}
        {client.milestones.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-[10px] font-semibold text-rani-navy uppercase tracking-wider mb-2 flex items-center gap-1">
              <Gift className="w-3 h-3 text-rani-gold" />
              Milestones
            </h4>
            <div className="space-y-1.5">
              {client.milestones.filter(m => m.achieved || m.currentValue > 0).slice(0, 5).map((milestone, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className={milestone.achieved ? 'text-green-700 font-medium' : 'text-rani-muted'}>
                    {milestone.achieved ? '✓' : '○'} {milestone.label}
                  </span>
                  {!milestone.achieved && milestone.targetValue > 0 && (
                    <span className="text-[10px] text-rani-muted">
                      {Math.round((milestone.currentValue / milestone.targetValue) * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
