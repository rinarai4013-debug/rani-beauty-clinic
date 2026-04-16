import { NextRequest, NextResponse } from "next/server";
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { enforceAllowedPublicOrigin, enforceContentLength } from '@/lib/security/public-intent-guard';
import { withSentry } from '@/lib/sentry-utils';

const MAX_AI_REQUEST_BYTES = 128 * 1024;

export async function GET(req: NextRequest) {
  return withSentry('ai/quiz:get', async () => {
    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit("ai", ip, RATE_LIMITS.AI);
    if (!allowed) return rateLimitResponse(resetIn);
    return NextResponse.json({ status: "not_implemented" }, { status: 501 });
  });
}
export async function POST(req: NextRequest) {
  return withSentry('ai/quiz:post', async () => {
    const originError = enforceAllowedPublicOrigin(req);
    if (originError) return originError;
    const sizeError = enforceContentLength(req, MAX_AI_REQUEST_BYTES);
    if (sizeError) return sizeError;
    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit("ai", ip, RATE_LIMITS.AI);
    if (!allowed) return rateLimitResponse(resetIn);
    return NextResponse.json({ status: "not_implemented" }, { status: 501 });
  });
}
