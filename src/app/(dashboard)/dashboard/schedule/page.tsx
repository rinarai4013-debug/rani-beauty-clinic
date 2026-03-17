'use client';

import { motion } from 'framer-motion';
import { Clock, User, MapPin, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import NoShowRiskPanel from '@/components/dashboard/panels/NoShowRiskPanel';
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
  const { data, isLoading } = useScheduleData() as { data: ScheduleData | undefined; isLoading: boolean };
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

  // Build utilization by provider
  const providers = [...new Set(appointments.map(a => a.provider).filter(Boolean))];
  const providerUtil = providers.map(p => {
    const provAppts = appointments.filter(a => a.provider === p);
    const bookedHours = provAppts.reduce((s, a) => s + (a.duration || 60) / 60, 0);
    return { name: p, pct: Math.round((bookedHours / 8) * 100) };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading text-rani-navy">Schedule + Operations</h1>
        <p className="text-sm font-body text-rani-muted mt-1">Today&apos;s clinic at a glance</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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

      {/* Schedule + Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Timeline */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Today&apos;s Schedule
          </h3>
          {isLoading ? (
            <div className="text-center py-12 text-rani-muted font-body text-sm">Loading schedule...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-rani-muted font-body text-sm">
              No appointments scheduled for today.
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map((apt, i) => {
                const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;
                const StatusIcon = config.icon;
                return (
                  <motion.div
                    key={apt.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-4 p-3 rounded-lg border border-rani-border/50 ${
                      apt.status === 'in_progress' ? 'bg-rani-gold/5 border-rani-gold/30' : 'hover:bg-rani-cream/30'
                    }`}
                  >
                    <span className="text-sm font-body font-semibold text-rani-navy w-20">{apt.time}</span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${config.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-body font-medium text-rani-navy">{apt.clientName}</span>
                        {apt.isConsult && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-body font-semibold rounded">CONSULT</span>}
                      </div>
                      <p className="text-xs font-body text-rani-muted truncate">{apt.service}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-xs font-body text-rani-muted">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{apt.provider}</span>
                      {apt.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{apt.room}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.duration}m</span>
                    </div>
                    {/* No-Show Risk Badge */}
                    {noShowMap.get(apt.id)?.level === 'high' && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-body font-semibold">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        {noShowMap.get(apt.id)?.score}%
                      </span>
                    )}
                    {noShowMap.get(apt.id)?.level === 'moderate' && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-body font-semibold">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        {noShowMap.get(apt.id)?.score}%
                      </span>
                    )}
                    {apt.revenue > 0 && (
                      <span className="text-sm font-body font-semibold text-rani-navy">
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
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
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

          {/* No-Show Risk Panel */}
          <NoShowRiskPanel />

          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Slot Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-body">
                <span className="text-rani-muted">Filled Slots</span>
                <span className="font-semibold text-rani-navy">{stats.filledSlots}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-rani-muted">Open Slots</span>
                <span className="font-semibold text-rani-navy">{stats.openSlots}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-rani-muted">No-Shows</span>
                <span className="font-semibold text-red-500">{stats.noShows}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-rani-muted">Cancellations</span>
                <span className="font-semibold text-red-500">{stats.cancellations}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
