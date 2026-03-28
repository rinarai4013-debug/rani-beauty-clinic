'use client';

import { useEffect, useState } from 'react';
import TreatmentTimeline, { type TreatmentEntry } from '@/components/portal/TreatmentTimeline';

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<TreatmentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/patient/treatments');
        const data = await res.json();
        setTreatments(data.treatments || []);
      } catch (e) {
        console.error('Failed to load treatments:', e);
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
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-rani-navy">Treatment History</h1>
        <p className="text-sm text-rani-muted mt-1">
          Your complete treatment journey at Rani Beauty Clinic.
        </p>
      </div>

      {/* Stats summary */}
      {treatments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white border border-rani-border p-4 text-center">
            <p className="text-2xl font-heading font-bold text-rani-navy">{treatments.length}</p>
            <p className="text-[11px] text-rani-muted mt-0.5">Total Treatments</p>
          </div>
          <div className="rounded-xl bg-white border border-rani-border p-4 text-center">
            <p className="text-2xl font-heading font-bold text-rani-navy">
              {new Set(treatments.map((t) => t.service)).size}
            </p>
            <p className="text-[11px] text-rani-muted mt-0.5">Unique Services</p>
          </div>
          <div className="rounded-xl bg-white border border-rani-border p-4 text-center">
            <p className="text-2xl font-heading font-bold text-rani-navy">
              {new Set(treatments.map((t) => t.provider)).size}
            </p>
            <p className="text-[11px] text-rani-muted mt-0.5">Providers</p>
          </div>
        </div>
      )}

      <TreatmentTimeline treatments={treatments} />
    </div>
  );
}
