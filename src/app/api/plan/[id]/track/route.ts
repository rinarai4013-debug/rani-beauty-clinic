import { NextRequest, NextResponse } from 'next/server';
import { Tables, fetchFirst, updateRecord } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { cache } from '@/lib/cache';

interface TreatmentPlanFields {
  'Status'?: string;
  'Intake Record ID'?: string;
  'Client Name'?: string;
}

/**
 * POST /api/plan/[id]/track
 * Public tracking endpoint — no auth required.
 * Updates the treatment plan status in Airtable based on client actions.
 *
 * Body: { action: 'viewed' | 'selected_tier', tier?: string, timestamp?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, tier, timestamp } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    // Find the treatment plan record linked to this intake record ID
    const safeId = sanitizeFormulaValue(id);
    const records = await fetchFirst<TreatmentPlanFields>(
      Tables.treatmentPlans(),
      1,
      {
        filterByFormula: `{Intake Record ID} = "${safeId}"`,
        sort: [{ field: 'Created Date', direction: 'desc' }],
      },
      true
    );

    if (records.length === 0) {
      // No treatment plan record found — this is fine for plans created before
      // the persistence feature was added. Just acknowledge the tracking event.
      return NextResponse.json({ success: true, tracked: false, reason: 'no_plan_record' });
    }

    const planRecord = records[0];
    const currentStatus = planRecord.fields['Status'] || 'Sent';

    // Determine the new status based on the action
    // Status progression: Sent → Viewed → Selected → Booked
    // Only move forward in the progression, never backward
    let newStatus: string | null = null;

    if (action === 'viewed') {
      if (currentStatus === 'Sent') {
        newStatus = 'Viewed';
      }
    } else if (action === 'selected_tier') {
      if (currentStatus === 'Sent' || currentStatus === 'Viewed') {
        newStatus = 'Selected';
      }
    }

    if (newStatus) {
      await updateRecord<TreatmentPlanFields>(
        Tables.treatmentPlans(),
        planRecord.id,
        { 'Status': newStatus }
      );

      // Invalidate caches so dashboard reflects the update
      cache.invalidatePrefix('treatment-plans');
      cache.invalidate('alerts');
    }

    return NextResponse.json({
      success: true,
      tracked: true,
      previousStatus: currentStatus,
      newStatus: newStatus || currentStatus,
      action,
      tier: tier || null,
      timestamp: timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Plan tracking error:', error);
    // Return 200 even on error — tracking should never break the client experience
    return NextResponse.json({ success: false, error: 'Tracking failed' });
  }
}
