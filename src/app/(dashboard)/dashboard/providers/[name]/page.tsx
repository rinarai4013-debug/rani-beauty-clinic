'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDashboardData } from '@/hooks/useDashboardData';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { DashboardErrorBoundary, PanelSkeleton, KPIRowSkeleton, SkeletonBar } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { ArrowLeft, Calendar, Clock, Star, Users, Award, BarChart3 } from 'lucide-react';

interface ProviderDetail {
  name: string; role: string;
  revenue: { today: number; wtd: number; mtd: number; trend: number[] };
  appointments: { today: number; thisWeek: number; completed: number; noShows: number; cancellations: number };
  performance: { closeRate: number; avgTicket: number; rebookRate: number; utilization: number; avgDuration: number; clientSatisfaction: number };
  topServices: Array<{ service: string; count: number; revenue: number }>;
  recentAppointments: Array<{ id: string; clientName: string; service: string; date: string; time: string; revenue: number; status: string }>;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-green-600', scheduled: 'text-rani-muted', confirmed: 'text-blue-600',
  no_show: 'text-red-500', cancelled: 'text-red-400', in_progress: 'text-rani-gold',
};

export default function ProviderDetailPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const decodedName = decodeURIComponent(name || '');
  const { data: provider, isLoading } = useDashboardData<ProviderDetail>(
    name ? `/providers/${encodeURIComponent(decodedName)}` : null, { refreshInterval: 60000 }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonBar className="h-4 w-32" />
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-6">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-gray-200" />
            <div className="space-y-2"><SkeletonBar className="h-6 w-40" /><SkeletonBar className="h-3 w-24" /></div>
          </div>
        </div>
        <KPIRowSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><PanelSkeleton rows={4} /><PanelSkeleton rows={5} /></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
        <DashboardEmptyState icon="users" title={`Provider "${decodedName}" not found`} action={{ label: 'Go Back', onClick: () => router.back() }} />
      </div>
    );
  }

  const perf = provider.performance || { closeRate: 0, avgTicket: 0, rebookRate: 0, utilization: 0, avgDuration: 0, clientSatisfaction: 0 };

  return (
    <DashboardErrorBoundary pageName="Provider Detail">
      <div className="space-y-5 sm:space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-body text-rani-muted hover:text-rani-navy transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Leaderboard</button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-rani-navy to-rani-navy-light flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl font-heading text-rani-gold">{provider.name?.split(' ').map(n => n[0]).join('') || '?'}</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">{provider.name}</h1>
              <p className="text-xs sm:text-sm font-body text-rani-muted">{provider.role || 'Provider'}</p>
            </div>
          </div>
        </motion.div>

        {/* Revenue KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
          <KPICard title="Revenue Today" value={provider.revenue?.today ?? 0} prefix="$" sparklineData={provider.revenue?.trend || []} icon="dollar-sign" size="hero" />
          <KPICard title="Revenue WTD" value={provider.revenue?.wtd ?? 0} prefix="$" icon="trending-up" />
          <KPICard title="Revenue MTD" value={provider.revenue?.mtd ?? 0} prefix="$" icon="bar-chart" />
          <KPICard title="Avg Ticket" value={perf.avgTicket} prefix="$" icon="credit-card" />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4 sm:mb-6 flex items-center gap-2">
              <Award className="w-4 h-4 text-rani-gold" /> Performance Metrics
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              <div className="text-center"><ProgressRing value={perf.closeRate} label="Close Rate" size={80} /></div>
              <div className="text-center"><ProgressRing value={perf.rebookRate} label="Rebook Rate" size={80} /></div>
              <div className="text-center"><ProgressRing value={perf.utilization} label="Utilization" size={80} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-rani-cream/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-rani-gold mb-1"><Clock className="w-3.5 h-3.5" /></div>
                <p className="text-base sm:text-lg font-heading text-rani-navy">{perf.avgDuration}m</p>
                <p className="text-[10px] font-body text-rani-muted uppercase">Avg Duration</p>
              </div>
              <div className="bg-rani-cream/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-rani-gold mb-1"><Star className="w-3.5 h-3.5" /></div>
                <p className="text-base sm:text-lg font-heading text-rani-navy">{perf.clientSatisfaction}/5</p>
                <p className="text-[10px] font-body text-rani-muted uppercase">Client Rating</p>
              </div>
            </div>
          </motion.div>

          {/* Top Services */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rani-gold" /> Top Services
            </h3>
            {(provider.topServices || []).length === 0 ? (
              <DashboardEmptyState icon="chart" title="No service data yet" compact />
            ) : (
              <div className="space-y-3">
                {provider.topServices.map((svc, i) => {
                  const maxRevenue = Math.max(...provider.topServices.map(s => s.revenue), 1);
                  const pct = Math.round((svc.revenue / maxRevenue) * 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs sm:text-sm font-body font-medium text-rani-navy truncate">{svc.service}</span>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs font-body text-rani-muted flex-shrink-0 ml-2">
                          <span>{svc.count} done</span>
                          <span className="font-semibold text-rani-navy">{formatCurrency(svc.revenue)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-rani-gold/70 to-rani-gold" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Appointment Stats + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rani-gold" /> Appointments
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Today', value: provider.appointments?.today ?? 0, color: 'text-rani-navy' },
                { label: 'This Week', value: provider.appointments?.thisWeek ?? 0, color: 'text-rani-navy' },
                { label: 'Completed', value: provider.appointments?.completed ?? 0, color: 'text-green-600' },
                { label: 'No-Shows', value: provider.appointments?.noShows ?? 0, color: 'text-red-500' },
                { label: 'Cancellations', value: provider.appointments?.cancellations ?? 0, color: 'text-red-400' },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm font-body">
                  <span className="text-rani-muted">{row.label}</span>
                  <span className={`font-semibold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-rani-gold" /> Recent Appointments
            </h3>
            {(provider.recentAppointments || []).length === 0 ? (
              <DashboardEmptyState icon="calendar" title="No recent appointments" compact />
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {provider.recentAppointments.slice(0, 15).map((apt, i) => (
                  <div key={apt.id || i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-rani-cream/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-body font-medium text-rani-navy truncate">{apt.clientName}</p>
                      <p className="text-xs font-body text-rani-muted">{formatDate(apt.date)} {apt.time && `at ${apt.time}`} &middot; {apt.service}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      {apt.revenue > 0 && <p className="text-sm font-body font-semibold text-rani-navy">{formatCurrency(apt.revenue)}</p>}
                      <p className={`text-xs font-body ${STATUS_COLORS[apt.status] || 'text-rani-muted'}`}>{apt.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
