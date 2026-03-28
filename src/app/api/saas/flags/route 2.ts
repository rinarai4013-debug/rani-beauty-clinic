import { NextRequest, NextResponse } from 'next/server';
import {
  createFlag, updateFlag, deleteFlag, getFlag, getAllFlags,
  setTenantOverride, removeTenantOverride,
  evaluateFlag, evaluateAllFlags,
  getDashboardData, getAbTestResults, getFlagAuditLog,
  initializeDefaultFlags, CreateFlagSchema, UpdateFlagSchema, SetOverrideSchema,
} from '@/lib/saas/feature-flags/manager';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';

  initializeDefaultFlags();

  switch (action) {
    case 'list': {
      const tag = searchParams.get('tag') || undefined;
      const type = searchParams.get('type') as never;
      const enabled = searchParams.get('enabled') !== null ? searchParams.get('enabled') === 'true' : undefined;
      return NextResponse.json({ flags: getAllFlags({ tag, type, enabled }) });
    }
    case 'detail': {
      const key = searchParams.get('key') || '';
      const flag = getFlag(key);
      if (!flag) return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
      return NextResponse.json({ flag });
    }
    case 'evaluate': {
      const tenantId = searchParams.get('tenantId') || '';
      const tier = (searchParams.get('tier') || 'starter') as 'starter' | 'pro' | 'enterprise';
      const userId = searchParams.get('userId') || undefined;
      return NextResponse.json({ flags: evaluateAllFlags({ tenantId, tier, userId }) });
    }
    case 'dashboard':
      return NextResponse.json(getDashboardData());
    case 'ab_results': {
      const flagKey = searchParams.get('flagKey') || '';
      const results = getAbTestResults(flagKey);
      if (!results) return NextResponse.json({ error: 'No A/B test found' }, { status: 404 });
      return NextResponse.json(results);
    }
    case 'audit':
      return NextResponse.json({ entries: getFlagAuditLog({ limit: 100 }) });
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'create';

    initializeDefaultFlags();

    switch (action) {
      case 'create': {
        const parsed = CreateFlagSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        const flag = createFlag(parsed.data);
        return NextResponse.json({ flag }, { status: 201 });
      }
      case 'update': {
        const parsed = UpdateFlagSchema.safeParse(body.updates);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        const flag = updateFlag(body.key, parsed.data, body.performedBy);
        if (!flag) return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
        return NextResponse.json({ flag });
      }
      case 'delete': {
        const success = deleteFlag(body.key, body.performedBy);
        return NextResponse.json({ success });
      }
      case 'set_override': {
        const parsed = SetOverrideSchema.safeParse(body.override);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        const success = setTenantOverride(body.flagKey, parsed.data);
        return NextResponse.json({ success });
      }
      case 'remove_override': {
        const success = removeTenantOverride(body.flagKey, body.tenantId, body.performedBy);
        return NextResponse.json({ success });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
