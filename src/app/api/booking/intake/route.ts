import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  buildIntakeForm,
  calculateFormProgress,
  getRequiredConsents,
  signConsent,
  updateFormField,
} from '@/lib/booking/intake';
import { createRecord, Tables } from '@/lib/airtable/client';
import { getOrCreateIntakeDraft, getIntakeDraftByFormId, updateIntakeDraftByFormId } from '@/lib/booking/data';
import { logEvent } from '@/lib/logging/structured-logger';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import type { IntakeForm } from '@/lib/booking/types';

const querySchema = z.object({
  clientId: z.string().min(1),
  appointmentId: z.string().optional(),
  serviceId: z.string().optional(),
});

const patchSchema = z.object({
  formId: z.string().min(1),
  action: z.enum(['update-field', 'sign-consent']),
  sectionId: z.string().optional(),
  fieldId: z.string().optional(),
  value: z.any().optional(),
  consentType: z.string().optional(),
  signatureData: z.string().optional(),
});

const submitSchema = z.object({
  formId: z.string().min(1),
  sections: z.any(),
});

function extractField(form: IntakeForm, fieldId: string): string | undefined {
  for (const section of form.sections) {
    const field = section.fields.find((f) => f.id === fieldId);
    if (field && typeof field.value === 'string') return field.value;
  }
  return undefined;
}

function enforceIntakeRateLimit(
  request: NextRequest,
  config: { limit: number; windowMs: number }
): Response | null {
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('booking-intake', ip, config);
  return allowed ? null : rateLimitResponse(resetIn);
}

export async function GET(request: NextRequest) {
  const limited = enforceIntakeRateLimit(request, RATE_LIMITS.VIEW);
  if (limited) return limited;

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const { clientId, appointmentId, serviceId } = parsed.data;
  const { form } = await getOrCreateIntakeDraft(clientId, appointmentId, serviceId, () =>
    buildIntakeForm(clientId, appointmentId, serviceId)
  );

  const requiredConsents = getRequiredConsents(serviceId || 'general');
  const progress = calculateFormProgress(form, requiredConsents);

  return NextResponse.json({ form, requiredConsents, progress });
}

export async function PATCH(request: NextRequest) {
  const limited = enforceIntakeRateLimit(request, { limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { formId, action, sectionId, fieldId, value, consentType, signatureData } = parsed.data;
  const form = await getIntakeDraftByFormId(formId);
  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }

  if (action === 'update-field') {
    if (!sectionId || !fieldId) {
      return NextResponse.json({ error: 'Missing sectionId or fieldId' }, { status: 400 });
    }
    const updated = updateFormField(
      form,
      sectionId,
      fieldId,
      value as string | string[] | boolean | number,
    );
    await updateIntakeDraftByFormId(formId, updated, 'draft');
    return NextResponse.json({ success: true });
  }

  if (action === 'sign-consent') {
    if (!consentType) {
      return NextResponse.json({ error: 'Missing consentType' }, { status: 400 });
    }
    const requiredConsents = getRequiredConsents('general');
    const consent = requiredConsents.find((c) => c.type === consentType);
    if (!consent) {
      return NextResponse.json({ error: 'Unknown consent type' }, { status: 400 });
    }
    const updated = signConsent(form, consent, signatureData);
    await updateIntakeDraftByFormId(formId, updated, 'draft');
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const limited = enforceIntakeRateLimit(request, RATE_LIMITS.FORM);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
  }

  const form = await getIntakeDraftByFormId(parsed.data.formId);
  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }

  const requiredConsents = getRequiredConsents('general');
  const progress = calculateFormProgress(form, requiredConsents);
  if (!progress.isReady) {
    return NextResponse.json({ error: 'Form incomplete', progress }, { status: 409 });
  }

  const firstName = extractField(form, 'first-name');
  const lastName = extractField(form, 'last-name');
  const email = extractField(form, 'email');
  const phone = extractField(form, 'phone');

  try {
    await createRecord(Tables.intakes(), {
      'First Name': firstName,
      'Last Name': lastName,
      'Email': email,
      'Phone': phone,
      'Intake Summary (AI)': JSON.stringify({
        formId: form.id,
        clientId: form.clientId,
        appointmentId: form.appointmentId,
        submittedAt: new Date().toISOString(),
        sections: form.sections,
        consentsSigned: form.consentsSigned,
      }),
      'Processing Status': 'New',
    });

    await updateIntakeDraftByFormId(form.id, form, 'submitted');
    logEvent('api', 'info', 'Intake submitted', { formId: form.id, clientId: form.clientId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logEvent('api', 'error', 'Intake submit failed', { error: String(error) });
    return NextResponse.json({ error: 'Failed to submit intake' }, { status: 500 });
  }
}
