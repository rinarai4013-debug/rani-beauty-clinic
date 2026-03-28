import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MorningBriefingProps {
  date: string;
  greeting: string;
  clinicScore: number;
  bossLevel: string;
  todayAppointments: number;
  todayRevenueForecast: number;
  openSlots: number;
  alerts: { type: string; message: string; severity: 'critical' | 'warning' | 'info' }[];
  topActions: { action: string; impact: string; priority: 'high' | 'medium' | 'low' }[];
  birthdays: string[];
  weatherNote?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const alertSeverityStyles: Record<string, string> = {
  critical: 'text-red-700 bg-red-50',
  warning: 'text-yellow-700 bg-yellow-50',
  info: 'text-blue-700 bg-blue-50',
};

function MorningBriefing(props: MorningBriefingProps) {
  const { date, greeting, clinicScore, bossLevel, todayAppointments, todayRevenueForecast, openSlots, alerts, topActions, birthdays, weatherNote } = props;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-md">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0F1D2C] via-[#1A2D3F] to-[#0F1D2C] px-5 py-5">
        <p className="text-xs text-gray-400">{date}</p>
        <h2 className="text-xl font-bold text-white mt-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          {greeting}
        </h2>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#C9A96E] flex items-center justify-center">
              <span className="text-white font-bold text-sm">{clinicScore}</span>
            </div>
            <div>
              <p className="text-xs text-gray-300">Clinic Score</p>
              <p className="text-xs text-[#C9A96E] font-medium">{bossLevel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Numbers */}
      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#0F1D2C]">{todayAppointments}</p>
          <p className="text-xs text-gray-500">Appointments</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-700">${(todayRevenueForecast / 1000).toFixed(1)}k</p>
          <p className="text-xs text-gray-500">Forecasted</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#C9A96E]">{openSlots}</p>
          <p className="text-xs text-gray-500">Open Slots</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="px-5 pb-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Alerts</h4>
          <div className="space-y-1.5">
            {alerts.map((alert, i) => (
              <div key={i} className={`text-xs px-3 py-2 rounded-lg ${alertSeverityStyles[alert.severity]}`}>
                <span className="font-medium">{alert.type}:</span> {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Actions */}
      <div className="px-5 pb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Top Actions for Today</h4>
        <div className="space-y-1.5">
          {topActions.map((action, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${action.priority === 'high' ? 'bg-red-500' : action.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
              <div>
                <span className="text-[#0F1D2C] font-medium">{action.action}</span>
                <span className="text-gray-400 ml-1">{action.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Birthdays & Weather */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        {birthdays.length > 0 && (
          <p className="text-xs text-gray-500 mb-1">
            Birthdays today: <span className="text-[#0F1D2C] font-medium">{birthdays.join(', ')}</span>
          </p>
        )}
        {weatherNote && <p className="text-xs text-gray-400">{weatherNote}</p>}
      </div>
    </div>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof MorningBriefing> = {
  title: 'Dashboard/MorningBriefing',
  component: MorningBriefing,
  parameters: { layout: 'padded', backgrounds: { default: 'dashboard' } },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MorningBriefing>;

export const Default: Story = {
  args: {
    date: 'Thursday, March 26, 2026',
    greeting: 'Good morning, Rina',
    clinicScore: 82,
    bossLevel: 'Gold Boss',
    todayAppointments: 14,
    todayRevenueForecast: 6800,
    openSlots: 3,
    alerts: [
      { type: 'Labs', message: 'Michael R. labs overdue (2 weeks). GLP-1 refill on hold.', severity: 'critical' },
      { type: 'Inventory', message: 'Semaglutide supply at 4 vials. Reorder recommended.', severity: 'warning' },
    ],
    topActions: [
      { action: 'Call Michael R. about labs', impact: '(unblock $599/mo refill)', priority: 'high' },
      { action: 'Restock semaglutide order', impact: '(5-day lead time)', priority: 'high' },
      { action: 'Follow up with 3 consults from Monday', impact: '(potential $2,400)', priority: 'medium' },
      { action: 'Post Instagram content (pre-scheduled)', impact: '(brand awareness)', priority: 'low' },
    ],
    birthdays: ['Amanda W.', 'Tom J.'],
    weatherNote: 'Renton: 52F, partly cloudy. No weather-related cancellation risk.',
  },
};

export const PerfectDay: Story = {
  args: {
    date: 'Friday, March 27, 2026',
    greeting: 'Good morning, Rina',
    clinicScore: 94,
    bossLevel: 'Platinum Boss',
    todayAppointments: 18,
    todayRevenueForecast: 9200,
    openSlots: 0,
    alerts: [],
    topActions: [
      { action: 'Fully booked day. Focus on patient experience.', impact: '(maximize satisfaction)', priority: 'medium' },
      { action: 'VIP Transform consult at 2:00 PM', impact: '(potential $3,499)', priority: 'high' },
    ],
    birthdays: [],
    weatherNote: 'Renton: 58F, sunny. Great day for the clinic.',
  },
};

export const ChallengingDay: Story = {
  args: {
    date: 'Monday, March 30, 2026',
    greeting: 'Good morning, Rina',
    clinicScore: 65,
    bossLevel: 'Silver Boss',
    todayAppointments: 8,
    todayRevenueForecast: 3200,
    openSlots: 7,
    alerts: [
      { type: 'Revenue', message: 'Week is 22% below target. Need to fill open slots.', severity: 'critical' },
      { type: 'No-Show', message: '2 patients flagged as high no-show risk today.', severity: 'warning' },
      { type: 'Review', message: 'New 3-star Google review needs response.', severity: 'info' },
    ],
    topActions: [
      { action: 'Send same-day availability blast', impact: '(fill 3-4 slots)', priority: 'high' },
      { action: 'Confirm high-risk appointments by phone', impact: '(prevent $800 no-show loss)', priority: 'high' },
      { action: 'Respond to Google review', impact: '(reputation management)', priority: 'medium' },
      { action: 'Launch reactivation texts to 30-day lapsed', impact: '(pipeline building)', priority: 'medium' },
    ],
    birthdays: ['Rachel H.'],
    weatherNote: 'Renton: 45F, rain expected. Cancellation risk slightly elevated.',
  },
};
