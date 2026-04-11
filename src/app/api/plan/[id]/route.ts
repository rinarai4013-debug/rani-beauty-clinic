import { NextRequest, NextResponse } from 'next/server';
import { Tables, fetchFirst, updateRecord } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import crypto from 'crypto';

import { withSentry } from '@/lib/sentry-utils';


// ─── Rate Limiting ──────────────────────────────────────────────────
const viewAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW = 60_000; // 1 minute
const MAX_VIEWS = 10; // 10 views per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = viewAttempts.get(ip);

  // Cleanup old entries periodically
  if (viewAttempts.size > 500) {
    for (const [k, v] of viewAttempts) {
      if (now > v.resetAt) viewAttempts.delete(k);
    }
  }

  if (!entry || now > entry.resetAt) {
    viewAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  if (entry.count >= MAX_VIEWS) return true;
  entry.count++;
  return false;
}

// ─── Access Code Generation ─────────────────────────────────────────
// Generates a deterministic 6-digit access code from record ID + secret
function generateAccessCode(recordId: string): string {
  const secret = process.env.DASHBOARD_JWT_SECRET;
  if (!secret) throw new Error('DASHBOARD_JWT_SECRET is required');
  const hash = crypto.createHmac('sha256', secret).update(recordId).digest('hex');
  // Take first 6 digits from hash
  const numericHash = parseInt(hash.slice(0, 8), 16);
  return String(numericHash % 1000000).padStart(6, '0');
}

// ─── Plan Expiry Check ──────────────────────────────────────────────
const PLAN_EXPIRY_DAYS = 7;

function isPlanExpired(createdDate: string | undefined): boolean {
  if (!createdDate) return false; // If no date, allow access (backward compat)
  const created = new Date(createdDate);
  if (isNaN(created.getTime())) return false;
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > PLAN_EXPIRY_DAYS;
}

// ─── Types ──────────────────────────────────────────────────────────

interface IntakeFields {
  'First Name'?: string;
  'Last Name'?: string;
  'Full Name'?: string;
  'Email'?: string;
  'Phone Number'?: string;
  'Phone'?: string;
  'Top Skin Concerns'?: string | string[];
  'Target Areas'?: string | string[];
  'Treatment Interests'?: string | string[];
  'Skin Type'?: string;
  'Cosmetic Treatment History'?: string;
  'Intake Summary (AI)'?: string;
  'Program Plan (AI)'?: string;
  'Cost Breakdown (AI)'?: string;
  'Timeline (AI)'?: string;
  'Suggested Next Step (AI)'?: string;
  'Treatment Value (AI)'?: string;
  'Processing Status'?: string;
  'Created Date'?: string;
  'Intake Intelligence'?: string[];
}

interface IntelligenceFields {
  'Intake Summary (AI)'?: string;
  'Program Plan (AI)'?: string;
  'Cost Breakdown (AI)'?: string;
  'Timeline (AI)'?: string;
  'Suggested Next Step (AI)'?: string;
  'Treatment Value (AI)'?: string;
  'Skin Health Score'?: number;
  'Projected Score'?: number;
  'Client Intakes'?: string[];
}

