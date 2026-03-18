'use client';

import { motion } from 'framer-motion';
import { Clock, User, MapPin, CheckCircle, XCircle, ShieldAlert, Calendar } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import NoShowRiskPanel from '@/components/dashboard/panels/NoShowRiskPanel';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { useScheduleData, useNoShowRisk } from '@/hooks/useDashboardData';
import type { AppointmentItem } from '@/types/dashboard';

interface ScheduleData {
  today: AppointmentItem[];
  utilization: { total: number; byProvider: { provider: string; rate: number }[] };
  stats: { totalSlots: number; filledSlots: number; openSlots: number; noShows: number; cancellations: number };
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  confirmed: { color: 'text-green-500 bg-green-50', icon: CheckCircle, label: 'Confirmed' },
  checked_in: { color: 'text-blue-500 bg-blue-50', icon: CheckCircle, label: 'Checked In' },
  in_progress: { color: 'text-rani-gold bg-rani-gold/10', icon: Clock, label: 'In Progress' },
  completed: { color: 'text-gray-400 bg-gray-50', icon: CheckCircle, label: 'Completed' },
  no_show: { color: 'text-red-500 bg-red-50', icon: XCircle, label: 'No Show' },
  scheduled: { color: 'text-rani-muted bg-rani-cream', icon: Clock, label: 'Scheduled' },
};

interface NoShowRiskItem {
  appointmentId: string;
  score: number;
  level: 'low' | 'moderate' | 'high';
}

export default function SchedulePage() {
  const { data, isLoading, error } = useScheduleData() as { data: ScheduleData | undefined; isLoading: boolean; error: unknown };
  const { data: noShowData } = useNoShowRisk();
  const noShowMap = new Map<string, NoShowRiskItem>();
  const noShowItems = (noShowData as { appointments?: NoShowRiskItem[] })?.appointments || [];
  noShowItems.forEach(item => noShowMap.set(item.appointmentId, item));

  const appointments = data?.today || [];
  const stats = data?.stats || { totalSlots: 0, filledSlots: 0, openSlots: 16, noShows: 0, cancellations: 0 };

  const completedRevenue = appointments
    .filter(a => ['completed', 'in_progress'].includes(a.status))
    .reduce((sum, a) => sum + (a.revenue || 0), 0);
  const projectedRevenue = appointments.reduce((sum, a) => sum + (a.revenue || 0), 0);
  const newClients = appointments.filter(a => a.isConsult).length;

  const providers = [...new Set(appointments.map(a => a.provider).filter(Boolean))];
  const providerUtil = providers.map(p => {
    const provAppts = appointments.filter(a => a.provider === p);
    const bookedHours = provAppts.reduce((s, a) => s + (a.duration || 60) / 60, 0);
    return { name: p, pct: Math.round((bookedHours / 8) * 100) };
  });

  return (
    <DashboardErrorBoundary pageName="Schedule">
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Schedule + Operations</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Today&apos;s clinic at a glance</p>
        </div>

        {/* KPIs */}
        {isLoading ? (
          <KPIRowSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
            <KPICard title="Appointments Today" value={appointments.length} icon="calendar" size="hero" />
            <KPICard
              title="Revenue Collected"
              value={completedRevenue}
              prefix="$"
              progress={projectedRevenue > 0 ? { current: completedRevenue, target: projectedRevenue, label: `of $${projectedRevenue.toLocaleString()} projected` } : undefined}
              icon="dollar-sign"
            />
            <KPICard title="No-Shows" value={stats.noShows} />
            <KPICard title="Consults Today" value={newClients} icon="users" />
          </div>
        )}

        {/* Schedule + Utilization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Schedule Timeline */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Today&apos;s Schedule
            </h3>
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                    <div className="h-7 w-7 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-32 bg-gray-200 rounded" />
                      <div className="h-2 w-48 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <DashboardEmptyState
                icon="calendar"
                title="No appointments today"
                description="The schedule is open. A great day to focus on admin tasks or follow-ups."
                compact
              />
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {appointments.map((apt, i) => {
                  const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;
                  const StatusIcon = config.icon;
                  return (
                    <motion.div
                      key={apt.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg border border-rani-border/50 ${
                        apt.status === 'in_progress' ? 'bg-rani-gold/5 border-rani-gold/30' : 'hover:bg-rani-cream/30'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-body font-semibold text-rani-navy w-14 sm:w-20 flex-shrink-0">{apt.time}</span>
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-body font-medium text-rani-navy truncate">{apt.clientName}</span>
                          {apt.isConsult && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-body font-semibold rounded flex-shrink-0">CONSULT</span>}
                        </div>
                        <p className="text-[11px] sm:text-xs font-body text-rani-muted truncate">{apt.service}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 text-xs font-body text-rani-muted flex-shrink-0">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{apt.provider}</span>
                        {apt.room && <span className="flex items-center gap-1 hidden md:flex"><MapPin className="w-3 h-3" />{apt.room}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.duration}m</span>
                      </div>
                      {noShowMap.get(apt.id)?.level === 'high' && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-body font-semibold flex-shrink-0">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          <span className="hidden sm:inline">{noShowMap.get(apt.id)?.score}%</span>
                        </span>
                      )}
                      {noShowMap.get(apt.id)?.level === 'moderate' && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-body font-semibold flex-shrink-0">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          <span className="hidden sm:inline">{noShowMap.get(apt.id)?.score}%</span>
                        </span>
                      )}
                      {apt.revenue > 0 && (
                        <span className="text-xs sm:text-sm font-body font-semibold text-rani-navy flex-shrink-0">
                          ${apt.revenue.toLocaleString()}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Utilization Panel */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
              <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                Utilization
              </h3>
              {providerUtil.length === 0 ? (
                <div className="flex justify-around">
                  <ProgressRing value={0} label="Rina" size={90} />
                  <ProgressRing value={0} label="Mom" size={90} />
                </div>
              ) : (
                <div className="flex justify-around">
                  {providerUtil.map(p => (
                    <ProgressRing key={p.name} value={p.pct} label={p.name} size={90} />
                  ))}
                </div>
              )}
            </div>

            <NoShowRiskPanel />

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
              <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                Slot Summary
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Filled Slots', value: stats.filledSlots, color: 'text-rani-navy' },
                  { label: 'Open Slots', value: stats.openSlots, color: 'text-rani-navy' },
                  { label: 'No-Shows', value: stats.noShows, color: 'text-red-500' },
                  { label: 'Cancellations', value: stats.cancellations, color: 'text-red-500' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm font-body">
                    <span className="text-rani-muted">{row.label}</span>
                    <span className={`font-semibold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
