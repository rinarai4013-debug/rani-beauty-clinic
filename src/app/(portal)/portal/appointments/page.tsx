'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Loader2 } from 'lucide-react';
import { clinicInfo } from '@/data/clinic-info';
import AppointmentCard from '@/components/portal/AppointmentCard';
import type { PortalAppointment } from '@/components/portal/AppointmentCard';

export default function AppointmentsPage() {
  const [upcoming, setUpcoming] = useState<PortalAppointment[]>([]);
  const [past, setPast] = useState<PortalAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const res = await fetch('/api/patient/appointments');
        if (!res.ok) throw new Error('Failed to load appointments');
        const data = await res.json();
        setUpcoming(data.upcoming ?? []);
        setPast(data.past ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-rani-gold-accessible" />
        <p className="text-sm text-rani-navy/60">Loading your appointments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-rani-navy">My Appointments</h1>
          <p className="text-sm text-rani-navy/60 mt-1">
            View and manage your upcoming visits
          </p>
        </div>
        <a
          href={clinicInfo.booking.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-rani-gold px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rani-gold/90"
        >
          <Plus className="h-4 w-4" />
          Book New Appointment
        </a>
      </div>

      {/* Upcoming Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-rani-gold-accessible" />
          <h2 className="text-lg font-medium text-rani-navy">Upcoming</h2>
          <span className="ml-1 rounded-full bg-rani-gold/10 px-2.5 py-0.5 text-xs font-medium text-rani-gold-accessible">
            {upcoming.length}
          </span>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rani-navy/20 bg-white p-8 text-center">
            <Calendar className="mx-auto h-10 w-10 text-rani-navy/20" />
            <p className="mt-3 text-sm font-medium text-rani-navy">No upcoming appointments</p>
            <p className="mt-1 text-sm text-rani-navy/50">
              Ready for your next visit?
            </p>
            <a
              href={clinicInfo.booking.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-rani-gold-accessible hover:underline"
            >
              <Plus className="h-4 w-4" />
              Book an appointment
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <AppointmentCard key={appt.id} appointment={appt} variant="upcoming" />
            ))}
          </div>
        )}
      </section>

      {/* Past Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-rani-navy/40" />
          <h2 className="text-lg font-medium text-rani-navy">Past</h2>
          <span className="ml-1 rounded-full bg-rani-navy/5 px-2.5 py-0.5 text-xs font-medium text-rani-navy/50">
            {past.length}
          </span>
        </div>

        {past.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rani-navy/10 bg-white p-8 text-center">
            <Clock className="mx-auto h-10 w-10 text-rani-navy/10" />
            <p className="mt-3 text-sm text-rani-navy/40">No past appointments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map((appt) => (
              <AppointmentCard key={appt.id} appointment={appt} variant="past" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
