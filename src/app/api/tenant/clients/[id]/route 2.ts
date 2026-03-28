import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getClient360 } from '@/lib/saas/tenant-dashboard/clients';

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  const url = new URL(request.url);
  const segments = url.pathname.split('/');
  const clientId = segments[segments.length - 1];

  if (!clientId) {
    return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
  }

  const client = await getClient360(db, tenant, clientId);
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  return NextResponse.json(client);
});
