import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { enforceAllowedPublicOrigin, enforceContentLength } from '@/lib/security/public-intent-guard';

import { withSentry } from '@/lib/sentry-utils';

const MAX_BOOKING_REQUEST_BYTES = 128 * 1024;

function notImplemented() {
  return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
}

export async function GET(req: NextRequest) {
  return withSentry('booking/book', async () => {
    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit('booking', ip, RATE_LIMITS.BOOKING);

    if (!allowed) return rateLimitResponse(resetIn);
    return notImplemented();
  });
}

export async function POST(req: NextRequest) {
  return withSentry('booking/book', async () => {
    const originError = enforceAllowedPublicOrigin(req);
    if (originError) return originError;

    const sizeError = enforceContentLength(req, MAX_BOOKING_REQUEST_BYTES);
    if (sizeError) return sizeError;

    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit('booking-mutation', ip, RATE_LIMITS.BOOKING);

    if (!allowed) return rateLimitResponse(resetIn);
    return notImplemented();
  });
}
