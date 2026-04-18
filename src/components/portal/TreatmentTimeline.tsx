'use client';

import { Sparkles, FileText, Image } from 'lucide-react';

export interface TreatmentEntry {
  id: string;
  service: string;
  date: string;
  provider: string;
  notes?: string;
  aftercareUrl?: string;
  beforePhoto?: string;
  afterPhoto?: string;
}

interface TreatmentTimelineProps {
  treatments: TreatmentEntry[];
}

export default function TreatmentTimeline({ treatments }: TreatmentTimelineProps) {
  if (treatments.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="mx-auto h-10 w-10 text-rani-gold-accessible/40" />
        <p className="mt-4 text-rani-muted font-body">No treatments yet.</p>
        <p className="text-sm text-rani-muted/60">Your treatment journey starts here.</p>
      </div>
    );
  }

  // Group treatments by year-month
  const grouped = groupByMonth(treatments);

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-rani-gold/40 via-rani-gold/20 to-transparent" />

      <div className="space-y-8">
        {Object.entries(grouped).map(([monthKey, items]) => (
          <div key={monthKey}>
            {/* Month header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-rani-navy flex items-center justify-center z-10 relative">
                <span className="text-xs font-bold text-rani-gold">
                  {items[0] ? new Date(items[0].date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : ''}
                </span>
              </div>
              <span className="text-sm font-medium text-rani-muted tracking-wide">
                {formatMonthYear(monthKey)}
              </span>
            </div>

            {/* Treatment entries */}
            <div className="ml-[19px] pl-8 space-y-4">
              {items.map((treatment) => (
                <div
                  key={treatment.id}
                  className="relative rounded-2xl border border-rani-border bg-white p-5 transition-all hover:shadow-sm hover:border-rani-gold/30"
                >
                  {/* Connector dot */}
                  <div className="absolute -left-[21px] top-6 h-2.5 w-2.5 rounded-full border-2 border-rani-gold bg-white" />

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading text-base text-rani-navy">
                        {treatment.service}
                      </h4>
                      <p className="text-sm text-rani-muted mt-1">
                        {formatDate(treatment.date)} &middot; {treatment.provider}
                      </p>

                      {treatment.notes && (
                        <p className="mt-3 text-sm text-rani-text/80 leading-relaxed">
                          {treatment.notes}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-3">
                        {treatment.aftercareUrl && (
                          <a
                            href={treatment.aftercareUrl}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-rani-navy hover:text-rani-gold transition-colors"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Aftercare Instructions
                          </a>
                        )}
                        {(treatment.beforePhoto || treatment.afterPhoto) && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rani-navy/60">
                            <Image className="h-3.5 w-3.5" />
                            Photos available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Before/After photos */}
                  {(treatment.beforePhoto || treatment.afterPhoto) && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {treatment.beforePhoto && (
                        <div className="rounded-xl overflow-hidden bg-rani-cream/50 aspect-[4/3]">
                          <div className="h-full flex items-center justify-center">
                            <span className="text-xs text-rani-muted">Before</span>
                          </div>
                        </div>
                      )}
                      {treatment.afterPhoto && (
                        <div className="rounded-xl overflow-hidden bg-rani-cream/50 aspect-[4/3]">
                          <div className="h-full flex items-center justify-center">
                            <span className="text-xs text-rani-muted">After</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function groupByMonth(treatments: TreatmentEntry[]): Record<string, TreatmentEntry[]> {
  const sorted = [...treatments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const grouped: Record<string, TreatmentEntry[]> = {};
  for (const t of sorted) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  }
  return grouped;
}

function formatMonthYear(key: string): string {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
