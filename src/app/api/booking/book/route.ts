import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIP,
  rateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';

function notImplemented() {
  return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
}

export async function GET(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed, resetIn } = rateLimit('booking', ip, RATE_LIMITS.BOOKING);

  if (!allowed) return rateLimitResponse(resetIn);
  return notImplemented();
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed, resetIn } = rateLimit('booking', ip, RATE_LIMITS.BOOKING);

  if (!allowed) return rateLimitResponse(resetIn);
  return notImplemented();
}
