/**
 * GET /api/dashboard/consultations
 *
 * Unified consultation pipeline API.
 * Merges two data sources into one normalized list:
 *   1. Mastermind sessions (Automation Log table)
 *   2. Airtable Client Intakes (contact form + other submissions)
 *
 * Returns: UnifiedConsultation[] — normalized records with source metadata.
 * Also performs automation-aware status enrichment:
 *   - Detects if Airtable intake has been "Processed" or "Responded" by n8n
 *   - Cross-references Mastermind session data if session ID is in intake summary
 */

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getAllSessionsAsync } from '@/lib/mastermind/session';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { unauthorized } from '@/lib/auth/middleware';
import { apiSuccess, apiError } from '@/lib/mastermind/api-helpers';
import { logPhiAccessFromRequest } from '@/lib/compliance/phi-logger';
import type { MastermindSession, ClinicStatus, ActivityLogEntry, ProviderReviewState, MastermindPhase } from '@/types/mastermind';
import type { UnifiedConsultation } from '@/types/consultations';

// ── Communication signal derivation ──

function deriveCommSignals(
  log: ActivityLogEntry[],
  clinicStatus: ClinicStatus,
  hasBooking: boolean
): { commStatus: 'unsent' | 'sent' | 'viewed' | 'clicked' | 'booked'; lastSentAt: string | null; sendCount: number } {
  if (hasBooking || clinicStatus === 'booked') {
    const sends = log.filter(e => e.action === 'plan_sent' || e.action === 'note_updated' && e.detail?.includes('Plan sent'));
    const lastSend = sends.length > 0 ? sends[sends.length - 1].timestamp : null;
    return { commStatus: 'booked', lastSentAt: lastSend, sendCount: sends.length };
  }

  const sendEvents = log.filter(e =>
    e.action === 'plan_sent' ||
    (e.action === 'note_updated' && e.detail?.includes('Plan sent')) ||
    (e.action === 'note_updated' && e.detail?.includes('Follow-up'))
  );

  if (sendEvents.length === 0) {
    return { commStatus: 'unsent', lastSentAt: null, sendCount: 0 };
  }

  const lastSent = sendEvents[sendEvents.length - 1].timestamp;

  // Check if plan was viewed (share_link_generated implies access was set up)
  const hasView = log.some(e => e.action === 'share_link_generated');

  return {
    commStatus: hasView ? 'viewed' : 'sent',
    lastSentAt: lastSent,
    sendCount: sendEvents.length,
  };
}

// ── Revenue estimation helpers ──

const STAGE_PROBABILITIES: Record<string, number> = {
  new: 0.1,
  reviewed: 0.25,
  contacted: 0.4,
  booked: 0.8,
  completed: 1.0,
};

function estimateSessionValue(s: MastermindSession): { estimatedValue: number; revenueSource: 'package' | 'treatments' | 'ai_estimate' | 'none' } {
  // Best source: selected package price
  if (s.selectedPackageTier && s.mastermindPlan?.packages) {
    const pkg = s.mastermindPlan.packages.find(p => p.tier === s.selectedPackageTier);
    if (pkg?.price) return { estimatedValue: pkg.price, revenueSource: 'package' };
  }

  // Next: sum of primary treatment estimates
  if (s.mastermindPlan?.recommendations?.primary?.length) {
    const total = s.mastermindPlan.recommendations.primary.reduce(
      (sum, t) => sum + (t.totalEstimate || t.perSession || 0), 0
    );
    if (total > 0) return { estimatedValue: total, revenueSource: 'treatments' };
  }

  // Fallback: avg consultation value estimate
  return { estimatedValue: 1500, revenueSource: 'ai_estimate' };
}

function estimateIntakeValue(fields: IntakeFields): { estimatedValue: number; revenueSource: 'ai_estimate' | 'none' } {
  const treatmentValue = fields['Treatment Value (AI)'];
  if (treatmentValue) {
    const parsed = parseFloat(treatmentValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) return { estimatedValue: parsed, revenueSource: 'ai_estimate' };
  }
  return { estimatedValue: 0, revenueSource: 'none' };
}

// ── Normalize Mastermind session ──

