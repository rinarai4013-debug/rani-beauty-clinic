import { NextRequest, NextResponse } from 'next/server';
import {
  getUsageSummary, getUsageTrend, getOverageAlerts, calculateBill,
  getDashboardData, recordUsage, RecordUsageSchema, setTenantTier,
} from '@/lib/saas/api-gateway/metering';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'summary';
  const tenantId = searchParams.get('tenantId') || 't_001';

  switch (action) {
    case 'summary': {
      const period = (searchParams.get('period') as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'monthly';
      return NextResponse.json(getUsageSummary(tenantId, period));
    }
    case 'trends': {
      const metric = searchParams.get('metric') || 'api_calls';
      const days = parseInt(searchParams.get('days') || '30');
      return NextResponse.json(getUsageTrend(tenantId, metric as never, days));
    }
    case 'alerts': {
      return NextResponse.json({ alerts: getOverageAlerts(tenantId, false) });
    }
    case 'billing': {
      return NextResponse.json(calculateBill(tenantId));
    }
    case 'dashboard': {
      return NextResponse.json(getDashboardData(tenantId));
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RecordUsageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const record = recordUsage(parsed.data);
    return NextResponse.json({ record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
