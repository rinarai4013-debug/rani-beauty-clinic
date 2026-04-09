import { NextRequest, NextResponse } from "next/server";
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed, resetIn } = rateLimit("checkout", ip, RATE_LIMITS.BOOKING);
  if (!allowed) return rateLimitResponse(resetIn);

  return NextResponse.json({ status: "not_implemented" }, { status: 501 });
}
