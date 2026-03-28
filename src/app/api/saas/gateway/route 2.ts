import { NextRequest, NextResponse } from 'next/server';
import { getGatewayStats, getRequestLogs, getHealthStatus, initializeDefaultRoutes, resetGateway } from '@/lib/saas/api-gateway/router';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';

  initializeDefaultRoutes();

  switch (action) {
    case 'stats': {
      return NextResponse.json(getGatewayStats());
    }
    case 'health': {
      const health = getHealthStatus({
        'Airtable API': { latency: 120, healthy: true },
        'Claude AI': { latency: 450, healthy: true },
        'Mangomint': { latency: 200, healthy: true },
        'Square POS': { latency: 180, healthy: true },
        'Twilio SMS': { latency: 95, healthy: true },
        'Resend Email': { latency: 2100, healthy: true },
        'Pinecone': { latency: 35, healthy: true },
      });
      return NextResponse.json(health);
    }
    case 'logs': {
      const tenantId = searchParams.get('tenantId') || undefined;
      const path = searchParams.get('path') || undefined;
      const status = searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
      return NextResponse.json({ logs: getRequestLogs({ tenantId, path, status, limit }) });
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
