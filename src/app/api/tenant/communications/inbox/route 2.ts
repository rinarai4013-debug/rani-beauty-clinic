import { NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getInbox } from '@/lib/saas/tenant-dashboard/communications';

export const GET = withTenant(async (_request, { tenant, db }) => {
  const inbox = await getInbox(db, tenant);
  return NextResponse.json(inbox);
});
