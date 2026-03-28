'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Loader2,
  CalendarDays,
  Sparkles,
  ArrowRight,
  Filter,
  ClipboardList,
} from 'lucide-react';
import TreatmentTimeline, { type TreatmentEntry } from '@/components/portal/TreatmentTimeline';
import { clinicInfo } from '@/data/clinic-info';

type FilterTab = 'All' | 'Facials' | 'Laser' | 'Wellness' | 'Injectables';

const FILTER_TABS: FilterTab[] = ['All', 'Facials', 'Laser', 'Wellness', 'Injectables'];

const CATEGORY_KEYWORDS: Record<Exclude<FilterTab, 'All'>, string[]> = {
  Facials: ['hydrafacial', 'facial', 'peel', 'prx', 'microneedling', 'rf microneedling'],
  Laser: ['laser', 'picoway', 'hair removal', 'ipl', 'sofwave'],
  Wellness: ['vitamin', 'b12', 'glutathione', 'nad', 'tri-immune', 'glp', 'weight', 'injection'],
  Injectables: ['botox', 'filler', 'dysport', 'juvederm', 'restylane', 'sculptra', 'kybella'],
};

function categorizeTreatment(service: string): FilterTab[] {
  const lower = service.toLowerCase();
  const categories: FilterTab[] = [];
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      categories.push(category as FilterTab);
    }
  }
  return categories.length > 0 ? categories : ['All'];
}

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<TreatmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');

  useEffect(() => {
    async function fetchTreatments() {
      try {
        const res = await fetch('/api/patient/treatments');
        if (!res.ok) throw new Error('Failed to load treatment history');
        const json: { treatments: TreatmentEntry[] } = await res.json();
        setTreatments(json.treatments ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchTreatments();
  }, []);

  const filteredTreatments = useMemo(() => {
    if (activeFilter === 'All') return treatments;
    return treatments.filter((t) => {
      const cats = categorizeTreatment(t.service);
      return cats.includes(activeFilter);
    });
  }, [treatments, activeFilter]);

  const filterCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      All: treatments.length,
      Facials: 0,
      Laser: 0,
      Wellness: 0,
      Injectables: 0,
    };
    treatments.forEach((t) => {
      const cats = categorizeTreatment(t.service);
      cats.forEach((cat) => {
        if (cat !== 'All') counts[cat]++;
      });
    });
    return counts;
  }, [treatments]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-rani-gold animate-spin" />
        <p className="font-body text-rani-muted text-sm">Loading your treatment history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <ClipboardList className="w-6 h-6 text-red-400" />
        </div>
        <p className="font-body text-rani-navy text-sm">{error}</p>
      </div>
    );
  }

  if (treatments.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rani-cream flex items-center justify-center">
          <CalendarDays className="w-7 h-7 text-rani-gold" />
        </div>
        <div>
          <h2 className="font-heading text-2xl text-rani-navy mb-2">No Treatments Yet</h2>
          <p className="font-body text-rani-muted text-sm max-w-md">
            Your treatment journey is waiting to begin. Book your first appointment and start your
            transformation with Rani Beauty Clinic.
          </p>
        </div>
        <a
          href={clinicInfo.booking.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-rani-navy text-white font-body text-sm font-medium px-6 py-3 rounded-lg hover:bg-rani-navy/90 transition-colors"
        >
          Book Your First Treatment
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl text-rani-navy mb-2">
          Treatment History
        </h1>
        <p className="font-body text-sm text-rani-muted flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-rani-gold" />
          {treatments.length} treatment{treatments.length !== 1 ? 's' : ''} on record
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        <Filter className="w-4 h-4 text-rani-muted flex-shrink-0 mr-1" />
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`flex-shrink-0 font-body text-sm font-medium px-4 py-2 rounded-full transition-colors ${
              activeFilter === tab
                ? 'bg-rani-navy text-white'
                : 'bg-rani-cream text-rani-muted hover:text-rani-navy hover:bg-rani-cream/80'
            }`}
          >
            {tab}
            <span
              className={`ml-1.5 text-xs ${
                activeFilter === tab ? 'text-white/70' : 'text-rani-muted'
              }`}
            >
              {filterCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Timeline or Empty Filter State */}
      {filteredTreatments.length > 0 ? (
        <TreatmentTimeline treatments={filteredTreatments} />
      ) : (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-rani-cream flex items-center justify-center mx-auto mb-4">
            <Filter className="w-5 h-5 text-rani-muted" />
          </div>
          <p className="font-body text-sm text-rani-muted mb-1">
            No {activeFilter.toLowerCase()} treatments found.
          </p>
          <button
            onClick={() => setActiveFilter('All')}
            className="font-body text-sm text-rani-gold hover:text-rani-gold/80 transition-colors font-medium"
          >
            View all treatments
          </button>
        </div>
      )}

      {/* Book CTA */}
      <section className="bg-rani-cream rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-lg text-rani-navy mb-1">Continue Your Journey</h3>
          <p className="font-body text-sm text-rani-muted">
            Ready for your next treatment? Book your upcoming session.
          </p>
        </div>
        <a
          href={clinicInfo.booking.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-rani-navy text-white font-body text-sm font-semibold px-6 py-3 rounded-lg hover:bg-rani-navy/90 transition-colors flex-shrink-0"
        >
          Book Next Treatment
          <ArrowRight className="w-4 h-4" />
        </a>
      </section>
    </div>
  );
}
