import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIP,
  rateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';

import { withSentry } from '@/lib/sentry-utils';


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
  const ip = getClientIP(req);
  const { allowed, resetIn } = rateLimit('booking', ip, RATE_LIMITS.BOOKING);

  if (!allowed) return rateLimitResponse(resetIn);
  return notImplemented();

  });
}
