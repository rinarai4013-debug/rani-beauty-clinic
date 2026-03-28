import { NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getDynamicPricing } from '@/lib/saas/tenant-dashboard/ai-engines';

export const GET = withTenant(async (_request, { tenant, db }) => {
  const pricing = await getDynamicPricing(db, tenant);
  return NextResponse.json(pricing);
}, { requiredFeature: 'pricing' });
