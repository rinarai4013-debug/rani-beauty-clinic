import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../middleware';
import { getRevenueBreakdown } from '@/lib/saas/tenant-dashboard/revenue';
import { z } from 'zod';

const tenantRevenueQuerySchema = z
  .object({
    start: z.string().refine((value) => Number.isFinite(Date.parse(value)), {
      message: 'Invalid start date',
    }),
    end: z.string().refine((value) => Number.isFinite(Date.parse(value)), {
      message: 'Invalid end date',
    }),
  })
  .partial()
  .superRefine((data, context) => {
    if (data.start && data.end) {
      const start = Date.parse(data.start);
      const end = Date.parse(data.end);
      if (start > end) {
        context.addIssue({
          code: 'custom',
          message: 'start must be before or equal to end',
          path: ['start'],
        });
      }
    }
  });

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  const { searchParams } = new URL(request.url);
  const parsedQuery = tenantRevenueQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries())
  );
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const now = new Date();
  const start = parsedQuery.data.start || new Date(now.getTime() - 30 * 86400000).toISOString();
  const end = parsedQuery.data.end || now.toISOString();
  const breakdown = await getRevenueBreakdown(db, tenant, start, end);
  return NextResponse.json(breakdown);
});
