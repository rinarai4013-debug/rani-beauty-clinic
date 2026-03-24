import { NextRequest, NextResponse } from 'next/server';
import {
  getPostTreatmentTemplate,
  getAllPostTreatmentTemplates,
  getAftercareLinkForService,
  getNextRecommendedService,
  type TemplateVars,
} from '@/lib/templates/post-treatment';
import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/templates/post-treatment
 *
 * Called by n8n workflow W17 (Post-Treatment Trigger) to get rendered
 * SMS and email templates for a specific follow-up step.
 *
 * Body:
 * {
 *   step: "immediate" | "24h-checkin" | "72h-review" | "7d-results" | "30d-rebook",
 *   firstName: string,
 *   serviceName: string,
 *   providerName: string,
 *   appointmentDate: string,
 *   membershipTier?: string
 * }
 *
 * If step is "all", returns all 5 templates (for preview).
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('templates-post-treatment', ip, RATE_LIMITS.WEBHOOK);
  if (!allowed) return rateLimitResponse(resetIn);

  // n8n webhook secret check
  const secret = request.headers.get('x-webhook-secret');
  const n8nKey = process.env.N8N_API_KEY;
  if (n8nKey && secret !== n8nKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const { step, firstName, serviceName, providerName, appointmentDate, membershipTier } = body;

    if (!firstName || !serviceName || !providerName) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, serviceName, providerName' },
        { status: 400 }
      );
    }

    const vars: TemplateVars = {
      firstName,
      serviceName,
      providerName,
      appointmentDate: appointmentDate || new Date().toLocaleDateString(),
      nextRecommendedService: getNextRecommendedService(serviceName),
      membershipTier,
      aftercareLink: getAftercareLinkForService(serviceName),
    };

    if (step === 'all') {
      const templates = getAllPostTreatmentTemplates(vars);
      return NextResponse.json({ templates });
    }

    const template = getPostTreatmentTemplate(step || 'immediate', vars);
    if (!template) {
      return NextResponse.json(
        { error: `Unknown step: ${step}. Valid: immediate, 24h-checkin, 72h-review, 7d-results, 30d-rebook` },
        { status: 400 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Template error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
