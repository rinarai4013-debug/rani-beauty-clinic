import { NextRequest, NextResponse } from "next/server";
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { withSentry } from '@/lib/sentry-utils';
export async function GET(req: NextRequest) {
  return withSentry('ai/advisor:get', async () => {
    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit("ai", ip, RATE_LIMITS.AI);
    if (!allowed) return rateLimitResponse(resetIn);
    return NextResponse.json({ status: "not_implemented" }, { status: 501 });
  });
}
export async function POST(req: NextRequest) {
  return withSentry('ai/advisor:post', async () => {
    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit("ai", ip, RATE_LIMITS.AI);
    if (!allowed) return rateLimitResponse(resetIn);
    return NextResponse.json({ status: "not_implemented" }, { status: 501 });
  });
}
