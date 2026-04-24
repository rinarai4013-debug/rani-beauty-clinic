'use client';

import { useState } from 'react';
import type { TimeSlot } from '@/lib/booking/types';

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelect: (_slot: TimeSlot) => void;
  isLoading?: boolean;
}

export default function TimeSlotPicker({ slots, selectedSlot, onSelect, isLoading }: TimeSlotPickerProps) {
  const [filter, setFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  const filteredSlots = slots.filter(slot => {
    if (filter === 'all') return true;
    const hour = parseInt(slot.startTime.split(':')[0]);
    if (filter === 'morning') return hour >= 9 && hour < 12;
    if (filter === 'afternoon') return hour >= 12 && hour < 16;
    if (filter === 'evening') return hour >= 16;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-[#6B7280]">
        <p className="text-lg font-medium mb-2">No available times on this date</p>
        <p className="text-sm">Please select another date or check back later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time filter */}
      <div className="flex gap-2">
        {(['all', 'morning', 'afternoon', 'evening'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#0F1D2C] text-white'
                : 'bg-[#F8F6F1] text-[#6B7280] hover:bg-[#E8E4DF]'
            }`}
          >
            {f === 'all' ? 'All Times' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Slots grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {filteredSlots.map(slot => {
          const isSelected = selectedSlot?.startTime === slot.startTime &&
            selectedSlot?.providerId === slot.providerId;

          return (
            <button
              key={`${slot.startTime}-${slot.providerId}-${slot.roomId}`}
              onClick={() => onSelect(slot)}
              disabled={slot.isEmergencyReserved}
              className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-[#C9A96E] text-white shadow-md scale-105'
                  : slot.isEmergencyReserved
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : slot.isOptimal
                      ? 'bg-[#C9A96E]/10 text-[#0F1D2C] border-2 border-[#C9A96E]/30 hover:border-[#C9A96E]'
                      : 'bg-[#F8F6F1] text-[#0F1D2C] hover:bg-[#E8E4DF] border-2 border-transparent'
              }`}
            >
              <span className="block">{slot.startTime}</span>
              <span className="block text-xs opacity-70 mt-0.5">{slot.providerName.split(' ')[0]}</span>
              {slot.isOptimal && !isSelected && (
                <span className="block text-[10px] text-[#C9A96E] mt-0.5">Recommended</span>
              )}
            </button>
          );
        })}
      </div>

      {filteredSlots.length === 0 && (
        <p className="text-center text-sm text-[#6B7280] py-4">
          No slots available for this time preference. Try another filter.
        </p>
      )}
    </div>
  );
}
