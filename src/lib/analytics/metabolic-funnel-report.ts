import type { ClinicStatus, MastermindPhase, MastermindSession, ProviderReviewState } from '@/types/mastermind';

export type MetabolicTrackKey = 'glp1' | 'hormones' | 'peptides' | 'hybrid' | 'unknown';
export type RecommendationStatusKey = 'eligible' | 'provider-review-required' | 'ineligible' | 'unknown';

export interface FunnelCounts {
  started: number;
  held: number;
  completed: number;
  eligible: number;
  ineligible: number;
  providerReviewRequired: number;
}

export interface MetabolicFunnelReport {
  totals: FunnelCounts;
  byTrack: Record<MetabolicTrackKey, FunnelCounts>;
  sources: {
    mastermindSessions: number;
    intakeRecords: number;
  };
}

interface IntakeRecordShape {
  fields?: {
    'Intake Summary (AI)'?: string;
    'Processing Status'?: string;
    [key: string]: unknown;
  };
}

const TRACKS: MetabolicTrackKey[] = ['glp1', 'hormones', 'peptides', 'hybrid', 'unknown'];

const EMPTY_COUNTS: FunnelCounts = {
  started: 0,
  held: 0,
  completed: 0,
  eligible: 0,
  ineligible: 0,
  providerReviewRequired: 0,
};

function createTrackBuckets(): Record<MetabolicTrackKey, FunnelCounts> {
  return TRACKS.reduce(
    (acc, track) => {
      acc[track] = { ...EMPTY_COUNTS };
      return acc;
    },
    {} as Record<MetabolicTrackKey, FunnelCounts>,
  );
}

function parseTrack(text: string): MetabolicTrackKey {
  const normalized = text.toLowerCase();
  const explicit =
    normalized.match(/recommended track:\s*(glp1|hormones|peptides|hybrid)/)?.[1] ||
    normalized.match(/metabolic track:\s*(glp1|hormones|peptides|hybrid)/)?.[1];
  if (explicit === 'glp1' || explicit === 'hormones' || explicit === 'peptides' || explicit === 'hybrid') {
    return explicit;
  }

  if (normalized.includes('glp') || normalized.includes('weight')) return 'glp1';
  if (normalized.includes('hormone') || normalized.includes('hrt') || normalized.includes('trt')) return 'hormones';
  if (normalized.includes('peptide') || normalized.includes('nad')) return 'peptides';
  if (normalized.includes('hybrid')) return 'hybrid';
  return 'unknown';
}

function parseStatus(text: string): RecommendationStatusKey {
  const normalized = text.toLowerCase();
  const explicit = normalized.match(/recommendation status:\s*(eligible|provider-review-required|ineligible)/)?.[1];
  if (explicit === 'eligible' || explicit === 'provider-review-required' || explicit === 'ineligible') {
    return explicit;
  }
  if (normalized.includes('provider review required') || normalized.includes('provider-review-required')) {
    return 'provider-review-required';
  }
  if (normalized.includes('ineligible')) return 'ineligible';
  return 'unknown';
}

function inferTrackFromSession(session: MastermindSession): MetabolicTrackKey {
  const notes = `${session.clinicNotes || ''}\n${(session.activityLog || []).map((e) => e.detail || '').join('\n')}`;
  const parsed = parseTrack(notes);
  if (parsed !== 'unknown') return parsed;

  const intake = session.intakeData as Record<string, unknown> | null;
  const preferred = typeof intake?.preferredTrack === 'string' ? parseTrack(intake.preferredTrack) : 'unknown';
  if (preferred !== 'unknown') return preferred;

  const interestValues = Array.isArray(intake?.treatmentInterests)
    ? (intake?.treatmentInterests as unknown[])
    : Array.isArray(intake?.serviceInterests)
      ? (intake?.serviceInterests as unknown[])
      : [];
  const interests = interestValues.join(' ');
  return parseTrack(interests);
}

function inferStatusFromSession(session: MastermindSession): RecommendationStatusKey {
  const review = session.providerReview as ProviderReviewState | null;
  if (review?.approvalStatus === 'pending' || session.phase === 'provider_review') return 'provider-review-required';

  const notes = (session.clinicNotes || '').toLowerCase();
  if (notes.includes('provider review required') || notes.includes('pending provider signoff')) {
    return 'provider-review-required';
  }
  if (notes.includes('ineligible')) return 'ineligible';
  return 'unknown';
}

function inferCompletedFromSession(session: MastermindSession): boolean {
  return (
    session.phase === ('completed' as MastermindPhase) ||
    session.clinicStatus === ('booked' as ClinicStatus) ||
    Boolean(session.bookedAppointmentId)
  );
}

function inferTrackFromIntake(record: IntakeRecordShape): MetabolicTrackKey {
  const summary = String(record.fields?.['Intake Summary (AI)'] || '');
  return parseTrack(summary);
}

function inferStatusFromIntake(record: IntakeRecordShape): RecommendationStatusKey {
  const summary = String(record.fields?.['Intake Summary (AI)'] || '');
  return parseStatus(summary);
}

function inferCompletedFromIntake(record: IntakeRecordShape): boolean {
  const summary = String(record.fields?.['Intake Summary (AI)'] || '').toLowerCase();
  return (
    summary.includes('booked') ||
    summary.includes('appointment confirmed') ||
    summary.includes('status: completed')
  );
}

function apply(status: RecommendationStatusKey, completed: boolean, bucket: FunnelCounts, totals: FunnelCounts) {
  bucket.started += 1;
  totals.started += 1;

  if (completed) {
    bucket.completed += 1;
    totals.completed += 1;
  } else if (status === 'provider-review-required') {
    bucket.held += 1;
    totals.held += 1;
    bucket.providerReviewRequired += 1;
    totals.providerReviewRequired += 1;
  } else if (status === 'ineligible') {
    bucket.ineligible += 1;
    totals.ineligible += 1;
  } else if (status === 'eligible') {
    bucket.eligible += 1;
    totals.eligible += 1;
  }
}

export function buildMetabolicFunnelReport(
  sessions: MastermindSession[],
  intakeRecords: IntakeRecordShape[],
): MetabolicFunnelReport {
  const byTrack = createTrackBuckets();
  const totals = { ...EMPTY_COUNTS };

  for (const session of sessions) {
    const track = inferTrackFromSession(session);
    if (track === 'unknown') continue;
    const status = inferStatusFromSession(session);
    if (status === 'unknown') continue;
    const completed = inferCompletedFromSession(session);
    apply(status, completed, byTrack[track], totals);
  }

  for (const record of intakeRecords) {
    const track = inferTrackFromIntake(record);
    if (track === 'unknown') continue;
    const status = inferStatusFromIntake(record);
    if (status === 'unknown') continue;
    const completed = inferCompletedFromIntake(record);
    apply(status, completed, byTrack[track], totals);
  }

  return {
    totals,
    byTrack,
    sources: {
      mastermindSessions: sessions.length,
      intakeRecords: intakeRecords.length,
    },
  };
}
