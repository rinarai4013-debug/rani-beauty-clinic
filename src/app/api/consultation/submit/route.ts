import { NextRequest, NextResponse } from 'next/server';

import {
  UNIFIED_CATALOG,
  getServicesByConcern,
  getServiceById,
  type UnifiedService,
} from '@/data/services/unified-catalog';
import { analyzeSkinFromPhoto, type SkinAnalysisResult } from '@/lib/photo-simulation/skin-analysis';
import { consultationPayloadSchema } from '@/lib/consultation/schema';
import {
  generateAuraSkinScanHTML,
  generateTreatmentRoadmapHTML,
} from '@/lib/templates/pdf-templates';
import { env } from '@/lib/env';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_PHOTOS = 1;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

class RequestValidationError extends Error {}

interface ConsultationPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  skinConcerns?: string[];
  targetAreas?: string[];
  treatmentInterests?: string[];
  skinType?: string;
  treatmentHistory?: string;
  currentRoutine?: string;
  goals?: string;
  timeline?: string;
  eventDate?: string;
  budget?: string;
  smsConsent?: boolean;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function validatePhoto(file: File): string | null {
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    return 'Photo must be a JPEG, PNG, or WEBP image.';
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return 'Photo must be 8 MB or smaller.';
  }
  return null;
}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
}

async function parseConsultationRequest(request: NextRequest): Promise<{
  payload: ConsultationPayload;
  photos: File[];
}> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const rawData = formData.get('data');
    let payload: ConsultationPayload = {};

    if (typeof rawData === 'string') {
      try {
        payload = JSON.parse(rawData) as ConsultationPayload;
      } catch {
        throw new RequestValidationError('Invalid consultation payload.');
      }
      const parsedPayload = consultationPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        throw new RequestValidationError(
          parsedPayload.error.issues[0]?.message ?? 'Invalid consultation payload.'
        );
      }
      payload = parsedPayload.data as ConsultationPayload;
    } else {
      throw new RequestValidationError('Invalid consultation payload.');
    }

    const photos = formData
      .getAll('photos')
      .filter((value): value is File => value instanceof File);

    if (photos.length > MAX_PHOTOS) {
      throw new RequestValidationError(`Only ${MAX_PHOTOS} photo may be uploaded.`);
    }

    const invalidPhoto = photos.map(validatePhoto).find(Boolean);
    if (invalidPhoto) throw new RequestValidationError(invalidPhoto);

    return { payload, photos };
  }

  const body = await request.json();
  const parsedPayload = consultationPayloadSchema.safeParse(body?.data ?? body ?? {});
  if (!parsedPayload.success) {
    throw new RequestValidationError(parsedPayload.error.issues[0]?.message ?? 'Invalid consultation payload.');
  }

  return {
    payload: parsedPayload.data,
    photos: [],
  };
}