function fromMastermindSession(s: MastermindSession): UnifiedConsultation {
  const concerns: string[] = Array.isArray(s.intakeData?.skinConcerns)
    ? (s.intakeData.skinConcerns as string[])
    : [];

  // Automation-aware status: if session has booking, mark booked
  let clinicStatus: ClinicStatus = s.clinicStatus || 'new';
  if (!s.clinicStatus) {
    if (s.bookedAppointmentId) clinicStatus = 'booked';
    else if (s.phase === 'completed') clinicStatus = 'reviewed';
  }

  // Determine if this consultation needs provider review
  const reviewablePhases: MastermindPhase[] = ['plan_ready', 'provider_review'];
  const needsReview = !!s.mastermindPlan && (
    reviewablePhases.includes(s.phase) ||
    (s.phase === 'provider_review' && s.providerReview?.approvalStatus === 'pending')
  );

  // Extract medical flags and contraindications for clinical oversight
  const medicalFlags = s.auraScanResult?.medicalFlags?.map(f => f.flag) || [];
  const contraindications = s.mastermindPlan?.contraindications?.map(c => `${c.treatment}: ${c.reason} (${c.severity})`) || [];

  // Revenue estimation
  const { estimatedValue, revenueSource } = estimateSessionValue(s);
  const stageProbability = STAGE_PROBABILITIES[clinicStatus] ?? 0.1;
  const now = new Date();
  const createdDate = new Date(s.createdAt);
  const updatedDate = new Date(s.updatedAt);
  const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / 86400000);
  const daysSinceLastActivity = Math.floor((now.getTime() - updatedDate.getTime()) / 86400000);

  return {
    id: `ms_${s.id}`,
    source: 'mastermind',
    patientName: s.patientName || 'Unknown',
    email: s.patientEmail || (s.intakeData?.email as string) || '',
    phone: (s.intakeData?.phone as string) || '',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    concerns,
    goals: (s.intakeData?.goals as string) || '',
    timeline: (s.intakeData?.timeline as string) || '',
    budget: (s.intakeData?.budget as string) || '',
    clinicStatus,
    hasPlan: !!s.mastermindPlan,
    hasShareLink: !!s.shareToken,
    shareToken: s.shareToken || null,
    auraScore: s.auraScanResult?.auraScore?.overall ?? null,
    auraGrade: s.auraScanResult?.auraScore?.grade ?? null,
    selectedPackage: s.selectedPackageTier || null,
    pipelinePhase: s.phase,
    intakeSummary: s.mastermindPlan?.aiSummary?.providerFacing || null,
    aiPlan: null,
    aiNextStep: null,
    treatmentValue: null,
    activityLog: s.activityLog || [],
    providerReview: s.providerReview || null,
    needsReview,
    medicalFlags,
    contraindications,
    ...deriveCommSignals(s.activityLog || [], s.clinicStatus || 'new', !!s.bookedAppointmentId),
    estimatedValue,
    weightedValue: Math.round(estimatedValue * stageProbability),
    revenueSource,
    daysSinceCreated,
    daysSinceLastActivity,
    isStuck: estimatedValue > 500 && daysSinceLastActivity > 3 && !['booked', 'contacted'].includes(clinicStatus),
    sessionId: s.id,
    airtableRecordId: null,
  };
}

// ── Normalize Airtable intake ──

interface IntakeFields {
  'Full Name'?: string;
  'Email'?: string;
  'Phone Number'?: string;
  'Intake Summary (AI)'?: string;
  'Program Plan (AI)'?: string;
  'Cost Breakdown (AI)'?: string;
  'Timeline (AI)'?: string;
  'Suggested Next Step (AI)'?: string;
  'Treatment Value (AI)'?: string;
  'Processing Status'?: 'New' | 'Processed' | 'Responded';
}

