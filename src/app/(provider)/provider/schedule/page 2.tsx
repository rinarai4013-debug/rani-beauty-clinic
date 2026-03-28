'use client';

import { Calendar, Clock } from 'lucide-react';
import { useProviderSchedule, useTimeOffRequests, useTimeOffBalances } from '@/hooks/useProviderData';
import { TimeOffCalendar, TimeOffBalanceCard } from '@/components/dashboard/providers';

export default function ProviderSchedulePage() {
  const providerId = 'current-provider';
  const { data: schedule, isLoading } = useProviderSchedule(providerId);
  const { data: requests } = useTimeOffRequests(providerId);
  const { data: balances } = useTimeOffBalances(providerId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-rani-navy">My Schedule</h1>
        <p className="text-sm text-rani-muted font-body mt-1">View your schedule and manage time off</p>
      </div>

      {/* Working Hours */}
      {schedule?.workingHours && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-display font-semibold text-rani-navy mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-rani-gold" /> My Working Hours
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
              const h = schedule.workingHours.find((wh: { dayOfWeek: number }) => wh.dayOfWeek === i);
              return (
                <div key={day} className={`text-center p-3 rounded-lg ${h?.isWorkday ? 'bg-rani-gold/10' : 'bg-gray-50'}`}>
                  <p className="text-xs font-body font-semibold text-rani-navy">{day}</p>
                  {h?.isWorkday ? (
                    <p className="text-xs text-rani-muted font-body mt-1">{h.startTime}-{h.endTime}</p>
                  ) : (
                    <p className="text-xs text-gray-400 font-body mt-1">Off</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-rani-muted font-body mt-2">Weekly hours: {schedule.weeklyHours}h</p>
        </div>
      )}

      {/* Time Off Balances */}
      {balances && balances.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-display font-semibold text-rani-navy mb-3">Time-Off Balances</h2>
          <TimeOffBalanceCard balances={balances} />
        </div>
      )}

      {/* Time Off Requests */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-display font-semibold text-rani-navy mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-rani-gold" /> My Time-Off Requests
        </h2>
        <TimeOffCalendar requests={requests ?? []} isManager={false} />
      </div>
    </div>
  );
}
