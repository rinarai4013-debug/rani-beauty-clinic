'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, AlertTriangle } from 'lucide-react';
import { useTimeOffRequests, useTimeOffBalances, useCoverage, useProviderSchedule } from '@/hooks/useProviderData';
import KPICard from '@/components/dashboard/cards/KPICard';
import { TimeOffCalendar, TimeOffBalanceCard, CoverageHeatmap } from '@/components/dashboard/providers';
import { DashboardErrorBoundary, PanelSkeleton, KPIRowSkeleton, InlineError } from '@/components/dashboard/shared';

const PROVIDERS = [
  { id: 'rina', name: 'Rina' },
  { id: 'mom', name: 'Mom' },
];

export default function ScheduleManagementPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const { data: timeOffRequests, isLoading, error, mutate } = useTimeOffRequests();
  const { data: balances } = useTimeOffBalances(selectedProvider);
  const { data: coverage } = useCoverage();
  const { data: schedule } = useProviderSchedule(selectedProvider);

  if (error) {
    return (
      <DashboardErrorBoundary pageName="Schedule">
        <InlineError message="Failed to load schedule data" onRetry={() => mutate()} />
      </DashboardErrorBoundary>
    );
  }

  const pendingRequests = timeOffRequests?.filter(r => r.status === 'pending').length ?? 0;
  const approvedUpcoming = timeOffRequests?.filter(r => r.status === 'approved' && new Date(r.startDate) > new Date()).length ?? 0;
  const coverageGaps = coverage?.filter(c => !c.meetsMinimum).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-rani-navy">Schedule Management</h1>
          <p className="text-sm text-rani-muted font-body mt-1">Time off, coverage, and schedule administration</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedProvider(null)}
            className={`px-3 py-2 rounded-lg text-sm font-body transition-colors ${!selectedProvider ? 'bg-rani-navy text-white' : 'bg-gray-100 text-rani-navy'}`}
          >
            All
          </button>
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className={`px-3 py-2 rounded-lg text-sm font-body transition-colors ${selectedProvider === p.id ? 'bg-rani-navy text-white' : 'bg-gray-100 text-rani-navy'}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <KPIRowSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Pending Requests" value={pendingRequests} icon="calendar" />
          <KPICard title="Upcoming Time Off" value={approvedUpcoming} icon="calendar" />
          <KPICard title="Coverage Gaps" value={coverageGaps} icon="users" />
          <KPICard title="Weekly Hours" value={schedule?.weeklyHours ?? 0} suffix="h" icon="target" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coverage Heatmap */}
        {coverage && <CoverageHeatmap coverage={coverage} />}

        {/* Time Off Balances */}
        {balances && balances.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-display font-semibold text-rani-navy mb-4">Time-Off Balances</h2>
            <TimeOffBalanceCard balances={balances} />
          </div>
        )}
      </div>

      {/* Time Off Requests */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-display font-semibold text-rani-navy mb-4">Time-Off Requests</h2>
        {isLoading ? (
          <PanelSkeleton />
        ) : (
          <TimeOffCalendar
            requests={timeOffRequests ?? []}
            isManager={true}
          />
        )}
      </div>

      {/* Working Hours */}
      {schedule?.workingHours && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-display font-semibold text-rani-navy mb-4">Working Hours</h2>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
              const hours = schedule.workingHours.find((h: { dayOfWeek: number }) => h.dayOfWeek === i);
              return (
                <div key={day} className={`text-center p-3 rounded-lg ${hours?.isWorkday ? 'bg-rani-gold/10' : 'bg-gray-50'}`}>
                  <p className="text-xs font-body font-semibold text-rani-navy">{day}</p>
                  {hours?.isWorkday ? (
                    <p className="text-xs text-rani-muted font-body mt-1">{hours.startTime} - {hours.endTime}</p>
                  ) : (
                    <p className="text-xs text-gray-400 font-body mt-1">Off</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
