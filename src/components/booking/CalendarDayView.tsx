'use client';

import type { CalendarEvent, CalendarDayData, RoomId } from '@/lib/booking/types';
import { ROOM_COLORS } from '@/lib/booking/types';

interface CalendarDayViewProps {
  data: CalendarDayData;
  onEventClick?: (_event: CalendarEvent) => void;
  startHour?: number;
  endHour?: number;
}

const HOUR_HEIGHT = 80; // px per hour

export default function CalendarDayView({
  data,
  onEventClick,
  startHour = 8,
  endHour = 19,
}: CalendarDayViewProps) {
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const getEventPosition = (event: CalendarEvent) => {
    const [startH, startM] = event.startTime.split(':').map(Number);
    const [endH, endM] = event.endTime.split(':').map(Number);
    const top = ((startH - startHour) * 60 + startM) * (HOUR_HEIGHT / 60);
    const height = ((endH - startHour) * 60 + endM - (startH - startHour) * 60 - startM) * (HOUR_HEIGHT / 60);
    return { top: Math.max(0, top), height: Math.max(20, height) };
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DF] overflow-hidden">
      {/* Header stats */}
      <div className="p-4 border-b border-[#E8E4DF] flex items-center justify-between">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-[#6B7280]">Appointments</p>
            <p className="text-lg font-bold text-[#0F1D2C]">{data.totalAppointments}</p>
          </div>
          <div>
            <p className="text-xs text-[#6B7280]">Revenue</p>
            <p className="text-lg font-bold text-[#C9A96E]">${data.totalRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-[#6B7280]">Utilization</p>
            <p className="text-lg font-bold text-[#0F1D2C]">{data.utilizationPercent}%</p>
          </div>
        </div>
        {data.gaps.length > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
            {data.gaps.length} gap{data.gaps.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="relative" style={{ height: hours.length * HOUR_HEIGHT }}>
        {/* Hour lines */}
        {hours.map(hour => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-[#F8F6F1] flex"
            style={{ top: (hour - startHour) * HOUR_HEIGHT }}
          >
            <span className="text-xs text-[#6B7280] w-16 text-right pr-3 -mt-2">
              {hour === 0 ? '12 AM' : hour <= 12 ? `${hour} AM` : `${hour - 12} PM`}
            </span>
          </div>
        ))}

        {/* Events */}
        <div className="ml-16 relative">
          {data.events.map(event => {
            const pos = getEventPosition(event);
            return (
              <button
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="absolute left-2 right-2 rounded-lg p-2 text-left overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-md"
                style={{
                  top: pos.top,
                  height: pos.height,
                  backgroundColor: event.color + '20',
                  borderLeft: `3px solid ${event.color}`,
                }}
              >
                <p className="text-xs font-bold text-[#0F1D2C] truncate">{event.title}</p>
                <p className="text-[10px] text-[#6B7280] truncate">{event.subtitle}</p>
                <p className="text-[10px] text-[#6B7280]">{event.startTime} - {event.endTime}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ROOM_COLORS[event.roomId] }}
                  />
                  <span className="text-[10px] text-[#6B7280]">{event.roomName}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
