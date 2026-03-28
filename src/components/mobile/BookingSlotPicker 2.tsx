'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import type { TimeSlot } from '@/types/mobile';

interface BookingSlotPickerProps {
  slots: TimeSlot[];
  selectedDate: Date;
  selectedTime: string | null;
  onDateChange: (date: Date) => void;
  onTimeSelect: (time: string, provider: string) => void;
}

const demandColors = {
  low: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  high: 'bg-red-50 border-red-200 text-red-700',
};

const demandLabels = {
  low: 'Low demand',
  medium: 'Popular',
  high: 'High demand',
};

export default function BookingSlotPicker({
  slots,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeSelect,
}: BookingSlotPickerProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const availableSlots = slots.filter((s) => s.available);
  const unavailableSlots = slots.filter((s) => !s.available);

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="w-8 h-8 rounded-full bg-rani-cream flex items-center justify-center"
        >
          <ChevronLeft size={16} className="text-rani-navy" />
        </button>
        <span className="text-sm font-body font-semibold text-rani-navy">
          {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
        </span>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="w-8 h-8 rounded-full bg-rani-cream flex items-center justify-center"
        >
          <ChevronRight size={16} className="text-rani-navy" />
        </button>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <motion.button
              key={day.toISOString()}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDateChange(day)}
              className={`flex flex-col items-center justify-center min-w-[44px] py-2 px-1.5 rounded-xl transition-colors ${
                isSelected
                  ? 'bg-rani-navy text-white'
                  : isToday
                    ? 'bg-[#C9A96E]/10 text-rani-navy'
                    : 'bg-white text-rani-text'
              }`}
            >
              <span className="text-[10px] font-body uppercase">{format(day, 'EEE')}</span>
              <span className="text-sm font-heading font-bold mt-0.5">{format(day, 'd')}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Availability heatmap legend */}
      <div className="flex items-center gap-3 mb-3">
        {Object.entries(demandLabels).map(([level, label]) => (
          <div key={level} className="flex items-center gap-1.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                level === 'low'
                  ? 'bg-emerald-400'
                  : level === 'medium'
                    ? 'bg-amber-400'
                    : 'bg-red-400'
              }`}
            />
            <span className="text-[10px] text-rani-muted font-body">{label}</span>
          </div>
        ))}
      </div>

      {/* Time slots grid */}
      {availableSlots.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {availableSlots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            return (
              <motion.button
                key={slot.time}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTimeSelect(slot.time, slot.provider)}
                className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-rani-navy border-rani-navy text-white shadow-md'
                    : demandColors[slot.demandLevel]
                }`}
              >
                <span className="text-sm font-body font-semibold block">{slot.time}</span>
                <span className="text-[10px] font-body opacity-70 block mt-0.5">
                  {slot.provider.split(' ')[0]}
                </span>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-rani-muted font-body">No available slots for this day</p>
          <p className="text-xs text-rani-muted font-body mt-1">Try another date</p>
        </div>
      )}
    </div>
  );
}
