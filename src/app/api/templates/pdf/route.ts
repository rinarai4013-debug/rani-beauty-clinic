import { NextRequest, NextResponse } from 'next/server';

import {
  generateAftercareHTML,
  generateAuraSkinScanHTML,
  generateTreatmentRoadmapHTML,
} from '@/lib/templates/pdf-templates';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_TEMPLATE_BODY_BYTES = 1 * 1024 * 1024;

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

  const body = await request.json().catch(() => null);

  if (!body || typeof body.template !== 'string' || typeof body.data !== 'object' || body.data === null) {
    return NextResponse.json(
      { error: 'Expected JSON body with `template` and `data`.' },
      { status: 400 }
    );
  }

  const template = normalizeTemplate(body.template);
  if (!template) {
    return NextResponse.json(
      { error: `Unknown template "${body.template}".` },
      { status: 400 }
    );
  }

  let html: string;
  let filename: string;

  if (template === 'treatment-roadmap') {
    html = generateTreatmentRoadmapHTML(body.data);
    filename = 'rani-treatment-roadmap.html';
  } else if (template === 'aftercare') {
    html = generateAftercareHTML(body.data);
    filename = 'rani-aftercare.html';
  } else {
    html = generateAuraSkinScanHTML(body.data);
    filename = 'rani-aura-skin-scan.html';
  }

  if (body.responseMode === 'html') {
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
