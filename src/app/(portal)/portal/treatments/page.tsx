'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Loader2,
  CalendarDays,
  Sparkles,
  ArrowRight,
  Filter,
  ClipboardList,
  Camera,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import TreatmentTimeline, { type TreatmentEntry } from '@/components/portal/TreatmentTimeline';
import PhotoUploadZone from '@/components/photo-simulation/PhotoUploadZone';
import { clinicInfo } from '@/data/clinic-info';

interface ProgressPhoto {
  id: string;
  label: 'before' | 'after';
  dataUrl: string;
  date: string;
}


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

  // Progress photos state
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);

  const fileToDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }, []);

  const handleBeforePhotosChange = useCallback(
    async (photos: File[]) => {
      setBeforePhotos(photos);
      // Convert new files to stored progress photos
      const newEntries: ProgressPhoto[] = [];
      for (const file of photos) {
        const dataUrl = await fileToDataUrl(file);
        newEntries.push({
          id: `before-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          label: 'before',
          dataUrl,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        });
      }
      setProgressPhotos((prev) => [
        ...prev.filter((p) => p.label !== 'before'),
        ...newEntries,
      ]);
    },
    [fileToDataUrl]
  );

  const handleAfterPhotosChange = useCallback(
    async (photos: File[]) => {
      setAfterPhotos(photos);
      const newEntries: ProgressPhoto[] = [];
      for (const file of photos) {
        const dataUrl = await fileToDataUrl(file);
        newEntries.push({
          id: `after-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          label: 'after',
          dataUrl,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        });
      }
      setProgressPhotos((prev) => [
        ...prev.filter((p) => p.label !== 'after'),
        ...newEntries,
      ]);
    },
    [fileToDataUrl]
  );

  const removeProgressPhoto = useCallback(
    (id: string) => {
      const photo = progressPhotos.find((p) => p.id === id);
      if (!photo) return;
      setProgressPhotos((prev) => prev.filter((p) => p.id !== id));
      if (photo.label === 'before') {
        const idx = progressPhotos.filter((p) => p.label === 'before').findIndex((p) => p.id === id);
        if (idx >= 0) {
          setBeforePhotos((prev) => prev.filter((_, i) => i !== idx));
        }
      } else {
        const idx = progressPhotos.filter((p) => p.label === 'after').findIndex((p) => p.id === id);
        if (idx >= 0) {
          setAfterPhotos((prev) => prev.filter((_, i) => i !== idx));
        }
      }
    },
    [progressPhotos]
  );

  const beforeEntries = progressPhotos.filter((p) => p.label === 'before');
  const afterEntries = progressPhotos.filter((p) => p.label === 'after');

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
        <Loader2 className="w-8 h-8 text-rani-gold-accessible animate-spin" />
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
          <CalendarDays className="w-7 h-7 text-rani-gold-accessible" />
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
            className="font-body text-sm text-rani-gold-accessible hover:text-rani-gold/80 transition-colors font-medium"
          >
            View all treatments
          </button>
        </div>
      )}

      {/* Progress Photos */}
      <section className="bg-white border border-rani-navy/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setProgressOpen(!progressOpen)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-rani-cream/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rani-cream flex items-center justify-center">
              <Camera className="w-5 h-5 text-rani-gold-accessible" />
            </div>
            <div className="text-left">
              <h3 className="font-heading text-lg text-rani-navy">Track Your Progress</h3>
              <p className="font-body text-xs text-rani-muted">
                Upload before &amp; after photos to visualize your transformation
              </p>
            </div>
          </div>
          {progressOpen ? (
            <ChevronUp className="w-5 h-5 text-rani-muted flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-rani-muted flex-shrink-0" />
          )}
        </button>

        {progressOpen && (
          <div className="px-6 pb-6 space-y-6 border-t border-rani-navy/5">
            {/* Upload sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {/* Before */}
              <div>
                <h4 className="font-body text-sm font-semibold text-rani-navy mb-3 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-rani-muted/40" />
                  Before Photos
                </h4>
                <PhotoUploadZone
                  photos={beforePhotos}
                  onPhotosChange={handleBeforePhotosChange}
                  maxPhotos={3}
                />
              </div>

              {/* After */}
              <div>
                <h4 className="font-body text-sm font-semibold text-rani-navy mb-3 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-rani-gold" />
                  After Photos
                </h4>
                <PhotoUploadZone
                  photos={afterPhotos}
                  onPhotosChange={handleAfterPhotosChange}
                  maxPhotos={3}
                />
              </div>
            </div>

            {/* Side-by-side comparison */}
            {(beforeEntries.length > 0 || afterEntries.length > 0) && (
              <div>
                <h4 className="font-body text-sm font-semibold text-rani-navy mb-3">
                  Comparison View
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Before column */}
                  <div className="space-y-3">
                    <div className="text-center font-body text-xs text-rani-muted font-medium uppercase tracking-wider">
                      Before
                    </div>
                    {beforeEntries.length > 0 ? (
                      beforeEntries.map((photo) => (
                        <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-rani-navy/10">
                          <img
                            src={photo.dataUrl}
                            alt="Before"
                            className="w-full aspect-[3/4] object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                            <span className="font-body text-[10px] text-white/80">{photo.date}</span>
                          </div>
                          <button
                            onClick={() => removeProgressPhoto(photo.id)}
                            className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                            aria-label="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-rani-navy/10 flex items-center justify-center">
                        <span className="font-body text-xs text-rani-muted">No photos yet</span>
                      </div>
                    )}
                  </div>

                  {/* After column */}
                  <div className="space-y-3">
                    <div className="text-center font-body text-xs text-rani-muted font-medium uppercase tracking-wider">
                      After
                    </div>
                    {afterEntries.length > 0 ? (
                      afterEntries.map((photo) => (
                        <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-rani-navy/10">
                          <img
                            src={photo.dataUrl}
                            alt="After"
                            className="w-full aspect-[3/4] object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                            <span className="font-body text-[10px] text-white/80">{photo.date}</span>
                          </div>
                          <button
                            onClick={() => removeProgressPhoto(photo.id)}
                            className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                            aria-label="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-rani-navy/10 flex items-center justify-center">
                        <span className="font-body text-xs text-rani-muted">No photos yet</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <p className="font-body text-[10px] text-rani-muted/70 text-center leading-relaxed">
              Photos are stored locally on your device and are not uploaded to any server.
              They will be cleared when you close this browser session.
            </p>
          </div>
        )}
      </section>

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
