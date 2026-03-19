import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getFormSubmissions, isConfigured as isJotformConfigured } from '@/lib/jotform/client';
import { listPayments, isConfigured as isSquareConfigured } from '@/lib/square/client';
import { getAppointments, isConfigured as isMangomintConfigured } from '@/lib/mangomint/client';
import { Tables, fetchFirst } from '@/lib/airtable/client';
import { getVapiCallLogs } from '@/lib/phone/vapi-agent';

// POST — test connection to a specific integration
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'manage_settings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { platform } = await request.json();

    switch (platform) {
      case 'mangomint': {
        if (!isMangomintConfigured()) {
          return NextResponse.json({ success: false, message: 'MANGOMINT_API_KEY not set' });
        }
        try {
          const appointments = await getAppointments({ limit: 1 });
          return NextResponse.json({
            success: true,
            message: `Connected — ${appointments.length > 0 ? 'appointments accessible' : 'API reachable'}`,
          });
        } catch (err) {
          return NextResponse.json({
            success: false,
            message: `Failed — ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
      }

      case 'square': {
        if (!isSquareConfigured()) {
          return NextResponse.json({ success: false, message: 'SQUARE_ACCESS_TOKEN not set' });
        }
        try {
          const { payments } = await listPayments({ limit: 1 });
          return NextResponse.json({
            success: true,
            message: `Connected — ${payments.length > 0 ? 'payments accessible' : 'API reachable'}`,
          });
        } catch (err) {
          return NextResponse.json({
            success: false,
            message: `Failed — ${err instanceof Error ? err.message : 'Invalid API key'}`,
          });
        }
      }

      case 'jotform': {
        if (!isJotformConfigured()) {
          return NextResponse.json({ success: false, message: 'JOTFORM_API_KEY not set' });
        }
        try {
          // Fetch 1 submission from the first form (LHR Consent)
          const submissions = await getFormSubmissions('222995765731166', { limit: 1 });
          return NextResponse.json({
            success: true,
            message: `Connected — ${submissions.length > 0 ? 'submissions accessible' : 'API reachable'}`,
          });
        } catch (err) {
          return NextResponse.json({
            success: false,
            message: `Failed — ${err instanceof Error ? err.message : 'Invalid API key'}`,
          });
        }
      }

      case 'plaid': {
        const hasPlaid = !!process.env.PLAID_CLIENT_ID;
        if (!hasPlaid) {
          return NextResponse.json({ success: false, message: 'PLAID_CLIENT_ID not set' });
        }
        try {
          // Check if Plaid env vars are properly configured
          const env = process.env.PLAID_ENV || 'not set';
          const hasSecret = !!process.env.PLAID_SECRET;
          if (!hasSecret) {
            return NextResponse.json({
              success: false,
              message: 'PLAID_SECRET not set',
            });
          }
          return NextResponse.json({
            success: true,
            message: `Connected — environment: ${env}`,
          });
        } catch (err) {
          return NextResponse.json({
            success: false,
            message: `Failed — ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
      }

      case 'airtable': {
        try {
          const records = await fetchFirst(Tables.clients(), 1, {}, true);
          return NextResponse.json({
            success: true,
            message: `Connected — ${records.length > 0 ? 'Clients table accessible' : 'table empty'}`,
          });
        } catch (err) {
          return NextResponse.json({
            success: false,
            message: `Failed — ${err instanceof Error ? err.message : 'Invalid PAT or Base ID'}`,
          });
        }
      }

      case 'vapi': {
        const vapiKey = process.env.VAPI_API_KEY;
        if (!vapiKey) {
          return NextResponse.json({ success: false, message: 'VAPI_API_KEY not set' });
        }
        try {
          const result = await getVapiCallLogs(vapiKey, 1);
          return NextResponse.json({
            success: result.success,
            message: result.success
              ? `Connected — ${result.calls.length} call log(s) retrieved`
              : `Failed — ${result.message}`,
          });
        } catch (err) {
          return NextResponse.json({
            success: false,
            message: `Failed — ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
      }

      case 'pinecone': {
        const pineconeKey = process.env.PINECONE_API_KEY;
        if (!pineconeKey) {
          return NextResponse.json({ success: false, message: 'PINECONE_API_KEY not set' });
        }
        try {
          // Check Pinecone index via REST API
          const res = await fetch('https://api.pinecone.io/indexes', {
            headers: { 'Api-Key': pineconeKey },
          });
          if (res.ok) {
            const data = await res.json();
            const indexCount = data?.indexes?.length ?? 0;
            return NextResponse.json({
              success: true,
              message: `Connected — ${indexCount} index(es)`,
            });
          }
          return NextResponse.json({
            success: false,
            message: 'Failed — invalid API key or unreachable',
          });
        } catch (err) {
          return NextResponse.json({
            success: false,
            message: `Failed — ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
      }

      case 'openai': {
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
          return NextResponse.json({ success: false, message: 'OPENAI_API_KEY not set' });
        }
        try {
          const res = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${openaiKey}` },
          });
          if (res.ok) {
            return NextResponse.json({
              success: true,
              message: 'Connected — API key valid',
            });
          }
          return NextResponse.json({
            success: false,
            message: 'Failed — invalid API key',
          });
        } catch (err) {
          return NextResponse.json({
            success: false,
            message: `Failed — ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
      }

      default:
        return NextResponse.json({ success: false, message: `Unknown platform: ${platform}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      { error: 'Test connection failed', details: String(error) },
      { status: 500 }
    );
  }
}
