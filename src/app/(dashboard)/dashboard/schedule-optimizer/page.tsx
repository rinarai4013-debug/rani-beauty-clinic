'use client';

import { motion } from 'framer-motion';
import { Clock, AlertTriangle, TrendingUp, Users, Calendar, CheckCircle, XCircle, Zap } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { useScheduleOptimization } from '@/hooks/useDashboardData';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton, TableSkeleton, SkeletonBar, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import type { ScheduleOptimization } from '@/lib/schedule/optimizer';

interface ScheduleResponse {
  success: boolean;
  data: ScheduleOptimization;
}

const URGENCY_COLORS: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-green-50 text-green-700 border-green-200',
};

const CONFLICT_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  double_booking: { icon: XCircle, color: 'text-red-500' },
  room_conflict: { icon: AlertTriangle, color: 'text-amber-500' },
  equipment_conflict: { icon: AlertTriangle, color: 'text-amber-500' },
  insufficient_buffer: { icon: Clock, color: 'text-blue-500' },
  overtime: { icon: Clock, color: 'text-purple-500' },
};

export default function ScheduleOptimizerPage() {
  return (
    <DashboardErrorBoundary pageName="Schedule Optimizer">
      <ScheduleOptimizerContent />
    </DashboardErrorBoundary>
  );
}

