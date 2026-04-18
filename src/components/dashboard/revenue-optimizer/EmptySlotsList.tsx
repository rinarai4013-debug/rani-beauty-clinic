'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, User, ChevronRight } from 'lucide-react';
import type { EmptySlotGap } from '@/lib/revenue/gap-finder';

interface EmptySlotsListProps {
  slots: EmptySlotGap[];
  onFillSlot?: (slot: EmptySlotGap) => void;
}

export default function EmptySlotsList({ slots, onFillSlot }: EmptySlotsListProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-rani-muted font-body text-sm">
        No empty slots found -- schedule is looking healthy!
      </div>
    );
  }

  const groupedByDate = slots.reduce<Record<string, EmptySlotGap[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDate).slice(0, 7).map(([date, dateSlots]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-rani-gold-accessible" />
            <h4 className="text-sm font-heading text-rani-navy">
              {dateSlots[0].dayOfWeek}, {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded-full font-body ${
              dateSlots[0].daysUntil === 0 ? 'bg-red-100 text-red-700' :
              dateSlots[0].daysUntil <= 2 ? 'bg-amber-100 text-amber-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {dateSlots[0].daysUntil === 0 ? 'Today' :
               dateSlots[0].daysUntil === 1 ? 'Tomorrow' :
               `In ${dateSlots[0].daysUntil} days`}
            </span>
          </div>

          <div className="space-y-2 ml-6">
            {dateSlots.map((slot, i) => (
              <motion.div
                key={`${slot.provider}-${slot.timeSlot}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-100 hover:border-rani-gold/30 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <User className="w-4 h-4 text-rani-muted" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-body font-medium text-rani-navy truncate">
                      {slot.provider}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-rani-muted" />
                      <span className="text-xs font-body text-rani-muted">{slot.timeSlot}</span>
                      <span className="text-xs text-rani-muted">({slot.durationMinutes}min)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-heading text-rani-navy">
                      ${Math.round(slot.estimatedRevenue).toLocaleString()}
                    </p>
                    <p className="text-xs font-body text-rani-muted">
                      {slot.suggestedServices[0] || 'Any service'}
                    </p>
                  </div>

                  <span className={`text-xs px-2 py-0.5 rounded font-body ${
                    slot.fillDifficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                    slot.fillDifficulty === 'moderate' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {slot.fillDifficulty}
                  </span>

                  {onFillSlot && (
                    <button
                      onClick={() => onFillSlot(slot)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-rani-gold/10 text-rani-gold-accessible hover:bg-rani-gold/20"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
