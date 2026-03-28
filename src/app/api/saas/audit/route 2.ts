import { NextRequest, NextResponse } from 'next/server';
import {
  searchAuditLog, logAuditEntry, getAuditStats,
  getAnomalies, resolveAnomaly,
  createComplianceExport, getComplianceExports,
  CreateAuditEntrySchema,
} from '@/lib/saas/data/audit-log';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'search';
  const tenantId = searchParams.get('tenantId') || '';

  switch (action) {
    case 'search': {
      const filter = {
        tenantId: tenantId || undefined,
        userId: searchParams.get('userId') || undefined,
        action: (searchParams.get('auditAction') as never) || undefined,
        severity: (searchParams.get('severity') as never) || undefined,
        searchText: searchParams.get('search') || undefined,
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0'),
      };
      return NextResponse.json(searchAuditLog(filter));
    }
    case 'stats': {
      const days = parseInt(searchParams.get('days') || '30');
      return NextResponse.json(getAuditStats(tenantId, days));
    }
    case 'anomalies': {
      const resolved = searchParams.get('resolved') !== null
        ? searchParams.get('resolved') === 'true'
        : undefined;
      return NextResponse.json({ anomalies: getAnomalies(tenantId, resolved) });
    }
    case 'compliance_exports':
      return NextResponse.json({ exports: getComplianceExports(tenantId) });
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'log';

    switch (action) {
      case 'log': {
        const parsed = CreateAuditEntrySchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        const entry = logAuditEntry(parsed.data);
        return NextResponse.json({ entry }, { status: 201 });
      }
      case 'resolve_anomaly': {
        const success = resolveAnomaly(body.anomalyId, body.resolvedBy);
        return NextResponse.json({ success });
      }
      case 'compliance_export': {
        const exp = createComplianceExport(body.tenantId, body.requestedBy, body.filter || {}, body.format || 'json');
        return NextResponse.json({ export: exp }, { status: 201 });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
