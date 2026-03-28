import { NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getAIEngineHub } from '@/lib/saas/tenant-dashboard/ai-engines';

export const GET = withTenant(async (_request, { tenant }) => {
  const hub = getAIEngineHub(tenant);
  return NextResponse.json(hub);
});
