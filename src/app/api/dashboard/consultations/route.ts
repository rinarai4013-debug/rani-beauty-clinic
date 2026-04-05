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
import { getAllSessionsAsync } from '@/lib/mastermind/session';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { requireAuth, unauthorized } from '@/lib/auth/middleware';
import { apiSuccess, apiError } from '@/lib/mastermind/api-helpers';
import type { MastermindSession, ClinicStatus, ActivityLogEntry } from '@/types/mastermind';

// ── Unified record shape ──

export interface UnifiedConsultation {
  id: string;
  source: 'mastermind' | 'intake_form';
  patientName: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  concerns: string[];
  goals: string;
  timeline: string;
  budget: string;
  clinicStatus: ClinicStatus;
  hasPlan: boolean;
  hasShareLink: boolean;
  shareToken: string | null;
  auraScore: number | null;
  auraGrade: string | null;
  selectedPackage: string | null;
  pipelinePhase: string | null;
  intakeSummary: string | null;
  aiPlan: string | null;
  aiNextStep: string | null;
  treatmentValue: string | null;
  activityLog: ActivityLogEntry[];
  // For mastermind sessions, keep session ID for detail actions
  sessionId: string | null;
  // For intake records, keep Airtable record ID
  airtableRecordId: string | null;
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
    sessionId: linkedSessionId,
    airtableRecordId: record.id,
  };
}

// ── Handler ──

export async function GET(request: NextRequest) {
  try {
    const authSession = await requireAuth(request).catch(() => null);
    if (!authSession && process.env.NODE_ENV !== 'development') {
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

    return apiSuccess(all);
  } catch (error) {
    console.error('[Consultations API] Error:', error);
    return apiError('Failed to fetch consultations');
  }
}