function ScheduleOptimizerContent() {
  const { data: raw, isLoading, error, mutate } = useScheduleOptimization() as { data: ScheduleResponse | undefined; isLoading: boolean; error: unknown; mutate: () => void };
  const data = raw?.data;

  const gaps = data?.gaps || [];
  const conflicts = data?.conflicts || [];
  const opportunities = data?.revenueOpportunities || [];
  const workload = data?.providerBalance || [];
  const recommendations = data?.recommendations || [];
  const dailySummaries = data?.dailySummaries || [];
  const efficiencyScore = data?.score || 0;

  const totalGapRevenue = gaps.reduce((sum, g) => sum + g.potentialRevenue, 0);
  const totalOpportunityRevenue = opportunities.reduce((sum, o) => sum + o.potentialRevenue, 0);

  /* ─── Error State ──────────────────────────────────────────────── */
  if (error) {
    return <InlineError message="Failed to load schedule optimization" onRetry={() => mutate()} />;
  }

  /* ─── Loading State ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="animate-pulse space-y-2">
          <SkeletonBar className="h-7 w-48" />
          <SkeletonBar className="h-3 w-80" />
        </div>
        <KPIRowSkeleton count={4} />
        <PanelSkeleton rows={3} />
        <PanelSkeleton rows={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <PanelSkeleton rows={5} />
          <PanelSkeleton rows={5} />
        </div>
        <PanelSkeleton rows={4} />
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  /* ─── Empty State ───────────────────────────────────────────────── */
  if (!data) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Schedule Optimizer</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">AI-powered gap detection, conflict resolution, and revenue optimization</p>
        </div>
        <DashboardEmptyState
          icon="calendar"
          title="No Schedule Data Available"
          description="Schedule optimization will appear here once there are upcoming appointments to analyze."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Schedule Optimizer</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">AI-powered gap detection, conflict resolution, and revenue optimization</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
        <KPICard title="Efficiency Score" value={efficiencyScore} suffix="/100" icon="zap" size="hero" />
        <KPICard title="Schedule Gaps" value={gaps.length} icon="calendar" />
        <KPICard title="Conflicts Found" value={conflicts.length} icon="alert-triangle" />
        <KPICard title="Revenue Potential" value={totalGapRevenue + totalOpportunityRevenue} prefix="+$" icon="dollar-sign" />
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-4 sm:p-6 text-white"
        >
          <h3 className="text-xs sm:text-sm font-body font-semibold uppercase tracking-wider text-rani-gold mb-3">
            Schedule Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 sm:gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold mt-0.5 flex-shrink-0 ${
                  rec.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                  rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-green-500/20 text-green-300'
                }`}>
                  {rec.priority.toUpperCase()}
                </span>
                <p className="text-xs sm:text-sm font-body text-white/80 leading-relaxed flex-1">{rec.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Provider Workload */}
      {workload.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Provider Workload Balance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {workload.map((provider, i) => (
              <motion.div
                key={provider.provider}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 sm:p-4 rounded-lg bg-rani-cream/30 border border-rani-border/50"
              >
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-4 h-4 text-rani-gold flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-body font-semibold text-rani-navy truncate">{provider.provider}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                    provider.status === 'overloaded' ? 'bg-red-50 text-red-600' :
                    provider.status === 'balanced' ? 'bg-green-50 text-green-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {provider.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-rani-muted">Utilization</span>
                    <span className="font-semibold text-rani-navy">{provider.utilization}%</span>
                  </div>
                  <ProgressBar current={provider.utilization} target={100} showPercentage={false} height={6} colorMode="gold" />
                  <div className="flex justify-between text-[10px] sm:text-xs font-body text-rani-muted">
                    <span>{provider.appointmentCount} appts</span>
                    <span>{provider.scheduledHours}h worked</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Schedule Gaps */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Schedule Gaps ({gaps.length})
          </h3>
          {gaps.length === 0 ? (
            <DashboardEmptyState
              icon="calendar"
              title="No gaps found"
              description="Schedule is fully optimized!"
              compact
            />
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {gaps.map((gap, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-xs font-body font-semibold text-rani-navy truncate">{gap.provider} — {gap.date}</span>
                    <span className="text-xs font-body text-green-600 font-semibold flex-shrink-0">+${gap.potentialRevenue}</span>
                  </div>
                  <div className="text-[10px] sm:text-xs font-body text-rani-muted">
                    {gap.startTime} - {gap.endTime} ({gap.durationMinutes}min gap)
                  </div>
                  {gap.suggestedService && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-rani-gold/10 text-[10px] font-body text-rani-gold">
                        {gap.suggestedService}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Conflicts */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Conflicts Detected ({conflicts.length})
          </h3>
          {conflicts.length === 0 ? (
            <DashboardEmptyState
              icon="shield"
              title="No conflicts detected"
              description="All appointments are properly scheduled."
              compact
            />
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {conflicts.map((conflict, i) => {
                const info = CONFLICT_ICONS[conflict.type] || { icon: AlertTriangle, color: 'text-amber-500' };
                const Icon = info.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`p-3 rounded-lg border ${
                      conflict.severity === 'high' ? 'bg-red-50/50 border-red-200' :
                      conflict.severity === 'medium' ? 'bg-amber-50/50 border-amber-200' :
                      'bg-blue-50/50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${info.color}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-body font-semibold text-rani-navy">{conflict.description}</p>
                        <p className="text-[10px] font-body text-rani-muted mt-0.5">{conflict.resolution}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Opportunities */}
      {opportunities.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Revenue Opportunities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {opportunities.map((opp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 sm:p-4 rounded-lg bg-rani-cream/30 border border-rani-border/50 hover:border-rani-gold/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-rani-gold flex-shrink-0" />
                  <span className="text-xs font-body font-semibold text-rani-navy capitalize truncate">{opp.type.replace('_', ' ')}</span>
                </div>
                <p className="text-[10px] sm:text-xs font-body text-rani-text">{opp.description}</p>
                <div className="mt-2 text-sm font-heading text-green-600">+${opp.potentialRevenue}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Summaries */}
      {dailySummaries.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Daily Schedule Summary
          </h3>
          <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
            <table className="w-full text-xs sm:text-sm font-body">
              <thead>
                <tr className="border-b border-rani-border">
                  <th className="text-left py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase">Day</th>
                  <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase">Appts</th>
                  <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase">Revenue</th>
                  <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase">Utilization</th>
                  <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase hidden sm:table-cell">Gaps</th>
                  <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase hidden sm:table-cell">No-Show Risk</th>
                </tr>
              </thead>
              <tbody>
                {dailySummaries.map((day, i) => (
                  <tr key={day.date} className="border-b border-rani-border/50 hover:bg-rani-cream/30">
                    <td className="py-3 px-2 sm:px-3 font-medium text-rani-navy truncate max-w-[80px] sm:max-w-none">{day.date}</td>
                    <td className="py-3 px-2 sm:px-3 text-right text-rani-text">{day.totalAppointments}</td>
                    <td className="py-3 px-2 sm:px-3 text-right font-semibold text-rani-navy">${day.totalRevenue.toLocaleString()}</td>
                    <td className="py-3 px-2 sm:px-3 text-right">
                      <span className={`font-semibold ${day.utilization >= 80 ? 'text-green-600' : day.utilization >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {day.utilization}%
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-3 text-right text-rani-muted hidden sm:table-cell">{day.gapCount}</td>
                    <td className="py-3 px-2 sm:px-3 text-right text-rani-muted hidden sm:table-cell">{day.highRiskNoShows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
