import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from 'zod';

const indexNowQuerySchema = z.object({
  url: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed, resetIn } = rateLimit("indexnow", ip, RATE_LIMITS.VIEW);
  if (!allowed) return rateLimitResponse(resetIn);

  const parsedQuery = indexNowQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams.entries())
  );
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const requestedUrl = parsedQuery.data.url;
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  const keyPath = env.INDEXNOW_KEY_PATH || null;

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
