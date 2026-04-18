'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useCalendarDay, useProviderView, useRoomView, useRevenueOverlay } from '@/hooks/useBooking';
import CalendarDayView from '@/components/booking/CalendarDayView';
import ScheduleEfficiency from '@/components/booking/ScheduleEfficiency';

export default function DashboardBookingPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [colorMode, setColorMode] = useState<'service' | 'provider' | 'room' | 'status'>('service');

  const { day, isLoading } = useCalendarDay(selectedDate, colorMode);
  const { providers } = useProviderView(selectedDate);
  const { rooms } = useRoomView(selectedDate);
  const { revenue } = useRevenueOverlay(selectedDate);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)]">
            Today&apos;s Schedule
          </h1>
          <p className="text-sm text-[#6B7280]">
            {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[#E8E4DF] text-sm"
          />
          <select
            value={colorMode}
            onChange={e => setColorMode(e.target.value as typeof colorMode)}
            className="px-4 py-2 rounded-xl border border-[#E8E4DF] text-sm"
          >
            <option value="service">By Service</option>
            <option value="provider">By Provider</option>
            <option value="room">By Room</option>
            <option value="status">By Status</option>
          </select>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Appointments"
          value={day?.totalAppointments ?? 0}
          color="#0F1D2C"
        />
        <StatCard
          label="Revenue"
          value={`$${(day?.totalRevenue ?? 0).toLocaleString()}`}
          color="#C9A96E"
        />
        <StatCard
          label="Utilization"
          value={`${day?.utilizationPercent ?? 0}%`}
          color="#3B82F6"
        />
        <StatCard
          label="Gaps"
          value={day?.gaps?.length ?? 0}
          color={day?.gaps?.length ? '#F59E0B' : '#22C55E'}
        />
      </div>

      {/* Main calendar */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading || !day ? (
            <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
          ) : (
            <CalendarDayView data={day} />
          )}
        </div>

        <div className="space-y-6">
          {/* Provider summary */}
          <div className="bg-white rounded-2xl border border-[#E8E4DF] p-6">
            <h3 className="font-semibold text-[#0F1D2C] mb-4">Providers</h3>
            {providers?.map(pv => (
              <div key={pv.providerId} className="flex items-center justify-between py-2 border-b border-[#F8F6F1] last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#0F1D2C]">{pv.providerName}</p>
                  <p className="text-xs text-[#6B7280]">{pv.appointmentCount} appointments</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-rani-gold-accessible">${pv.totalRevenue}</p>
                  <p className="text-xs text-[#6B7280]">{pv.totalMinutesBooked} min</p>
                </div>
              </div>
            ))}
          </div>

          {/* Room summary */}
          <div className="bg-white rounded-2xl border border-[#E8E4DF] p-6">
            <h3 className="font-semibold text-[#0F1D2C] mb-4">Rooms</h3>
            {rooms?.map(rv => (
              <div key={rv.roomId} className="flex items-center justify-between py-2 border-b border-[#F8F6F1] last:border-0">
                <p className="text-sm font-medium text-[#0F1D2C]">{rv.roomName}</p>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-[#F8F6F1] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C9A96E] rounded-full"
                      style={{ width: `${rv.utilizationPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#6B7280]">{rv.utilizationPercent}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Gaps */}
          {day && day.gaps.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <h3 className="font-semibold text-amber-800 mb-3">Schedule Gaps</h3>
              {day.gaps.map((gap, i) => (
                <div key={i} className="text-sm text-amber-700 mb-2">
                  <p className="font-medium">{gap.startTime} - {gap.endTime} ({gap.durationMinutes} min)</p>
                  <p className="text-xs">Room {gap.roomId} &middot; Potential ${gap.potentialRevenue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DF] p-4">
      <p className="text-xs text-[#6B7280] mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}
