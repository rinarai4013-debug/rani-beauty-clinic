import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { getScheduleOptimizationSnapshot } from '@/lib/dashboard/mangomint-intelligence';
import { z } from 'zod';

const optimizeQuerySchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .partial()
  .superRefine((data, context) => {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      context.addIssue({
        code: 'custom',
        message: 'startDate must be before or equal to endDate',
        path: ['startDate'],
      });
    }
  });

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_schedule')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = optimizeQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries())
  );
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const now = new Date();
  const startDate = parsedQuery.data.startDate || new Date().toISOString().split('T')[0];
  const endDate =
    parsedQuery.data.endDate ||
    new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const cacheKey = `schedule-optimize:${startDate}:${endDate}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const optimization = await getScheduleOptimizationSnapshot(startDate, endDate);
  cache.set(cacheKey, optimization, TTL.MODERATE);
  return NextResponse.json(optimization);
}
