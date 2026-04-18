'use client';

import { Calendar, Clock, User, MapPin, ChevronRight } from 'lucide-react';

export interface PortalAppointment {
  id: string;
  service: string;
  provider: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes?: string;
  location?: string;
}

interface AppointmentCardProps {
  appointment: PortalAppointment;
  variant?: 'upcoming' | 'past';
  onRebook?: () => void;
}

export default function AppointmentCard({
  appointment,
  variant = 'upcoming',
  onRebook,
}: AppointmentCardProps) {
  const isUpcoming = variant === 'upcoming';
  const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={`group relative rounded-2xl border p-5 transition-all duration-300 ${
        isUpcoming
          ? 'border-rani-gold/30 bg-white shadow-sm hover:shadow-md hover:border-rani-gold/60'
          : 'border-rani-border bg-white/60 hover:bg-white'
      }`}
    >
      {/* Status indicator */}
      {isUpcoming && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Confirmed
          </span>
        </div>
      )}

      {!isUpcoming && appointment.status && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-rani-muted">
            {appointment.status === 'Completed' ? 'Completed' : appointment.status}
          </span>
        </div>
      )}

      {/* Service name */}
      <h3 className="font-heading text-lg text-rani-navy pr-24">{appointment.service}</h3>

      {/* Details */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-rani-muted">
          <Calendar className="h-4 w-4 text-rani-gold-accessible" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-rani-muted">
          <Clock className="h-4 w-4 text-rani-gold-accessible" />
          <span>
            {appointment.time} &middot; {appointment.duration} min
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-rani-muted">
          <User className="h-4 w-4 text-rani-gold-accessible" />
          <span>{appointment.provider}</span>
        </div>
        {appointment.location && (
          <div className="flex items-center gap-2 text-sm text-rani-muted">
            <MapPin className="h-4 w-4 text-rani-gold-accessible" />
            <span>{appointment.location}</span>
          </div>
        )}
      </div>

      {/* Patient notes (past appointments) */}
      {!isUpcoming && appointment.notes && (
        <div className="mt-4 rounded-xl bg-rani-cream/50 p-3">
          <p className="text-xs font-medium text-rani-navy/60 uppercase tracking-wide mb-1">
            Treatment Notes
          </p>
          <p className="text-sm text-rani-text leading-relaxed">{appointment.notes}</p>
        </div>
      )}

      {/* Rebook button for past appointments */}
      {!isUpcoming && onRebook && (
        <button
          onClick={onRebook}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-rani-navy hover:text-rani-gold transition-colors"
        >
          Rebook this treatment
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
