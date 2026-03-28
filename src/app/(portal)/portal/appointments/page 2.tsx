'use client';

import { useEffect, useState } from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import AppointmentCard, { type PortalAppointment } from '@/components/portal/AppointmentCard';

const MANGOMINT_BOOKING_URL = 'https://ranibeautyclinic.mangomint.com';

export default function AppointmentsPage() {
  const [upcoming, setUpcoming] = useState<PortalAppointment[]>([]);
  const [past, setPast] = useState<PortalAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/patient/appointments');
        const data = await res.json();
        setUpcoming(data.upcoming || []);
        setPast(data.past || []);
      } catch (e) {
        console.error('Failed to load appointments:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-rani-navy">Appointments</h1>
          <p className="text-sm text-rani-muted mt-1">Your upcoming and past visits.</p>
        </div>
        <a
          href={MANGOMINT_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-rani-navy px-4 py-2.5 text-sm font-medium text-rani-gold hover:bg-rani-navy-light transition-colors"
        >
          <Calendar className="h-4 w-4" />
          Book New
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <AppointmentCard key={appt.id} appointment={appt} variant="upcoming" />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-rani-border bg-white/50 p-8 text-center">
            <Calendar className="mx-auto h-8 w-8 text-rani-muted/30" />
            <p className="mt-3 text-sm text-rani-muted">No upcoming appointments</p>
          </div>
        )}
      </section>

      {/* Past */}
      <section>
        <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
          Past Appointments ({past.length})
        </h2>
        {past.length > 0 ? (
          <div className="space-y-3">
            {past.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                variant="past"
                onRebook={() => window.open(MANGOMINT_BOOKING_URL, '_blank')}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-rani-border bg-white/50 p-8 text-center">
            <p className="text-sm text-rani-muted">No past appointments yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
