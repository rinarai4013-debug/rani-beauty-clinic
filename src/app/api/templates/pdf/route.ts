import { NextRequest, NextResponse } from 'next/server';

import {
  generateAftercareHTML,
  generateAuraSkinScanHTML,
  generateTreatmentRoadmapHTML,
} from '@/lib/templates/pdf-templates';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const MAX_TEMPLATE_BODY_BYTES = 1 * 1024 * 1024;
const templateRequestSchema = z.object({
  template: z.string().trim().min(1),
  data: z.record(z.unknown()),
  responseMode: z.string().optional(),
});

function normalizeTemplate(template: string): 'treatment-roadmap' | 'aftercare' | 'aura-skin-scan' | null {
  const normalized = template.trim().toLowerCase();

  if (
    normalized === 'aura-skin-scan' ||
    normalized === 'skin-scan' ||
    normalized === 'aura' ||
    normalized === 'rina rai aura skin scan pdf' ||
    normalized === 'rina-rai-aura-skin-scan-pdf'
  ) {
    return 'aura-skin-scan';
  }

  if (normalized === 'treatment-roadmap' || normalized === 'roadmap' || normalized === 'treatment-plan') {
    return 'treatment-roadmap';
  }

  if (normalized === 'aftercare') {
    return 'aftercare';
  }

  return null;
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    templates: ['treatment-roadmap', 'aftercare', 'aura-skin-scan'],
    note: 'This endpoint returns branded HTML payloads that can be converted to PDF by n8n, Puppeteer, or a browser print workflow.',
  });
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('templates-pdf', ip, RATE_LIMITS.FORM);
  if (!allowed) return rateLimitResponse(resetIn);

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_TEMPLATE_BODY_BYTES) {
    return NextResponse.json(
      { error: 'Request body must be 1 MB or smaller.' },
      { status: 413 }
    );
  }

  const rawBody = await request.json().catch(() => null);
  const body = templateRequestSchema.safeParse(rawBody);
  if (!body.success) {
    return NextResponse.json(
      { error: 'Expected JSON body with `template` and `data`.' },
      { status: 400 }
    );
  }
  const { template: rawTemplate, responseMode, data } = body.data;

  const template = normalizeTemplate(rawTemplate);
  if (!template) {
    return NextResponse.json(
      { error: `Unknown template "${rawTemplate}".` },
      { status: 400 }
    );
  }

  let html: string;
  let filename: string;

  if (template === 'treatment-roadmap') {
    html = generateTreatmentRoadmapHTML(data);
    filename = 'rani-treatment-roadmap.html';
  } else if (template === 'aftercare') {
    html = generateAftercareHTML(data);
    filename = 'rani-aftercare.html';
  } else {
    html = generateAuraSkinScanHTML(data);
    filename = 'rani-aura-skin-scan.html';
  }

  if (responseMode === 'html') {
    return new NextResponse(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-disposition': `inline; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json({
    success: true,
    template,
    filename,
    html,
  });
}
