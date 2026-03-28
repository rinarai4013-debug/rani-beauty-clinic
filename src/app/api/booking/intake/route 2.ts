/**
 * API Route: /api/booking/intake
 *
 * GET - Get intake form for a client/appointment
 * POST - Submit intake form data
 * PATCH - Update a single field or sign consent
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildIntakeForm, updateFormField, signConsent, getRequiredConsents, calculateFormProgress } from '@/lib/booking/intake';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const appointmentId = searchParams.get('appointmentId') ?? undefined;
    const serviceId = searchParams.get('serviceId') ?? undefined;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    // TODO: Check if client has previous data in Airtable to pre-populate
    const form = buildIntakeForm(clientId, appointmentId, serviceId);
    const consents = getRequiredConsents(serviceId ?? '');
    const progress = calculateFormProgress(form, consents);

    return NextResponse.json({ form, requiredConsents: consents, progress });
  } catch (error) {
    console.error('Intake GET error:', error);
    return NextResponse.json({ error: 'Failed to generate intake form' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formId, sections } = body;

    if (!formId || !sections) {
      return NextResponse.json({ error: 'formId and sections are required' }, { status: 400 });
    }

    // TODO: Save completed form to Airtable
    // TODO: Trigger AI intake analysis via n8n

    return NextResponse.json({
      success: true,
      formId,
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Intake POST error:', error);
    return NextResponse.json({ error: 'Failed to submit intake form' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { formId, action } = body;

    if (!formId || !action) {
      return NextResponse.json({ error: 'formId and action are required' }, { status: 400 });
    }

    if (action === 'update-field') {
      const { sectionId, fieldId, value } = body;
      if (!sectionId || !fieldId) {
        return NextResponse.json({ error: 'sectionId and fieldId are required for field updates' }, { status: 400 });
      }

      // TODO: Load form from Airtable, update, save back
      return NextResponse.json({ success: true, fieldId, value });
    }

    if (action === 'sign-consent') {
      const { consentType, signatureData } = body;
      if (!consentType) {
        return NextResponse.json({ error: 'consentType is required for consent signing' }, { status: 400 });
      }

      // TODO: Load form, sign consent, save back
      return NextResponse.json({
        success: true,
        consentType,
        signedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Intake PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update intake form' }, { status: 500 });
  }
}
