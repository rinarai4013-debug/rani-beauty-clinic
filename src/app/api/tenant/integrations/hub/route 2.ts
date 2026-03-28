import { NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getIntegrationHub } from '@/lib/saas/tenant-dashboard/integrations';

export const GET = withTenant(async (_request, { tenant }) => {
  const hub = getIntegrationHub(tenant);
  return NextResponse.json(hub);
});
