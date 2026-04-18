'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import type { MobileAppointment } from '@/types/mobile';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

interface AppointmentCardProps {
  appointment: MobileAppointment;
  compact?: boolean;
  onTap?: () => void;
}

function getRelativeDay(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMM d');
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-rani-navy/10 text-rani-navy',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-red-100 text-red-700',
};

export default function AppointmentCard({ appointment, compact, onTap }: AppointmentCardProps) {
  const dayLabel = getRelativeDay(appointment.date);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className="bg-white rounded-2xl p-4 shadow-sm border border-rani-border/30 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-heading text-rani-navy text-base font-semibold leading-tight">
            {appointment.service}
          </h3>
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
              statusColors[appointment.status] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {appointment.status}
          </span>
        </div>
        <ChevronRight size={18} className="text-rani-muted mt-1 flex-shrink-0" />
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-rani-text">
          <Calendar size={14} className="text-rani-gold-accessible flex-shrink-0" />
          <span className="font-body">{dayLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-rani-text">
          <Clock size={14} className="text-rani-gold-accessible flex-shrink-0" />
          <span className="font-body">
            {appointment.time} ({appointment.duration} min)
          </span>
        </div>
        {!compact && (
          <>
            <div className="flex items-center gap-2 text-sm text-rani-text">
              <User size={14} className="text-rani-gold-accessible flex-shrink-0" />
              <span className="font-body">{appointment.provider}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-rani-muted">
              <MapPin size={14} className="text-rani-gold-accessible flex-shrink-0" />
              <span className="font-body text-xs">{appointment.location}</span>
            </div>
          </>
        )}
      </div>

      {/* Deposit badge */}
      {appointment.depositPaid && (
        <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-emerald-700 font-body font-medium">
            Deposit confirmed
          </span>
        </div>
      )}
    </motion.div>
  );
}
