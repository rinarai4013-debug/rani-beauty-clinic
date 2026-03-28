import { NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getSystemTemplates, getCustomTemplates } from '@/lib/saas/tenant-dashboard/communications';

export const GET = withTenant(async (_request, { tenant, db }) => {
  const [system, custom] = await Promise.all([
    Promise.resolve(getSystemTemplates()),
    getCustomTemplates(db, tenant),
  ]);
  return NextResponse.json([...system, ...custom]);
});
