'use client';

import { useState } from 'react';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { useCalendarDay, useCalendarWeek, useCalendarMonth, useRevenueOverlay } from '@/hooks/useBooking';
import CalendarDayView from '@/components/booking/CalendarDayView';
import RevenueChart from '@/components/booking/RevenueChart';
import RoomUtilizationChart from '@/components/booking/RoomUtilizationChart';
import { useRoomView } from '@/hooks/useBooking';
import type { CalendarView, CalendarColorMode } from '@/lib/booking/types';

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('day');
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [colorMode, setColorMode] = useState<CalendarColorMode>('service');

  const { day } = useCalendarDay(view === 'day' ? currentDate : null, colorMode);
  const { week } = useCalendarWeek(view === 'week' ? currentDate : null, colorMode);
  const { month } = useCalendarMonth(view === 'month' ? currentDate : null, colorMode);
  const { revenue } = useRevenueOverlay(currentDate);
  const { rooms } = useRoomView(currentDate);

  const navigate = (direction: 'prev' | 'next') => {
    const date = new Date(currentDate);
    switch (view) {
      case 'day':
        setCurrentDate(format(direction === 'next' ? addDays(date, 1) : subDays(date, 1), 'yyyy-MM-dd'));
        break;
      case 'week':
        setCurrentDate(format(direction === 'next' ? addWeeks(date, 1) : subWeeks(date, 1), 'yyyy-MM-dd'));
        break;
      case 'month':
        setCurrentDate(format(direction === 'next' ? addMonths(date, 1) : subMonths(date, 1), 'yyyy-MM-dd'));
        break;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)]">
          Full Calendar
        </h1>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-[#F8F6F1] rounded-xl p-1">
            {(['day', 'week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === v ? 'bg-[#0F1D2C] text-white' : 'text-[#6B7280] hover:text-[#0F1D2C]'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('prev')} className="p-2 rounded-lg hover:bg-[#F8F6F1]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentDate(format(new Date(), 'yyyy-MM-dd'))}
              className="px-4 py-2 text-sm font-medium text-[#0F1D2C] hover:bg-[#F8F6F1] rounded-lg"
            >
              Today
            </button>
            <button onClick={() => navigate('next')} className="p-2 rounded-lg hover:bg-[#F8F6F1]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          <span className="text-lg font-semibold text-[#0F1D2C]">
            {format(new Date(currentDate), view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
          </span>

          {/* Color mode */}
          <select
            value={colorMode}
            onChange={e => setColorMode(e.target.value as CalendarColorMode)}
            className="px-3 py-2 rounded-xl border border-[#E8E4DF] text-sm"
          >
            <option value="service">By Service</option>
            <option value="provider">By Provider</option>
            <option value="room">By Room</option>
            <option value="status">By Status</option>
          </select>
        </div>
      </div>

      {/* Calendar content */}
      {view === 'day' && day && <CalendarDayView data={day} />}

      {view === 'week' && week && (
        <div className="grid grid-cols-7 gap-2">
          {week.map(dayData => (
            <div key={dayData.date} className="bg-white rounded-xl border border-[#E8E4DF] p-3">
              <p className="text-xs font-medium text-[#6B7280] mb-1">
                {format(new Date(dayData.date), 'EEE d')}
              </p>
              <p className="text-sm font-bold text-[#0F1D2C]">{dayData.totalAppointments} apt</p>
              <p className="text-xs text-rani-gold-accessible">${dayData.totalRevenue}</p>
              <div className="mt-2 space-y-1">
                {dayData.events.slice(0, 3).map(evt => (
                  <div
                    key={evt.id}
                    className="text-[10px] px-1.5 py-0.5 rounded truncate"
                    style={{ backgroundColor: evt.color + '20', color: evt.color }}
                  >
                    {evt.startTime} {evt.title}
                  </div>
                ))}
                {dayData.events.length > 3 && (
                  <p className="text-[10px] text-[#6B7280]">+{dayData.events.length - 3} more</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'month' && month && (
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-[#6B7280] py-2">{d}</div>
          ))}
          {month.map(dayData => (
            <button
              key={dayData.date}
              onClick={() => { setCurrentDate(dayData.date); setView('day'); }}
              className="bg-white rounded-lg border border-[#F8F6F1] p-2 text-left hover:border-[#C9A96E] transition-colors min-h-[80px]"
            >
              <p className="text-xs font-medium text-[#0F1D2C]">
                {format(new Date(dayData.date), 'd')}
              </p>
              {dayData.totalAppointments > 0 && (
                <>
                  <p className="text-[10px] text-[#6B7280]">{dayData.totalAppointments} apt</p>
                  <p className="text-[10px] text-rani-gold-accessible">${dayData.totalRevenue}</p>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {revenue && <RevenueChart hourlyRevenue={revenue} />}
        {rooms && <RoomUtilizationChart rooms={rooms} />}
      </div>
    </div>
  );
}
