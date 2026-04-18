import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RefillEvent {
  id: string;
  patientName: string;
  medication: string;
  dose: string;
  status: 'due' | 'overdue' | 'upcoming' | 'shipped' | 'confirmed';
  dueDate: string;
  dayOfMonth: number;
}

interface RefillCalendarProps {
  month: string;
  year: number;
  events: RefillEvent[];
  totalPatients: number;
  refillsDue: number;
  overdueCount: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  due: 'bg-blue-100 border-blue-300 text-blue-800',
  overdue: 'bg-red-100 border-red-300 text-red-800',
  upcoming: 'bg-gray-100 border-gray-300 text-gray-600',
  shipped: 'bg-green-100 border-green-300 text-green-800',
  confirmed: 'bg-purple-100 border-purple-300 text-purple-800',
};

function RefillCalendar({ month, year, events, totalPatients, refillsDue, overdueCount }: RefillCalendarProps) {
  const daysInMonth = 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startDay = 6; // Saturday for March 2026

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-[#0F1D2C] px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Refill Calendar
          </h2>
          <p className="text-sm text-gray-300 mt-0.5">{month} {year}</p>
        </div>
        <div className="flex gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A96E]">{totalPatients}</p>
            <p className="text-xs text-gray-400">Patients</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{refillsDue}</p>
            <p className="text-xs text-gray-400">Due</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{overdueCount}</p>
            <p className="text-xs text-gray-400">Overdue</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-2 bg-gray-50 flex gap-4 text-xs">
        {Object.entries(statusStyles).map(([status, style]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded border ${style}`} />
            <span className="capitalize text-gray-600">{status}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-400 py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }, (_, i) => (
            <div key={`empty-${i}`} className="h-24" />
          ))}
          {days.map((day) => {
            const dayEvents = events.filter((e) => e.dayOfMonth === day);
            const isToday = day === 26;
            return (
              <div
                key={day}
                className={`h-24 border rounded-lg p-1.5 ${isToday ? 'border-[#C9A96E] bg-[#C9A96E]/5' : 'border-gray-100'}`}
              >
                <p className={`text-xs font-medium mb-1 ${isToday ? 'text-rani-gold-accessible' : 'text-gray-500'}`}>{day}</p>
                <div className="space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`text-[10px] px-1 py-0.5 rounded border truncate ${statusStyles[event.status]}`}
                    >
                      {event.patientName}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] text-gray-400 pl-1">+{dayEvents.length - 2} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockEvents: RefillEvent[] = [
  { id: 'r1', patientName: 'Sarah M.', medication: 'Semaglutide', dose: '0.25 mg', status: 'overdue', dueDate: '2026-03-20', dayOfMonth: 20 },
  { id: 'r2', patientName: 'Lisa K.', medication: 'Tirzepatide', dose: '5 mg', status: 'overdue', dueDate: '2026-03-22', dayOfMonth: 22 },
  { id: 'r3', patientName: 'Jennifer L.', medication: 'Semaglutide', dose: '0.5 mg', status: 'shipped', dueDate: '2026-03-25', dayOfMonth: 25 },
  { id: 'r4', patientName: 'Michael R.', medication: 'Semaglutide', dose: '1.0 mg', status: 'due', dueDate: '2026-03-26', dayOfMonth: 26 },
  { id: 'r5', patientName: 'Amanda W.', medication: 'Tirzepatide', dose: '7.5 mg', status: 'due', dueDate: '2026-03-27', dayOfMonth: 27 },
  { id: 'r6', patientName: 'David P.', medication: 'Semaglutide', dose: '2.4 mg', status: 'confirmed', dueDate: '2026-03-28', dayOfMonth: 28 },
  { id: 'r7', patientName: 'Rachel H.', medication: 'Tirzepatide', dose: '10 mg', status: 'upcoming', dueDate: '2026-03-30', dayOfMonth: 30 },
  { id: 'r8', patientName: 'Emily T.', medication: 'Semaglutide', dose: '1.0 mg', status: 'upcoming', dueDate: '2026-04-01', dayOfMonth: 1 },
  { id: 'r9', patientName: 'Karen B.', medication: 'Semaglutide', dose: '0.5 mg', status: 'due', dueDate: '2026-03-26', dayOfMonth: 26 },
  { id: 'r10', patientName: 'Tom J.', medication: 'Tirzepatide', dose: '5 mg', status: 'due', dueDate: '2026-03-27', dayOfMonth: 27 },
];

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof RefillCalendar> = {
  title: 'Dashboard/RefillCalendar',
  component: RefillCalendar,
  parameters: { layout: 'padded', backgrounds: { default: 'dashboard' } },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RefillCalendar>;

export const Default: Story = {
  args: {
    month: 'March',
    year: 2026,
    events: mockEvents,
    totalPatients: 42,
    refillsDue: 6,
    overdueCount: 2,
  },
};

export const BusyMonth: Story = {
  args: {
    month: 'April',
    year: 2026,
    events: [
      ...mockEvents,
      ...mockEvents.map((e) => ({ ...e, id: `${e.id}-dup`, dayOfMonth: e.dayOfMonth + 3, patientName: `${e.patientName} (2)` })),
    ],
    totalPatients: 78,
    refillsDue: 14,
    overdueCount: 5,
  },
};

export const NoOverdue: Story = {
  args: {
    month: 'March',
    year: 2026,
    events: mockEvents.filter((e) => e.status !== 'overdue'),
    totalPatients: 42,
    refillsDue: 4,
    overdueCount: 0,
  },
};
