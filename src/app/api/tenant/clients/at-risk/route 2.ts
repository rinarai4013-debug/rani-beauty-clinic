import { NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getAtRiskClients } from '@/lib/saas/tenant-dashboard/clients';

export const GET = withTenant(async (_request, { tenant, db }) => {
  const clients = await getAtRiskClients(db, tenant);
  return NextResponse.json(clients);
});