// ─── GET Handler ────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withSentry('plan/[id]', async () => {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a moment.' },
        { status: 429 }
      );
    }

    const { id } = params;

    if (!id || !/^rec[a-zA-Z0-9]{10,}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // ── Access Code Verification ──
    const url = new URL(request.url);
    const providedCode = url.searchParams.get('code');
    const expectedCode = generateAccessCode(id);

    if (providedCode !== expectedCode) {
      return NextResponse.json(
        { error: 'ACCESS_CODE_REQUIRED', requiresCode: true },
        { status: 403 }
      );
    }

    // ── Fetch Record ──
    const sanitizedId = sanitizeFormulaValue(id);
    let intakeRecord: { id: string; fields: IntakeFields } | null = null;

    try {
      const record = await Tables.intakes().find(id);
      intakeRecord = { id: record.id, fields: record.fields as unknown as IntakeFields };
    } catch {
      const records = await fetchFirst<IntakeFields>(
        Tables.intakes(),
        1,
        { filterByFormula: `RECORD_ID() = '${sanitizedId}'` },
        true
      );
      if (records.length > 0) {
        intakeRecord = records[0];
      }
    }

    if (!intakeRecord) {
      return NextResponse.json({ error: 'Treatment plan not found' }, { status: 404 });
    }

    const intake = intakeRecord.fields;

    // ── Expiry Check ──
    const createdDate = intake['Created Date'];
    if (isPlanExpired(createdDate)) {
      return NextResponse.json(
        {
          error: 'PLAN_EXPIRED',
          message: 'This treatment plan has expired. Please contact us at (425) 539-4440 for a refreshed plan.',
          expiredAt: createdDate,
        },
        { status: 410 }
      );
    }

    // ── Fetch Intelligence ──
    let intelligence: IntelligenceFields | null = null;
    const intelligenceIds = intake['Intake Intelligence'];

    if (intelligenceIds && intelligenceIds.length > 0) {
      try {
        const intelRecord = await Tables.intakeIntelligence().find(intelligenceIds[0]);
        intelligence = intelRecord.fields as unknown as IntelligenceFields;
      } catch {
        // Intelligence not yet generated
      }
    }

    if (!intelligence) {
      try {
        const intelRecords = await fetchFirst<IntelligenceFields>(
          Tables.intakeIntelligence(),
          1,
          {
            filterByFormula: `FIND("${sanitizedId}", ARRAYJOIN({Client Intakes}))`,
          },
          true
        );
        if (intelRecords.length > 0) {
          intelligence = intelRecords[0].fields;
        }
      } catch {
        // Intelligence table may not have matching records
      }
    }

    // ── Build Response (strip sensitive fields) ──
    const firstName = intake['First Name'] || '';
    const lastName = intake['Last Name'] || '';
    const fullName = intake['Full Name'] || `${firstName} ${lastName}`.trim() || 'Valued Client';

    const normalizeField = (val: string | string[] | undefined): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    };

    // Only expose what the client needs - NO email, NO phone in response
    const plan = {
      id: intakeRecord.id,
      clientName: fullName,
      firstName: firstName || fullName.split(' ')[0],
      // Redacted: email and phone NOT sent to client-facing plan page
      email: '',
      phone: '',
      skinConcerns: normalizeField(intake['Top Skin Concerns']),
      targetAreas: normalizeField(intake['Target Areas']),
      treatmentInterests: normalizeField(intake['Treatment Interests']),
      skinType: intake['Skin Type'] || '',
      treatmentHistory: '', // Redacted from public view
      processingStatus: intake['Processing Status'] || 'New',

      intakeSummary:
        intelligence?.['Intake Summary (AI)'] ||
        intake['Intake Summary (AI)'] ||
        null,
      programPlan:
        intelligence?.['Program Plan (AI)'] ||
        intake['Program Plan (AI)'] ||
        null,
      costBreakdown:
        intelligence?.['Cost Breakdown (AI)'] ||
        intake['Cost Breakdown (AI)'] ||
        null,
      timeline:
        intelligence?.['Timeline (AI)'] ||
        intake['Timeline (AI)'] ||
        null,
      suggestedNextStep:
        intelligence?.['Suggested Next Step (AI)'] ||
        intake['Suggested Next Step (AI)'] ||
        null,
      treatmentValue:
        intelligence?.['Treatment Value (AI)'] ||
        intake['Treatment Value (AI)'] ||
        null,

      skinHealthScore: intelligence?.['Skin Health Score'] || null,
      projectedScore: intelligence?.['Projected Score'] || null,

      intelligenceReady: !!intelligence || !!(
        intake['Intake Summary (AI)'] ||
        intake['Program Plan (AI)']
      ),

      // Expiry info for client display
      expiresAt: createdDate
        ? new Date(new Date(createdDate).getTime() + PLAN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
        : null,
    };

    // ── Fire-and-forget: Track plan view ──
    // Update Treatment Plans status from 'Sent' to 'Viewed' if applicable
    // This looks up the Treatment Plans record linked to this intake record
    const trackViewAsync = async () => {
      try {
        const treatmentPlans = await fetchFirst<{ Status?: string; 'Intake Record ID'?: string }>(
          Tables.treatmentPlans(),
          1,
          { filterByFormula: `{Intake Record ID} = '${sanitizedId}'` },
          true
        );
        if (treatmentPlans.length > 0 && treatmentPlans[0].fields.Status === 'Sent') {
          await updateRecord(Tables.treatmentPlans(), treatmentPlans[0].id, {
            [FIELDS.treatmentPlans.status]: 'Viewed',
          });
        }
      } catch (trackErr) {
        console.error('[Plan View Tracking] Failed to update status:', trackErr);
      }
    };
    // Don't await - fire and forget so we don't block the response
    trackViewAsync();

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error fetching treatment plan:', error);
    return NextResponse.json(
      { error: 'Failed to load treatment plan' },
      { status: 500 }
    );
  }

  });
}
