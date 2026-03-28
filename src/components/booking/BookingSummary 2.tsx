'use client';

import { format, parseISO } from 'date-fns';
import type { BookableService, TimeSlot } from '@/lib/booking/types';

interface BookingSummaryProps {
  service: BookableService | null;
  slot: TimeSlot | null;
  date: string | null;
}

export default function BookingSummary({ service, slot, date }: BookingSummaryProps) {
  if (!service) return null;

  return (
    <div className="bg-[#0F1D2C] text-white rounded-2xl p-6 sticky top-6">
      <h3 className="text-lg font-semibold mb-4 font-[family-name:var(--font-heading)] text-[#C9A96E]">
        Booking Summary
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium">{service.name}</p>
            <p className="text-sm text-gray-400">{service.duration} minutes</p>
          </div>
          <p className="text-[#C9A96E] font-bold text-lg">
            {service.price > 0 ? `$${service.price}` : 'Free'}
          </p>
        </div>

        {date && (
          <div className="pt-3 border-t border-white/10">
            <p className="text-sm text-gray-400">Date</p>
            <p className="font-medium">{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</p>
          </div>
        )}

        {slot && (
          <>
            <div>
              <p className="text-sm text-gray-400">Time</p>
              <p className="font-medium">{slot.startTime} - {slot.endTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Provider</p>
              <p className="font-medium">{slot.providerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Room</p>
              <p className="font-medium">{slot.roomName}</p>
            </div>
          </>
        )}

        {service.depositRequired > 0 && (
          <div className="pt-3 border-t border-white/10">
            <div className="flex justify-between">
              <p className="text-sm text-gray-400">Deposit required</p>
              <p className="font-medium">${service.depositRequired}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Applied to your treatment cost
            </p>
          </div>
        )}

        {service.requiresConsultation && (
          <div className="bg-[#C9A96E]/10 rounded-lg p-3 mt-4">
            <p className="text-sm text-[#C9A96E]">
              A consultation is included with this booking to ensure the best treatment plan for you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
