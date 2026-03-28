/**
 * GET /api/tenant/overview - Tenant dashboard overview data
 */

import { NextResponse } from 'next/server';
import { withTenant } from '../middleware';
import { getTenantOverview } from '@/lib/saas/tenant-dashboard/overview';

export const GET = withTenant(async (_request, { tenant, db }) => {
  const overview = await getTenantOverview(db, tenant);
  return NextResponse.json(overview);
});
