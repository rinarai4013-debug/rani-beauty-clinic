/**
 * POST /api/mastermind/share/interest
 *
 * Handles patient interest submissions from the shared plan portal.
 * When a patient clicks "I'm Interested in This Package," this endpoint:
 *   1. Validates the share token
 *   2. Creates a Client Intake record in Airtable
 *   3. Fires an n8n webhook for automated follow-up
 *   4. Returns success
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveToken } from '../route';
import { getSessionByIdAsync } from '@/lib/mastermind/session';
import { Tables } from '@/lib/airtable/client';
import { rateLimitedQuery } from '@/lib/airtable/client';

// ── Validation ──

interface InterestPayload {
  token: string;
  name: string;
  phone: string;
  packageTier: 'Start' | 'Transform' | 'Elite';
  message?: string;
}

function validatePayload(body: unknown): { valid: true; data: InterestPayload } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const b = body as Record<string, unknown>;

  if (!b.token || typeof b.token !== 'string') {
    return { valid: false, error: 'token is required' };
  }
  if (!b.name || typeof b.name !== 'string' || b.name.trim().length < 2) {
    return { valid: false, error: 'name is required (minimum 2 characters)' };
  }
  if (!b.phone || typeof b.phone !== 'string' || b.phone.replace(/\D/g, '').length < 10) {
    return { valid: false, error: 'A valid phone number is required' };
  }
  if (!b.packageTier || !['Start', 'Transform', 'Elite'].includes(b.packageTier as string)) {
    return { valid: false, error: 'packageTier must be Start, Transform, or Elite' };
  }

  return {
    valid: true,
    data: {
      token: b.token as string,
      name: (b.name as string).trim(),
      phone: (b.phone as string).trim(),
      packageTier: b.packageTier as InterestPayload['packageTier'],
      message: typeof b.message === 'string' ? b.message.trim() : undefined,
    },
  };
}

// ── POST Handler ──

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate payload
    const validation = validatePayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { token, name, phone, packageTier, message } = validation.data;

    // Validate token (checks cache, falls back to Airtable)
    const tokenRecord = await resolveToken(token);
    if (!tokenRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'This link has expired or is invalid. Please contact Rani Beauty Clinic directly.',
        },
        { status: 404 }
      );
    }

    // Load session for context
    const session = await getSessionByIdAsync(tokenRecord.sessionId);
    const patientName = session?.patientName || name;
    const planPackages = session?.mastermindPlan?.packages || [];
    const selectedPackage = planPackages.find((p) => p.tier === packageTier);

    // Build intake summary
    const intakeSummary = [
      `Patient Interest from Mastermind Share Link`,
      ``,
      `Patient: ${name}`,
      `Phone: ${phone}`,
      `Interested Package: ${packageTier}`,
      selectedPackage ? `Package Value: $${selectedPackage.price.toLocaleString()}` : '',
      selectedPackage ? `Sessions: ${selectedPackage.sessions}` : '',
      message ? `Message: ${message}` : '',
      ``,
      `Original Consultation: ${patientName}`,
      `Session ID: ${tokenRecord.sessionId}`,
      `Submitted via: Patient Share Portal`,
    ]
      .filter(Boolean)
      .join('\n');

    // Write to Airtable Client Intakes
    let airtableSuccess = false;
    try {
      await rateLimitedQuery(() =>
        Tables.intakes().create({
          'Full Name': name,
          'Phone Number': phone,
          'Processing Status': 'New',
          'Intake Summary (AI)': intakeSummary,
          'Program Plan (AI)': selectedPackage
            ? `${selectedPackage.name} (${selectedPackage.tier}) — ${selectedPackage.sessions} sessions`
            : `${packageTier} Package`,
          'Cost Breakdown (AI)': selectedPackage
            ? `Total: $${selectedPackage.price.toLocaleString()} | Monthly (12mo): $${selectedPackage.monthlyPayment12}/mo | Monthly (24mo): $${selectedPackage.monthlyPayment24}/mo`
            : '',
          'Suggested Next Step (AI)': 'Follow up within 24 hours — patient expressed interest via their personalized treatment plan portal.',
          'Treatment Value (AI)': selectedPackage
            ? `$${selectedPackage.price.toLocaleString()}`
            : '',
        } as Record<string, unknown>)
      );
      airtableSuccess = true;
    } catch (err) {
      console.error('[Interest] Airtable write failed:', err);
      // Don't fail the request — webhook may still succeed
    }

    // Fire n8n webhook (best-effort, non-blocking)
    let webhookFired = false;
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const webhookPayload = {
          source: 'mastermind_share_portal',
          event: 'patient_interest',
          timestamp: new Date().toISOString(),
          patient: {
            name,
            phone,
          },
          interest: {
            packageTier,
            packageName: selectedPackage?.name || `${packageTier} Package`,
            packagePrice: selectedPackage?.price || null,
            sessions: selectedPackage?.sessions || null,
            message: message || null,
          },
          consultation: {
            sessionId: tokenRecord.sessionId,
            originalPatient: patientName,
            auraScore: session?.auraScanResult?.auraScore.overall || null,
          },
        };

        // Fire and don't await — we don't want webhook latency in the response
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        }).catch((err) => {
          console.error('[Interest] n8n webhook failed:', err);
        });
        webhookFired = true;
      } catch (err) {
        console.error('[Interest] n8n webhook error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your interest! Our team will reach out to you shortly.',
      details: {
        airtableRecorded: airtableSuccess,
        webhookFired,
      },
    });
  } catch (err) {
    console.error('[Interest] Submission failed:', err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please call us directly at (425) 539-4440.' },
      { status: 500 }
    );
  }
}
