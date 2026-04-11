'use client';

import type { Appointment } from '@/lib/booking/types';

interface AddToCalendarProps {
  appointment: Appointment;
}

export default function AddToCalendar({ appointment }: AddToCalendarProps) {
  const generateGoogleCalUrl = () => {
    const start = `${appointment.date.replace(/-/g, '')}T${appointment.startTime.replace(':', '')}00`;
    const end = `${appointment.date.replace(/-/g, '')}T${appointment.endTime.replace(':', '')}00`;
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${appointment.serviceName} - Rani Beauty Clinic`,
      dates: `${start}/${end}`,
      details: `Provider: ${appointment.providerName}\nRoom: ${appointment.roomId}\n\nRani Beauty Clinic\n401 Olympia Ave NE #101, Renton, WA 98056`,
      location: '401 Olympia Ave NE #101, Renton, WA 98056',
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  };

  const generateICSFile = () => {
    const start = `${appointment.date.replace(/-/g, '')}T${appointment.startTime.replace(':', '')}00`;
    const end = `${appointment.date.replace(/-/g, '')}T${appointment.endTime.replace(':', '')}00`;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${appointment.serviceName} - Rani Beauty Clinic`,
      `DESCRIPTION:Provider: ${appointment.providerName}`,
      'LOCATION:401 Olympia Ave NE #101\\, Renton\\, WA 98056',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rani-appointment.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-3">
      <a
        href={generateGoogleCalUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 py-3 px-4 rounded-xl border-2 border-[#E8E4DF] text-[#0F1D2C] text-sm font-medium text-center hover:border-[#C9A96E] transition-colors"
      >
        Google Calendar
      </a>
      <button
        onClick={generateICSFile}
        className="flex-1 py-3 px-4 rounded-xl border-2 border-[#E8E4DF] text-[#0F1D2C] text-sm font-medium hover:border-[#C9A96E] transition-colors"
      >
        Apple / Outlook
      </button>
    </div>
  );
}
