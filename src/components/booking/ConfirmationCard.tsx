'use client';

import { format, parseISO } from 'date-fns';
import type { Appointment } from '@/lib/booking/types';

interface ConfirmationCardProps {
  appointment: Appointment;
  onAddToCalendar?: () => void;
}

export default function ConfirmationCard({ appointment, onAddToCalendar }: ConfirmationCardProps) {
  const dateFormatted = format(parseISO(appointment.date), 'EEEE, MMMM d, yyyy');

  return (
    <div className="bg-white rounded-2xl border-2 border-[#C9A96E] p-8 text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-[#C9A96E] rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)] mb-2">
        You&apos;re All Set!
      </h2>
      <p className="text-[#6B7280] mb-6">Your appointment has been confirmed.</p>

      <div className="bg-[#F8F6F1] rounded-xl p-6 text-left space-y-3 mb-6">
        <div>
          <p className="text-xs text-[#6B7280] uppercase tracking-wider">Service</p>
          <p className="font-semibold text-[#0F1D2C]">{appointment.serviceName}</p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Date</p>
            <p className="font-medium text-[#0F1D2C]">{dateFormatted}</p>
          </div>
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Time</p>
            <p className="font-medium text-[#0F1D2C]">{appointment.startTime}</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Provider</p>
            <p className="font-medium text-[#0F1D2C]">{appointment.providerName}</p>
          </div>
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Room</p>
            <p className="font-medium text-[#0F1D2C] capitalize">{appointment.roomId}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {onAddToCalendar && (
          <button
            onClick={onAddToCalendar}
            className="w-full py-3 rounded-xl bg-[#0F1D2C] text-white font-medium hover:bg-[#1a2d40] transition-colors"
          >
            Add to Calendar
          </button>
        )}
        <p className="text-xs text-[#6B7280]">
          A confirmation has been sent to {appointment.clientEmail}.
          We will send reminders before your appointment.
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-[#E8E4DF]">
        <p className="text-xs text-[#6B7280]">
          Rani Beauty Clinic | 401 Olympia Ave NE, Suite 101, Renton, WA 98056
        </p>
      </div>
    </div>
  );
}
