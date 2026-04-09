import { Tables, fetchAll } from '@/lib/airtable/client';
import { getAllSessionsAsync } from '@/lib/mastermind/session';
import type { ClinicStatus, MastermindPhase, MastermindSession } from '@/types/mastermind';

export interface ConsultIntelligence {
  activeConsults: number;
  weightedPipelineValue: number;
  stuckCount: number;
  staleCount: number;
  reviewNeededCount: number;
  bookedCount: number;
  financingReadyCount: number;
  avgCloseProbability: number;
  topPriority:
    | {
        patientName: string;
        action: string;
        estimatedValue: number;
      }
    | null;
  topOpportunities: {
    patientName: string;
    clinicStatus: ClinicStatus;
    estimatedValue: number;
    closeProbability: number;
    financingReady: boolean;
    action: string;
  }[];
}

interface IntakeFields {
  'Full Name'?: string;
  'Intake Summary (AI)'?: string;
  'Treatment Value (AI)'?: string;
  'Processing Status'?: 'New' | 'Processed' | 'Responded';
}

const STAGE_PROBABILITIES: Record<string, number> = {
  new: 0.1,
  reviewed: 0.25,
  contacted: 0.4,
  booked: 0.8,
  completed: 1.0,
};

const REVIEWABLE_PHASES: MastermindPhase[] = ['plan_ready', 'provider_review'];

function estimateSessionValue(session: MastermindSession): number {
  if (session.selectedPackageTier && session.mastermindPlan?.packages) {
    const pkg = session.mastermindPlan.packages.find((candidate) => candidate.tier === session.selectedPackageTier);
    if (pkg?.price) return pkg.price;
  }

  if (session.mastermindPlan?.recommendations?.primary?.length) {
    const total = session.mastermindPlan.recommendations.primary.reduce(
      (sum, treatment) => sum + (treatment.totalEstimate || treatment.perSession || 0),
      0,
    );
    if (total > 0) return total;
  }

  return 1500;
}

function deriveClinicStatus(session: MastermindSession): ClinicStatus {
  if (session.clinicStatus) return session.clinicStatus;
  if (session.bookedAppointmentId) return 'booked';
  if (session.phase === 'completed') return 'reviewed';
  return 'new';
}

function getCloseProbability(clinicStatus: ClinicStatus, needsReview: boolean, isStuck: boolean): number {
  const base = STAGE_PROBABILITIES[clinicStatus] ?? 0.1;
  if (needsReview) return Math.max(0.15, base - 0.1);
  if (isStuck) return Math.max(0.1, base - 0.15);
  return base;
}

function normalizeSessionConsult(session: MastermindSession) {
  const clinicStatus = deriveClinicStatus(session);
  const estimatedValue = estimateSessionValue(session);
  const updatedAt = new Date(session.updatedAt).getTime();
  const daysSinceLastActivity = Math.floor((Date.now() - updatedAt) / 86400000);
  const needsReview =
    !!session.mastermindPlan &&
    (REVIEWABLE_PHASES.includes(session.phase) ||
      (session.phase === 'provider_review' && session.providerReview?.approvalStatus === 'pending'));

  const isStuck = estimatedValue > 500 && daysSinceLastActivity > 3 && !['booked', 'contacted'].includes(clinicStatus);
  const closeProbability = getCloseProbability(clinicStatus, needsReview, isStuck);
  const financingReady =
    estimatedValue >= 2000 &&
    (clinicStatus === 'reviewed' || clinicStatus === 'contacted' || clinicStatus === 'booked');

  return {
    patientName: session.patientName || 'Unknown',
    clinicStatus,
    estimatedValue,
    weightedValue: Math.round(estimatedValue * closeProbability),
    closeProbability,
    daysSinceLastActivity,
    isStuck,
    needsReview,
    financingReady,
  };
}

function normalizeIntakeConsult(record: { id: string; fields: IntakeFields; createdTime?: string }, linkedSessionIds: Set<string>) {
  const summaryText = record.fields['Intake Summary (AI)'] || '';
  const sessionMatch = summaryText.match(/Session ID:\s*(ms_\w+)/);
  const linkedSessionId = sessionMatch?.[1] || null;

  if (linkedSessionId && linkedSessionIds.has(linkedSessionId)) {
    return null;
  }

  let clinicStatus: ClinicStatus = 'new';
  const procStatus = record.fields['Processing Status'];
  if (procStatus === 'Responded') clinicStatus = 'contacted';
  else if (procStatus === 'Processed') clinicStatus = 'reviewed';

  const estimatedValueRaw = record.fields['Treatment Value (AI)'];
  const estimatedValue = estimatedValueRaw
    ? Number.parseFloat(estimatedValueRaw.replace(/[^0-9.]/g, '')) || 0
    : 0;
  const createdAt = record.createdTime ? new Date(record.createdTime).getTime() : Date.now();
  const daysSinceLastActivity = Math.floor((Date.now() - createdAt) / 86400000);

  const isStuck = estimatedValue > 500 && daysSinceLastActivity > 3 && clinicStatus === 'new';
  const closeProbability = getCloseProbability(clinicStatus, false, isStuck);
  const financingReady = estimatedValue >= 1800 && clinicStatus !== 'new';

  return {
    patientName: record.fields['Full Name'] || 'Unknown',
    clinicStatus,
    estimatedValue,
    weightedValue: Math.round(estimatedValue * closeProbability),
    closeProbability,
    daysSinceLastActivity,
    isStuck,
    needsReview: false,
    financingReady,
  };
}

