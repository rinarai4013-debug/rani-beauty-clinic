'use client';

import { useState, useMemo } from 'react';
import { format, addDays, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isBefore, isAfter, startOfDay } from 'date-fns';

interface DatePickerProps {
  selectedDate: string | null;
  onSelect: (_date: string) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: string[];
  highlightedDates?: string[];
}

export default function DatePicker({
  selectedDate,
  onSelect,
  minDate = new Date(),
  maxDate = addMonths(new Date(), 6),
  disabledDates = [],
  highlightedDates = [],
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad start with empty days
    const startDayOfWeek = getDay(monthStart);
    const padding = Array.from({ length: startDayOfWeek }, () => null);

    return [...padding, ...allDays];
  }, [currentMonth]);

  const isDisabled = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (disabledDates.includes(dateStr)) return true;
    if (isBefore(date, startOfDay(minDate))) return true;
    if (isAfter(date, maxDate)) return true;
    if (getDay(date) === 0) return true; // Sundays closed
    return false;
  };

  const prevMonth = () => setCurrentMonth(d => addMonths(d, -1));
  const nextMonth = () => setCurrentMonth(d => addMonths(d, 1));

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DF] p-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-[#F8F6F1] transition-colors"
          disabled={isBefore(startOfMonth(currentMonth), startOfDay(minDate))}
        >
          <svg className="w-5 h-5 text-[#0F1D2C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-[#0F1D2C] font-[family-name:var(--font-heading)]">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-[#F8F6F1] transition-colors"
        >
          <svg className="w-5 h-5 text-[#0F1D2C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-[#6B7280] py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const dateStr = format(day, 'yyyy-MM-dd');
          const disabled = isDisabled(day);
          const selected = selectedDate === dateStr;
          const today = isSameDay(day, new Date());
          const highlighted = highlightedDates.includes(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => !disabled && onSelect(dateStr)}
              disabled={disabled}
              className={`
                relative w-full aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                ${selected
                  ? 'bg-[#C9A96E] text-white shadow-md'
                  : disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : today
                      ? 'bg-[#0F1D2C] text-white'
                      : highlighted
                        ? 'bg-[#C9A96E]/10 text-[#0F1D2C] hover:bg-[#C9A96E]/20'
                        : 'text-[#0F1D2C] hover:bg-[#F8F6F1]'
                }
              `}
            >
              {format(day, 'd')}
              {highlighted && !selected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C9A96E]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