function fromAirtableIntake(
  record: { id: string; fields: IntakeFields; createdTime?: string },
  linkedSessionIds: Set<string>
): UnifiedConsultation | null {
  const f = record.fields;
  const name = f['Full Name'] || '';

  // Parse session ID from intake summary (the submit route writes it)
  const summaryText = f['Intake Summary (AI)'] || '';
  const sessionMatch = summaryText.match(/Session ID:\s*(ms_\w+)/);
  const linkedSessionId = sessionMatch?.[1] || null;

  // Skip if this intake is already represented by a Mastermind session
  if (linkedSessionId && linkedSessionIds.has(linkedSessionId)) {
    return null;
  }

  // Parse concerns from summary
  const concerns: string[] = [];
  const concernMatch = summaryText.match(/Skin Concerns?:\s*(.+)/i);
  if (concernMatch) {
    concerns.push(
      ...concernMatch[1]
        .split(/,\s*/)
        .map(c => c.trim())
        .filter(c => c && c !== 'Not specified')
    );
  }

  // Parse goals
  const goalsMatch = summaryText.match(/Goals?:\s*(.+)/i);
  const goals = goalsMatch?.[1]?.trim() || '';

  // Automation-aware status: n8n sets Processing Status
  let clinicStatus: ClinicStatus = 'new';
  const procStatus = f['Processing Status'];
  if (procStatus === 'Responded') clinicStatus = 'contacted';
  else if (procStatus === 'Processed') clinicStatus = 'reviewed';

  // Build activity log from what we know
  const activityLog: ActivityLogEntry[] = [];
  if (record.createdTime) {
    activityLog.push({
      timestamp: record.createdTime,
      action: 'submitted',
      detail: 'Consultation submitted via contact form',
    });
  }
  if (procStatus === 'Processed') {
    activityLog.push({
      timestamp: new Date().toISOString(),
      action: 'ai_processed',
      detail: 'AI intake analysis completed (n8n)',
      actor: 'n8n automation',
    });
  }
  if (procStatus === 'Responded') {
    activityLog.push({
      timestamp: new Date().toISOString(),
      action: 'auto_responded',
      detail: 'Automated follow-up sent (n8n)',
      actor: 'n8n automation',
    });
  }

  // Revenue estimation for intake
  const { estimatedValue, revenueSource } = estimateIntakeValue(f);
  const stageProbability = STAGE_PROBABILITIES[clinicStatus] ?? 0.1;
  const now = new Date();
  const createdDate = record.createdTime ? new Date(record.createdTime) : now;
  const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / 86400000);

  return {
    id: `at_${record.id}`,
    source: 'intake_form',
    patientName: name || 'Unknown',
    email: f['Email'] || '',
    phone: f['Phone Number'] || '',
    createdAt: record.createdTime || new Date().toISOString(),
    updatedAt: record.createdTime || new Date().toISOString(),
    concerns,
    goals,
    timeline: '',
    budget: '',
    clinicStatus,
    hasPlan: !!f['Program Plan (AI)'],
    hasShareLink: false,
    shareToken: null,
    auraScore: null,
    auraGrade: null,
    selectedPackage: null,
    pipelinePhase: null,
    intakeSummary: summaryText || null,
    aiPlan: f['Program Plan (AI)'] || null,
    aiNextStep: f['Suggested Next Step (AI)'] || null,
    treatmentValue: f['Treatment Value (AI)'] || null,
    activityLog,
    providerReview: null,
    needsReview: false,
    medicalFlags: [],
    contraindications: [],
    commStatus: procStatus === 'Responded' ? 'sent' : 'unsent' as const,
    lastSentAt: procStatus === 'Responded' ? new Date().toISOString() : null,
    sendCount: procStatus === 'Responded' ? 1 : 0,
    estimatedValue,
    weightedValue: Math.round(estimatedValue * stageProbability),
    revenueSource,
    daysSinceCreated,
    daysSinceLastActivity: daysSinceCreated, // Intakes don't have updatedAt
    isStuck: estimatedValue > 500 && daysSinceCreated > 3 && clinicStatus === 'new',
    sessionId: linkedSessionId,
    airtableRecordId: record.id,
  };
}

// ── Handler ──

export async function GET(request: NextRequest) {
  try {
    // Auth check — staff session required (Wave 11 P0: removed NODE_ENV dev bypass)
    const authSession = await getSessionFromRequest(request).catch(() => null);
    if (!authSession) {
      return unauthorized();
    }

    // Fetch both sources in parallel
    const [mastermindSessions, intakeRecords] = await Promise.all([
      getAllSessionsAsync().catch(err => {
        console.error('[Consultations API] Mastermind fetch failed:', err);
        return [] as MastermindSession[];
      }),
      fetchAll<IntakeFields>(
        Tables.intakes(),
        {
          sort: [{ field: 'Created Date', direction: 'desc' }],
          maxRecords: 100,
          fields: [
            'Full Name', 'Email', 'Phone Number',
            'Intake Summary (AI)', 'Program Plan (AI)',
            'Cost Breakdown (AI)', 'Timeline (AI)',
            'Suggested Next Step (AI)', 'Treatment Value (AI)',
            'Processing Status',
          ],
        },
        true // skipTestFilter — intakes have no "Is Test" field
      ).catch(err => {
        console.error('[Consultations API] Airtable intakes fetch failed:', err);
        return [] as { id: string; fields: IntakeFields; createdTime?: string }[];
      }),
    ]);

    // Normalize mastermind sessions
    const msConsultations = mastermindSessions.map(fromMastermindSession);
    const msSessionIds = new Set(mastermindSessions.map(s => s.id));

    // Normalize intakes (skip duplicates that are linked to mastermind sessions)
    const intakeConsultations = (intakeRecords as { id: string; fields: IntakeFields; createdTime?: string }[])
      .map(r => fromAirtableIntake(r, msSessionIds))
      .filter((c): c is UnifiedConsultation => c !== null);

    // Merge and sort by createdAt (newest first)
    const all = [...msConsultations, ...intakeConsultations].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // HIPAA §164.312(b): consultations list exposes every patient
    // who has ever filled out an intake or started a mastermind
    // session, including name + email + phone + chief concern +
    // AI-generated treatment plan. Aggregate log entry for the list
    // view — individual consultation detail views would need their
    // own per-session log when those endpoints are wired.
    logPhiAccessFromRequest(request, authSession, {
      patientId: '__LIST__',
      patientName: `Consultations list (${all.length} entries: ${msConsultations.length} mastermind + ${intakeConsultations.length} intakes)`,
      action: 'view',
      dataCategory: 'treatment_records',
      details: 'Unified consultation pipeline view',
    });

    return apiSuccess(all);
  } catch (error) {
    console.error('[Consultations API] Error:', error);
    return apiError('Failed to fetch consultations');
  }
}
