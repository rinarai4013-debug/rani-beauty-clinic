import { NextRequest, NextResponse } from "next/server";
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { withSentry } from '@/lib/sentry-utils';
export async function GET(req: NextRequest) {
  return withSentry('ai/skin-analysis', async () => {
    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit("ai", ip, RATE_LIMITS.AI);
    if (!allowed) return rateLimitResponse(resetIn);
    return NextResponse.json({ status: "not_implemented" }, { status: 501 });

  });
}
export async function POST(req: NextRequest) {
  return withSentry('ai/skin-analysis', async () => {
    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit("ai", ip, RATE_LIMITS.AI);
    if (!allowed) return rateLimitResponse(resetIn);
    return NextResponse.json({ status: "not_implemented" }, { status: 501 });

  });
}
