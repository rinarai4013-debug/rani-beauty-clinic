import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../middleware';
import { getClientList } from '@/lib/saas/tenant-dashboard/clients';
import type { ClientSortField, SortDirection } from '@/lib/saas/tenant-dashboard/clients';

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
  const search = searchParams.get('search') || undefined;
  const status = searchParams.get('status')?.split(',').filter(Boolean) || undefined;
  const sortField = (searchParams.get('sortField') || 'lastVisit') as ClientSortField;
  const sortDir = (searchParams.get('sortDir') || 'desc') as SortDirection;

  const result = await getClientList(db, tenant, {
    filters: { search, status: status as never },
    sort: { field: sortField, direction: sortDir },
    page,
    pageSize,
  });

  return NextResponse.json(result);
});
