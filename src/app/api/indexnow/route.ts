import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed, resetIn } = rateLimit('indexnow', ip, RATE_LIMITS.VIEW);
  if (!allowed) return rateLimitResponse(resetIn);

  const requestedUrl = new URL(req.url).searchParams.get('url');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ranibeautyclinic.com';
  const keyPath = process.env.INDEXNOW_KEY_PATH || null;

  return NextResponse.json({
    status: keyPath ? 'ready' : 'disabled',
    configured: Boolean(keyPath),
    siteUrl,
    requestedUrl,
    mode: 'status',
    message: keyPath
      ? 'IndexNow key is configured and the endpoint is ready for submission automation.'
      : 'IndexNow key path is not configured yet.',
  });
}