function fullName(payload: ConsultationPayload): string {
  return [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim() || 'Patient';
}

function buildRecommendedServices(
  payload: ConsultationPayload,
  analysis: SkinAnalysisResult | null
): UnifiedService[] {
  const selected = toStringArray(payload.treatmentInterests)
    .map((serviceId) => getServiceById(serviceId))
    .filter((service): service is UnifiedService => Boolean(service));

  const fromConcerns = toStringArray(payload.skinConcerns)
    .flatMap((concern) => getServicesByConcern(concern))
    .filter((service) => service.category !== 'consultation');

  const fromAnalysis = analysis?.recommendations.map((recommendation) => recommendation.service) ?? [];

  const deduped = new Map<string, UnifiedService>();
  [...selected, ...fromConcerns, ...fromAnalysis].forEach((service) => {
    if (!deduped.has(service.id)) {
      deduped.set(service.id, service);
    }
  });

  if (deduped.size === 0) {
    const fallback = UNIFIED_CATALOG.filter(
      (service) =>
        service.category !== 'consultation' &&
        service.bodyAreas.includes('face')
    ).slice(0, 3);
    fallback.forEach((service) => deduped.set(service.id, service));
  }

  return Array.from(deduped.values()).slice(0, 6);
}

function buildRoadmap(services: UnifiedService[], payload: ConsultationPayload) {
  const phaseOne = services.slice(0, 2);
  const phaseTwo = services.slice(2, 4);
  const phaseThree = services.slice(4, 6);

  const phases = [
    {
      phase: 1,
      title: 'Foundation & Skin Reset',
      treatments: (phaseOne.length ? phaseOne : services.slice(0, 1)).map((service) => service.name),
      timeline: 'Weeks 1-4',
      estimatedCost: phaseOne.reduce((sum, service) => sum + service.price, 0),
      notes: payload.goals || 'We begin with treatments that create the fastest visible improvement and establish a healthy baseline.',
    },
    {
      phase: 2,
      title: 'Correction & Boost',
      treatments: phaseTwo.map((service) => service.name),
      timeline: 'Weeks 4-8',
      estimatedCost: phaseTwo.reduce((sum, service) => sum + service.price, 0),
      notes: 'This phase layers targeted treatments to address tone, texture, and firmness in a structured way.',
    },
    {
      phase: 3,
      title: 'Maintenance & Longevity',
      treatments: phaseThree.map((service) => service.name),
      timeline: 'Weeks 8-12',
      estimatedCost: phaseThree.reduce((sum, service) => sum + service.price, 0),
      notes: 'Maintenance keeps momentum strong and helps preserve the results we build during the first two phases.',
    },
  ].filter((phase) => phase.treatments.length > 0);

  const totalEstimate = phases.reduce((sum, phase) => sum + phase.estimatedCost, 0);

  return {
    phases,
    totalEstimate,
  };
}

function buildNextStep(payload: ConsultationPayload): string {
  const timelineMap: Record<string, string> = {
    event: payload.eventDate
      ? `Schedule your consultation this week so we can build toward your event on ${payload.eventDate}.`
      : 'Schedule your consultation this week so we can build an event-ready plan.',
    gradual: 'Book your consultation in the next 7 days so we can start a phased plan focused on steady improvement.',
    ongoing: 'Book a consultation to build a maintenance-focused roadmap you can follow consistently.',
    asap: 'Book the earliest available consultation so we can prioritize high-impact treatments right away.',
  };

  return (
    timelineMap[payload.timeline || ''] ||
    'Book a consultation with Rani Beauty Clinic so we can confirm the plan, personalize sequencing, and review financing if needed.'
  );
}

function buildIntakeSummary(payload: ConsultationPayload, analysis: SkinAnalysisResult | null): string {
  const concernSummary = toStringArray(payload.skinConcerns).join(', ') || 'general skin goals';
  const goalSummary = payload.goals || 'Client requested a personalized treatment roadmap.';
  const analysisSummary = analysis
    ? `Skin scan score ${analysis.overallScore} with profile ${analysis.skinType}. ${analysis.summary}`
    : 'No photo analysis was attached to this submission.';

  return `Client is interested in ${concernSummary}. Goals: ${goalSummary}. ${analysisSummary}`;
}

async function maybePersistIntake(
  payload: ConsultationPayload,
  summary: string,
  roadmap: ReturnType<typeof buildRoadmap>,
  nextSteps: string
): Promise<string | null> {
  if (!env.AIRTABLE_PAT || !env.AIRTABLE_BASE_ID) {
    return null;
  }

  try {
    const { Tables, createRecord } = await import('@/lib/airtable/client');
    const roadmapSummary = roadmap.phases
      .map((phase) => `${phase.title}: ${phase.treatments.join(', ')}`)
      .join(' | ');

    const recordId = await createRecord(Tables.intakes(), {
      'First Name': payload.firstName,
      'Last Name': payload.lastName,
      'Email': payload.email,
      'Phone': payload.phone,
      'Intake Summary (AI)': summary,
      'Program Plan (AI)': roadmapSummary,
      'Cost Breakdown (AI)': `$${roadmap.totalEstimate.toLocaleString()}`,
      'Timeline (AI)': roadmap.phases.map((phase) => phase.timeline).join(', '),
      'Suggested Next Step (AI)': nextSteps,
      'Treatment Value (AI)': `${roadmap.totalEstimate}`,
    });

    return recordId;
  } catch (error) {
    console.error('[ConsultationSubmit] Airtable persistence failed:', error);
    return null;
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'consultation-submit',
    accepts: ['multipart/form-data', 'application/json'],
    outputs: ['intake summary', 'treatment roadmap html', 'optional aura skin scan html'],
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const { allowed, resetIn } = rateLimit('consultation-submit', ip, RATE_LIMITS.FORM);
    if (!allowed) return rateLimitResponse(resetIn);

    const { payload, photos } = await parseConsultationRequest(request);
    const required = ['firstName', 'lastName', 'email'] as const;

    const missing = required.filter((field) => !payload[field]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    let analysis: SkinAnalysisResult | null = null;

    if (photos[0]) {
      const photoDataUrl = await fileToDataUrl(photos[0]);
      try {
        analysis = await analyzeSkinFromPhoto(photoDataUrl);
      } catch (error) {
        console.error('[ConsultationSubmit] Skin analysis failed:', error);
      }
    }

    const services = buildRecommendedServices(payload, analysis);
    const roadmap = buildRoadmap(services, payload);
    const today = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const nextSteps = buildNextStep(payload);
    const summary = buildIntakeSummary(payload, analysis);

    const roadmapHtml = generateTreatmentRoadmapHTML({
      clientName: fullName(payload),
      providerName: 'Rina Rai',
      date: today,
      treatmentPlan: roadmap.phases,
      totalEstimate: roadmap.totalEstimate,
      goals: payload.goals ? [payload.goals] : ['Create a personalized treatment roadmap based on the consultation intake.'],
      financingOptions:
        payload.budget === 'investment' || payload.budget === 'premium'
          ? 'Financing options may be available through Cherry, PatientFi, and eligible HSA/FSA plans.'
          : undefined,
      nextSteps,
    });

    const auraHtml = analysis
      ? generateAuraSkinScanHTML({
          clientName: fullName(payload),
          providerName: 'Rina Rai',
          date: today,
          overallScore: analysis.overallScore,
          projectedScore: analysis.projectedScore,
          skinType: analysis.skinType,
          ageRange: analysis.ageRange,
          summary: analysis.summary,
          concerns: analysis.concerns,
          recommendations: analysis.recommendations.map((recommendation) => ({
            name: recommendation.service.name,
            priority: recommendation.priority,
            reason: recommendation.reason,
            estimatedImprovement: recommendation.estimatedImprovement,
          })),
          nextSteps,
        })
      : null;

    const intakeId = await maybePersistIntake(payload, summary, roadmap, nextSteps);

    return NextResponse.json({
      success: true,
      intakeId,
      summary,
      analysis,
      recommendedServices: services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        category: service.category,
      })),
      reports: {
        treatmentRoadmap: {
          filename: `rani-treatment-roadmap-${new Date().toISOString().slice(0, 10)}.html`,
          html: roadmapHtml,
        },
        auraSkinScan: auraHtml
          ? {
              filename: `rani-aura-skin-scan-${new Date().toISOString().slice(0, 10)}.html`,
              html: auraHtml,
            }
          : null,
      },
      nextSteps,
    });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('[consultation/submit] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to submit consultation. Please try again.' },
      { status: 500 },
    );
  }
}
