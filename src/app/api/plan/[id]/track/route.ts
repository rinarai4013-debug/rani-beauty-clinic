import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Tables, fetchFirst, updateRecord } from '@/lib/airtable/client';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { FIELDS } from '@/lib/airtable/tables';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { getNextStatus, getAutoFollowUp } from '@/lib/plan-builder/plan-status';
import type { PlanStatus } from '@/lib/plan-builder/plan-status';

interface TreatmentPlanFields {
  [key: string]: unknown;
  Status?: string;
  'Intake Record ID'?: string;
  'View Count'?: number;
  'Last Viewed At'?: string;
  'Financing Clicked At'?: string;
}

// Map client-side action strings to status transition triggers
const ACTION_TRIGGER_MAP: Record<string, string> = {
  view: 'client_opens_plan',
  financing_clicked: 'client_clicks_financing',
  booking_clicked: 'client_clicks_booking',
};

const VALID_ACTIONS = Object.keys(ACTION_TRIGGER_MAP);

function generateAccessCode(recordId: string): string {
  const secret = process.env.DASHBOARD_JWT_SECRET;
  if (!secret) throw new Error('DASHBOARD_JWT_SECRET is required');
  const hash = crypto.createHmac('sha256', secret).update(recordId).digest('hex');
  const numericHash = parseInt(hash.slice(0, 8), 16);
  return String(numericHash % 1000000).padStart(6, '0');
}

// ─── POST Handler ─────────────────────────────────────────────────
// Called from client viewer to track plan views and interactions

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('plan-track', ip, RATE_LIMITS.VIEW);
  if (!allowed) return rateLimitResponse(resetIn);

  try {
    const { id } = params;

    if (!id || !/^rec[a-zA-Z0-9]{10,}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    let body: { action?: unknown; code?: unknown } = {};
    try {
      body = (await request.json()) as { action?: unknown; code?: unknown };
    } catch {
      body = {};
    }

    const providedCode =
      typeof body.code === 'string'
        ? body.code
        : new URL(request.url).searchParams.get('code');
    const expectedCode = generateAccessCode(id);

    if (providedCode !== expectedCode) {
      return NextResponse.json({ error: 'ACCESS_CODE_REQUIRED' }, { status: 403 });
    }

    // Parse the action from the request body (defaults to 'view' for backward compat)
    let action = 'view';
    if (typeof body.action === 'string' && VALID_ACTIONS.includes(body.action)) {
      action = body.action;
    }

    const trigger = ACTION_TRIGGER_MAP[action];
    if (!trigger) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const sanitizedId = sanitizeFormulaValue(id);

    // Find the Treatment Plans record linked to this intake record
    const treatmentPlans = await fetchFirst<TreatmentPlanFields>(
      Tables.treatmentPlans(),
      1,
      { filterByFormula: `{Intake Record ID} = '${sanitizedId}'` },
      true
    );

    if (treatmentPlans.length === 0) {
      return NextResponse.json({ error: 'Treatment plan not found' }, { status: 404 });
    }

    const plan = treatmentPlans[0];
    const currentStatus = (plan.fields.Status || 'Sent') as PlanStatus;

    // Use the status machine to determine the next status
    const nextStatus = getNextStatus(currentStatus, trigger);

    if (nextStatus) {
      // Build update payload with tracking metadata
      const now = new Date().toISOString();
      const updateFields: Record<string, unknown> = {
        [FIELDS.treatmentPlans.status]: nextStatus,
      };

      // Track view timestamps and count
      if (action === 'view') {
        const currentViewCount = (plan.fields['View Count'] as number) || 0;
        updateFields[FIELDS.treatmentPlans.lastViewedAt] = now;
        updateFields[FIELDS.treatmentPlans.viewCount] = currentViewCount + 1;
      }

      // Track financing click timestamp
      if (action === 'financing_clicked') {
        updateFields[FIELDS.treatmentPlans.financingClickedAt] = now;
      }

      await updateRecord(Tables.treatmentPlans(), plan.id, updateFields);

      // Check if this transition triggers an auto-follow-up
      const followUp = getAutoFollowUp(currentStatus, trigger);

      return NextResponse.json({
        success: true,
        previousStatus: currentStatus,
        newStatus: nextStatus,
        followUp: followUp
          ? { template: followUp.template, delayHours: followUp.delayHours, action: followUp.action }
          : null,
      });
    }

    // No valid transition — still successful, just no status change
    // Still track repeat views for hot lead detection
    if (action === 'view') {
      const currentViewCount = (plan.fields['View Count'] as number) || 0;
      await updateRecord(Tables.treatmentPlans(), plan.id, {
        [FIELDS.treatmentPlans.lastViewedAt]: new Date().toISOString(),
        [FIELDS.treatmentPlans.viewCount]: currentViewCount + 1,
      });
    }

    return NextResponse.json({
      success: true,
      previousStatus: currentStatus,
      newStatus: currentStatus,
      followUp: null,
    });
  } catch (error) {
    console.error('[Plan Track] Error tracking plan interaction:', error);
    return NextResponse.json(
      { error: 'Failed to track plan interaction' },
      { status: 500 }
    );
  }
}
