/**
 * Sales Funnel API
 *
 * POST - Lead capture, scoring, and email sequence trigger
 * GET  - Funnel metrics and lead data
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  LeadCaptureSchema,
  calculateLeadScore,
  buildEmailSequence,
  segmentClinic,
  generateSandboxCredentials,
  trackConversion,
  type Lead,
} from '@/lib/saas/sales-funnel';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LeadCaptureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // Score the lead
    const score = calculateLeadScore(input);

    // Build email sequence
    const emailSequence = buildEmailSequence(input);

    // Generate sandbox credentials if qualified
    const sandbox = score.qualifiedForDemo
      ? generateSandboxCredentials(input.email)
      : null;

    // Create lead record
    const lead: Lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...input,
      currentSoftware: input.currentSoftware ?? 'none',
      score,
      segment: segmentClinic(input.providerCount),
      stage: score.qualifiedForDemo ? 'marketing_qualified' : 'lead',
      emailSequence,
      abVariants: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    // Track conversion event
    const event = trackConversion(lead.id, 'form_submit', {
      score: score.total,
      segment: lead.segment,
      qualifiedForDemo: score.qualifiedForDemo,
    });

    // In production: save to Airtable, trigger email via Resend, etc.
    // For now, return the lead data

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        score: score.total,
        segment: lead.segment,
        qualifiedForDemo: score.qualifiedForDemo,
        stage: lead.stage,
        nextEmail: emailSequence.steps[0],
      },
      sandbox,
      event,
    });
  } catch (error) {
    console.error('Funnel API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') ?? '30d';

  // In production: fetch from database
  // Mock metrics for now
  const metrics = {
    range,
    visitors: 12450,
    leads: 847,
    mqls: 312,
    demosBooked: 156,
    demosCompleted: 98,
    trialsStarted: 72,
    trialsActive: 34,
    paidCustomers: 47,
    conversionRates: {
      visitorToLead: 6.8,
      leadToMql: 36.8,
      mqlToDemo: 50.0,
      demoToTrial: 73.5,
      trialToPaid: 65.3,
      overallVisitorToPaid: 0.38,
    },
    avgTimeToConvert: 14,
    pipelineValue: 284000,
    pipelineVelocity: 1.6,
  };

  return NextResponse.json(metrics);
}
