'use client';

import { motion } from 'framer-motion';
import { Clock, AlertTriangle, TrendingUp, Users, Calendar, CheckCircle, XCircle, Zap } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { useScheduleOptimization } from '@/hooks/useDashboardData';
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
  const { data: raw, isLoading } = useScheduleOptimization() as { data: ScheduleResponse | undefined; isLoading: boolean };
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading text-rani-navy">Schedule Optimizer</h1>
        <p className="text-sm font-body text-rani-muted mt-1">AI-powered gap detection, conflict resolution, and revenue optimization</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
          className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-6 text-white"
        >
          <h3 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-gold mb-3">
            Schedule Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${
                  rec.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                  rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-green-500/20 text-green-300'
                }`}>
                  {rec.priority.toUpperCase()}
                </span>
                <p className="text-sm font-body text-white/80 leading-relaxed flex-1">{rec.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Provider Workload */}
      {workload.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Provider Workload Balance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workload.map((provider, i) => (
              <motion.div
                key={provider.provider}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg bg-rani-cream/30 border border-rani-border/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-rani-gold" />
                    <span className="text-sm font-body font-semibold text-rani-navy">{provider.provider}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
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
                  <div className="flex justify-between text-xs font-body text-rani-muted">
                    <span>{provider.appointmentCount} appointments</span>
                    <span>{provider.scheduledHours}h worked</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule Gaps */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Schedule Gaps ({gaps.length})
          </h3>
          {gaps.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-body text-rani-muted">No gaps found — schedule is fully optimized!</p>
            </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-body font-semibold text-rani-navy">{gap.provider} — {gap.date}</span>
                    <span className="text-xs font-body text-green-600 font-semibold">+${gap.potentialRevenue}</span>
                  </div>
                  <div className="text-xs font-body text-rani-muted">
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
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Conflicts Detected ({conflicts.length})
          </h3>
          {conflicts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-body text-rani-muted">No conflicts detected!</p>
            </div>
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
                      <Icon className={`w-4 h-4 mt-0.5 ${info.color}`} />
                      <div>
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
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Revenue Opportunities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg bg-rani-cream/30 border border-rani-border/50 hover:border-rani-gold/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-rani-gold" />
                  <span className="text-xs font-body font-semibold text-rani-navy capitalize">{opp.type.replace('_', ' ')}</span>
                </div>
                <p className="text-xs font-body text-rani-text">{opp.description}</p>
                <div className="mt-2 text-sm font-heading text-green-600">+${opp.potentialRevenue}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Summaries */}
      {dailySummaries.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Daily Schedule Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-rani-border">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Day</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Appts</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Revenue</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Utilization</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Gaps</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">No-Show Risk</th>
                </tr>
              </thead>
              <tbody>
                {dailySummaries.map((day, i) => (
                  <tr key={day.date} className="border-b border-rani-border/50 hover:bg-rani-cream/30">
                    <td className="py-3 px-3 font-medium text-rani-navy">{day.date}</td>
                    <td className="py-3 px-3 text-right text-rani-text">{day.totalAppointments}</td>
                    <td className="py-3 px-3 text-right font-semibold text-rani-navy">${day.totalRevenue.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-semibold ${day.utilization >= 80 ? 'text-green-600' : day.utilization >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {day.utilization}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-rani-muted">{day.gapCount}</td>
                    <td className="py-3 px-3 text-right text-rani-muted">{day.highRiskNoShows}</td>
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
