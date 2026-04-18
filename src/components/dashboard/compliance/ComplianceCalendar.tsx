'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Shield, Clock, AlertTriangle } from 'lucide-react';
import type { ComplianceDeadline } from '@/types/compliance';

interface ComplianceCalendarProps {
  deadlines: ComplianceDeadline[];
  overdueItems: ComplianceDeadline[];
}

export default function ComplianceCalendar({ deadlines, overdueItems }: ComplianceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Map deadlines to days
  const deadlinesByDay = useMemo(() => {
    const map: Record<number, ComplianceDeadline[]> = {};
    [...deadlines, ...overdueItems].forEach((d) => {
      const dueDate = new Date(d.dueDate);
      if (dueDate.getMonth() === month && dueDate.getFullYear() === year) {
        const day = dueDate.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(d);
      }
    });
    return map;
  }, [deadlines, overdueItems, month, year]);

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const typeColors: Record<string, string> = {
    license_renewal: 'bg-purple-400',
    training_due: 'bg-blue-400',
    baa_renewal: 'bg-teal-400',
    policy_review: 'bg-gray-400',
    device_maintenance: 'bg-indigo-400',
    device_calibration: 'bg-cyan-400',
    dea_reconciliation: 'bg-red-400',
    osha_inspection: 'bg-orange-400',
    consent_expiry: 'bg-amber-400',
  };

  // All deadlines for the list view
  const allItems = [...overdueItems, ...deadlines].sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rani-gold/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-rani-gold-accessible" />
          </div>
          <div>
            <h2 className="text-lg font-body font-bold text-rani-navy">Compliance Calendar</h2>
            <p className="text-xs font-body text-rani-muted">
              {overdueItems.length} overdue, {deadlines.length} upcoming
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rani-cream transition-colors">
              <ChevronLeft className="w-4 h-4 text-rani-muted" />
            </button>
            <h3 className="text-sm font-body font-semibold text-rani-navy">{monthName}</h3>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rani-cream transition-colors">
              <ChevronRight className="w-4 h-4 text-rani-muted" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-[10px] font-body font-semibold text-rani-muted uppercase py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 sm:h-20" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayDeadlines = deadlinesByDay[day] || [];
              const hasCritical = dayDeadlines.some((d) => d.severity === 'critical');

              return (
                <div
                  key={day}
                  className={`h-16 sm:h-20 rounded-lg p-1 text-xs font-body transition-colors ${
                    isToday(day)
                      ? 'bg-rani-gold/10 ring-1 ring-rani-gold/30'
                      : dayDeadlines.length > 0
                        ? hasCritical ? 'bg-red-50' : 'bg-blue-50/50'
                        : 'hover:bg-rani-cream/30'
                  }`}
                >
                  <span className={`text-[11px] font-medium ${isToday(day) ? 'text-rani-gold-accessible' : 'text-rani-muted'}`}>
                    {day}
                  </span>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {dayDeadlines.slice(0, 3).map((d, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${typeColors[d.type] || 'bg-gray-400'}`}
                        title={d.title}
                      />
                    ))}
                    {dayDeadlines.length > 3 && (
                      <span className="text-[9px] text-rani-muted">+{dayDeadlines.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-rani-border/30">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-[10px] font-body text-rani-muted capitalize">{type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border overflow-hidden">
          <div className="px-4 py-3 border-b border-rani-border/30">
            <h3 className="text-xs font-body font-semibold uppercase tracking-wider text-rani-muted">
              All Deadlines
            </h3>
          </div>
          <div className="divide-y divide-rani-border/20 max-h-[500px] overflow-y-auto">
            {allItems.length === 0 ? (
              <p className="p-4 text-sm font-body text-rani-muted text-center">No deadlines</p>
            ) : (
              allItems.map((item) => {
                const Icon = item.daysUntilDue < 0 ? AlertTriangle : item.severity === 'critical' ? AlertTriangle : Clock;
                const iconColor = item.daysUntilDue < 0 ? 'text-red-500' : item.severity === 'critical' ? 'text-red-500' : item.severity === 'warning' ? 'text-amber-500' : 'text-blue-500';

                return (
                  <div key={item.id} className="p-3 hover:bg-rani-cream/20">
                    <div className="flex items-start gap-2">
                      <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
                      <div className="min-w-0">
                        <p className="text-xs font-body font-medium text-rani-navy truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-body ${item.daysUntilDue < 0 ? 'text-red-600 font-medium' : 'text-rani-muted'}`}>
                            {item.daysUntilDue < 0
                              ? `${Math.abs(item.daysUntilDue)}d overdue`
                              : item.daysUntilDue === 0
                                ? 'Today'
                                : `${item.daysUntilDue}d`}
                          </span>
                          <span className="text-[10px] font-body text-rani-muted">{item.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