function getPriorityAction(consult: {
  patientName: string;
  clinicStatus: ClinicStatus;
  isStuck: boolean;
  needsReview: boolean;
  estimatedValue: number;
  financingReady?: boolean;
}): string {
  if (consult.needsReview) return 'Provider review needed';
  if (consult.financingReady && consult.clinicStatus === 'reviewed') return 'Send plan and financing follow-up';
  if (consult.isStuck) return 'Personal follow-up needed';
  if (consult.clinicStatus === 'new') return 'Convert to consult call';
  if (consult.clinicStatus === 'reviewed') return 'Send plan and financing follow-up';
  return 'Protect conversion momentum';
}

export async function fetchConsultIntelligence(): Promise<ConsultIntelligence> {
  try {
    const [mastermindSessions, intakeRecords] = await Promise.all([
      getAllSessionsAsync().catch(() => [] as MastermindSession[]),
      fetchAll<IntakeFields>(
        Tables.intakes(),
        {
          sort: [{ field: 'Created Date', direction: 'desc' }],
          maxRecords: 100,
          fields: ['Full Name', 'Intake Summary (AI)', 'Treatment Value (AI)', 'Processing Status'],
        },
        true,
      ).catch(() => [] as { id: string; fields: IntakeFields; createdTime?: string }[]),
    ]);

    const sessionConsults = mastermindSessions.map(normalizeSessionConsult);
    const linkedSessionIds = new Set(mastermindSessions.map((session) => session.id));
    const intakeConsults = intakeRecords
      .map((record) => normalizeIntakeConsult(record, linkedSessionIds))
      .filter((consult): consult is NonNullable<typeof consult> => consult !== null);

    const allConsults = [...sessionConsults, ...intakeConsults];
    const activeConsults = allConsults.filter((consult) => consult.clinicStatus !== 'closed').length;
    const weightedPipelineValue = allConsults.reduce((sum, consult) => sum + consult.weightedValue, 0);
    const stuckConsults = allConsults
      .filter((consult) => consult.isStuck)
      .sort((a, b) => b.estimatedValue - a.estimatedValue);
    const staleConsults = allConsults.filter((consult) => consult.daysSinceLastActivity >= 7);
    const reviewNeeded = allConsults.filter((consult) => consult.needsReview);
    const financingReady = allConsults.filter((consult) => consult.financingReady);
    const bookedCount = allConsults.filter((consult) => consult.clinicStatus === 'booked').length;
    const topPriorityCandidate = [...reviewNeeded, ...stuckConsults, ...allConsults]
      .sort((a, b) => b.estimatedValue - a.estimatedValue)[0];
    const topOpportunities = [...allConsults]
      .sort((a, b) => (b.weightedValue - a.weightedValue) || (b.estimatedValue - a.estimatedValue))
      .slice(0, 5)
      .map((consult) => ({
        patientName: consult.patientName,
        clinicStatus: consult.clinicStatus,
        estimatedValue: consult.estimatedValue,
        closeProbability: consult.closeProbability,
        financingReady: consult.financingReady,
        action: getPriorityAction(consult),
      }));

    return {
      activeConsults,
      weightedPipelineValue,
      stuckCount: stuckConsults.length,
      staleCount: staleConsults.length,
      reviewNeededCount: reviewNeeded.length,
      bookedCount,
      financingReadyCount: financingReady.length,
      avgCloseProbability: allConsults.length > 0
        ? Math.round((allConsults.reduce((sum, consult) => sum + consult.closeProbability, 0) / allConsults.length) * 100)
        : 0,
      topPriority: topPriorityCandidate
        ? {
            patientName: topPriorityCandidate.patientName,
            action: getPriorityAction(topPriorityCandidate),
            estimatedValue: topPriorityCandidate.estimatedValue,
          }
        : null,
      topOpportunities,
    };
  } catch (error) {
    console.error('[Briefing] Failed to fetch consult intelligence:', error);
    return {
      activeConsults: 0,
      weightedPipelineValue: 0,
      stuckCount: 0,
      staleCount: 0,
      reviewNeededCount: 0,
      bookedCount: 0,
      financingReadyCount: 0,
      avgCloseProbability: 0,
      topPriority: null,
      topOpportunities: [],
    };
  }
}
