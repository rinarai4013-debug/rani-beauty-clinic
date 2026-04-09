import { NextRequest, NextResponse } from "next/server";
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed, resetIn } = rateLimit("services-catalog", ip, RATE_LIMITS.VIEW);
  if (!allowed) return rateLimitResponse(resetIn);

  return NextResponse.json({ status: "not_implemented" }, { status: 501 });
}
