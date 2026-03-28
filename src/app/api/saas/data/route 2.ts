import { NextRequest, NextResponse } from 'next/server';
import {
  createExport, getExport, getExportHistory,
  createScheduledExport, getScheduledExports,
  createGdprRequest, getGdprRequests,
  createImport, getImportHistory,
  CreateExportSchema, CreateScheduledExportSchema, CreateGdprRequestSchema,
} from '@/lib/saas/data/export';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'exports';
  const tenantId = searchParams.get('tenantId') || '';

  switch (action) {
    case 'exports':
      return NextResponse.json({ exports: getExportHistory(tenantId) });
    case 'export_detail': {
      const exportId = searchParams.get('exportId') || '';
      const exp = getExport(exportId);
      if (!exp) return NextResponse.json({ error: 'Export not found' }, { status: 404 });
      return NextResponse.json({ export: exp });
    }
    case 'scheduled':
      return NextResponse.json({ scheduled: getScheduledExports(tenantId) });
    case 'imports':
      return NextResponse.json({ imports: getImportHistory(tenantId) });
    case 'gdpr':
      return NextResponse.json({ requests: getGdprRequests(tenantId) });
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'export';

    switch (action) {
      case 'export': {
        const parsed = CreateExportSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        const exp = createExport(parsed.data);
        return NextResponse.json({ export: exp }, { status: 201 });
      }
      case 'schedule': {
        const parsed = CreateScheduledExportSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        const sched = createScheduledExport(parsed.data);
        return NextResponse.json({ scheduled: sched }, { status: 201 });
      }
      case 'import': {
        const imp = createImport({ tenantId: body.tenantId, source: body.source, fileName: body.fileName });
        return NextResponse.json({ import: imp }, { status: 201 });
      }
      case 'gdpr': {
        const parsed = CreateGdprRequestSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        const req = createGdprRequest(parsed.data);
        return NextResponse.json({ request: req }, { status: 201 });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
