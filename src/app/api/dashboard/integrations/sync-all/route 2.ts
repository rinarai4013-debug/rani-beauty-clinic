import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { isConfigured as isJotformConfigured } from '@/lib/jotform/client';
import { isConfigured as isSquareConfigured } from '@/lib/square/client';
import { isConfigured as isMangomintConfigured, isWebhookConfigured as isMangomintWebhookConfigured } from '@/lib/mangomint/client';
import { Tables, createRecord } from '@/lib/airtable/client';
import { logSyncEvent } from '@/lib/logging/structured-logger';
import { cache } from '@/lib/cache';

// Cache keys for sync metadata
const SYNC_META_KEY = 'integration:sync-meta';

interface SyncMeta {
  [platform: string]: {
    lastSync: string;      // ISO timestamp
    lastError: string | null;
    lastStatus: 'success' | 'error' | 'not_configured' | 'not_connected' | 'webhooks_only';
  };
}

// Helper: write sync log to Airtable Alerts table
async function writeSyncLog(
  type: 'sync_log' | 'sync_error',
  message: string,
  severity: 'info' | 'warning' = 'info'
) {
  try {
    await createRecord(Tables.alerts(), {
      'Type': type,
      'Severity': severity,
      'Message': message,
      'Status': 'active',
      'Created Date': new Date().toISOString(),
    });
  } catch (err) {
    console.error('[sync-all] Failed to write sync log:', err);
  }
}

// Helper: build summary message from sync data
function buildSyncSummary(platform: string, data: Record<string, unknown>): string {
  const parts: string[] = [];
  if (data.newClientsAdded !== undefined) parts.push(`${data.newClientsAdded} new clients`);
  if (data.newTransactionsAdded !== undefined) parts.push(`${data.newTransactionsAdded} new transactions`);
  if (data.added !== undefined) parts.push(`${data.added} new records`);
  if (data.alreadyExisted !== undefined && (data.alreadyExisted as number) > 0) {
    parts.push(`${data.alreadyExisted} skipped`);
  }
  if (data.totalSubmissions !== undefined) parts.push(`${data.totalSubmissions} total submissions`);
  if (data.totalPayments !== undefined) parts.push(`${data.totalPayments} total payments`);

  return `[${platform}] sync completed: ${parts.length > 0 ? parts.join(', ') : 'no changes'}`;
}

// POST - trigger sync across all configured platforms
// Can also be called by cron/webhook for automatic syncing
export async function POST(request: NextRequest) {
  try {
    // Support both session auth and API key auth (for cron jobs)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader === `Bearer ${cronSecret}` && cronSecret) {
      // Authorized via cron secret - skip session check
    } else {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasPermission(session.role, 'manage_settings')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const results: Record<string, unknown> = {
      syncedAt: new Date().toISOString(),
      platforms: {},
    };

    // Load existing sync meta from cache (or start fresh)
    const syncMeta: SyncMeta = cache.get<SyncMeta>(SYNC_META_KEY) || {};
    const now = new Date().toISOString();

    // 1. Sync Jotform
    if (isJotformConfigured()) {
      try {
        const baseUrl = request.nextUrl.origin;
        const jotformRes = await fetch(`${baseUrl}/api/dashboard/integrations/jotform`, {
          method: 'POST',
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        });
        const jotformData = await jotformRes.json();
        const status = jotformRes.ok ? 'success' : 'error';
        (results.platforms as Record<string, unknown>).jotform = {
          status,
          ...jotformData,
        };

        syncMeta.jotform = { lastSync: now, lastError: null, lastStatus: status as 'success' | 'error' };

        if (jotformRes.ok) {
          const created = (jotformData.added as number) || 0;
          const skipped = (jotformData.alreadyExisted as number) || 0;
          logSyncEvent('jotform', created, skipped);
          await writeSyncLog('sync_log', buildSyncSummary('Jotform', jotformData));
        } else {
          const errMsg = jotformData.error || 'Unknown error';
          syncMeta.jotform.lastError = errMsg;
          logSyncEvent('jotform', 0, 0, errMsg);
          await writeSyncLog('sync_error', `[Jotform] sync failed: ${errMsg}`, 'warning');
        }
      } catch (err) {
        const errMsg = String(err);
        (results.platforms as Record<string, unknown>).jotform = {
          status: 'error',
          error: errMsg,
        };
        syncMeta.jotform = { lastSync: now, lastError: errMsg, lastStatus: 'error' };
        logSyncEvent('jotform', 0, 0, errMsg);
        await writeSyncLog('sync_error', `[Jotform] sync failed: ${errMsg}`, 'warning');
      }
    } else {
      (results.platforms as Record<string, unknown>).jotform = {
        status: 'not_configured',
        message: 'Add JOTFORM_API_KEY to .env.local',
      };
    }

    // 2. Sync Square
    if (isSquareConfigured()) {
      try {
        const baseUrl = request.nextUrl.origin;
        const squareRes = await fetch(`${baseUrl}/api/dashboard/integrations/square`, {
          method: 'POST',
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        });
        const squareData = await squareRes.json();
        const status = squareRes.ok ? 'success' : 'error';
        (results.platforms as Record<string, unknown>).square = {
          status,
          ...squareData,
        };

        syncMeta.square = { lastSync: now, lastError: null, lastStatus: status as 'success' | 'error' };

        if (squareRes.ok) {
          const created = (squareData.newTransactionsAdded as number) || 0;
          const skipped = (squareData.alreadyExisted as number) || 0;
          logSyncEvent('square', created, skipped);
          await writeSyncLog('sync_log', buildSyncSummary('Square', squareData));
        } else {
          const errMsg = squareData.error || 'Unknown error';
          syncMeta.square.lastError = errMsg;
          logSyncEvent('square', 0, 0, errMsg);
          await writeSyncLog('sync_error', `[Square] sync failed: ${errMsg}`, 'warning');
        }
      } catch (err) {
        const errMsg = String(err);
        (results.platforms as Record<string, unknown>).square = {
          status: 'error',
          error: errMsg,
        };
        syncMeta.square = { lastSync: now, lastError: errMsg, lastStatus: 'error' };
        logSyncEvent('square', 0, 0, errMsg);
        await writeSyncLog('sync_error', `[Square] sync failed: ${errMsg}`, 'warning');
      }
    } else {
      (results.platforms as Record<string, unknown>).square = {
        status: 'not_configured',
        message: 'Add SQUARE_ACCESS_TOKEN to .env.local (from developer.squareup.com)',
      };
    }

    // 3. Plaid bank sync (if connected)
    try {
      const baseUrl = request.nextUrl.origin;
      const plaidRes = await fetch(`${baseUrl}/api/dashboard/plaid/transactions/sync`, {
        method: 'POST',
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      });
      if (plaidRes.ok) {
        const plaidData = await plaidRes.json();
        (results.platforms as Record<string, unknown>).plaid = {
          status: 'success',
          ...plaidData,
        };
        syncMeta.plaid = { lastSync: now, lastError: null, lastStatus: 'success' };
        logSyncEvent('plaid', (plaidData.added as number) || 0, 0);
        await writeSyncLog('sync_log', buildSyncSummary('Plaid', plaidData));
      } else {
        (results.platforms as Record<string, unknown>).plaid = {
          status: 'not_connected',
          message: 'Connect bank account via Plaid Link in dashboard',
        };
        syncMeta.plaid = { lastSync: now, lastError: null, lastStatus: 'not_connected' };
      }
    } catch (err) {
      const errMsg = String(err);
      (results.platforms as Record<string, unknown>).plaid = {
        status: 'not_connected',
      };
      syncMeta.plaid = { lastSync: now, lastError: errMsg, lastStatus: 'not_connected' };
      logSyncEvent('plaid', 0, 0, errMsg);
      await writeSyncLog('sync_error', `[Plaid] sync failed: ${errMsg}`, 'warning');
    }

    // 4. Sync Mangomint
    if (isMangomintConfigured()) {
      try {
        const baseUrl = request.nextUrl.origin;
        const mangomintRes = await fetch(`${baseUrl}/api/dashboard/integrations/mangomint`, {
          method: 'POST',
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        });
        const mangomintData = await mangomintRes.json();
        const status = mangomintRes.ok ? 'success' : 'error';
        (results.platforms as Record<string, unknown>).mangomint = {
          status,
          ...mangomintData,
        };

        syncMeta.mangomint = { lastSync: now, lastError: null, lastStatus: status as 'success' | 'error' };

        if (mangomintRes.ok) {
          const created = (mangomintData.newClientsAdded as number) || 0;
          const skipped = (mangomintData.alreadyExisted as number) || 0;
          logSyncEvent('mangomint', created, skipped);
          await writeSyncLog('sync_log', buildSyncSummary('Mangomint', mangomintData));
        } else {
          const errMsg = mangomintData.error || 'Unknown error';
          syncMeta.mangomint.lastError = errMsg;
          logSyncEvent('mangomint', 0, 0, errMsg);
          await writeSyncLog('sync_error', `[Mangomint] sync failed: ${errMsg}`, 'warning');
        }
      } catch (err) {
        const errMsg = String(err);
        (results.platforms as Record<string, unknown>).mangomint = {
          status: 'error',
          error: errMsg,
        };
        syncMeta.mangomint = { lastSync: now, lastError: errMsg, lastStatus: 'error' };
        logSyncEvent('mangomint', 0, 0, errMsg);
        await writeSyncLog('sync_error', `[Mangomint] sync failed: ${errMsg}`, 'warning');
      }
    } else {
      (results.platforms as Record<string, unknown>).mangomint = {
        status: isMangomintWebhookConfigured() ? 'webhooks_only' : 'not_configured',
        webhooksEnabled: true,
        message: 'Webhooks add-on enabled. Add MANGOMINT_API_KEY for full sync.',
      };
    }

    // Persist sync metadata to cache (long TTL - survives between page loads)
    cache.set(SYNC_META_KEY, syncMeta, 24 * 60 * 60 * 1000); // 24h TTL

    return NextResponse.json(results);
  } catch (error) {
    console.error('Sync-all error:', error);
    return NextResponse.json(
      { error: 'Failed to sync platforms', details: String(error) },
      { status: 500 }
    );
  }
}

// GET - check integration status across all platforms (with sync health metadata)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load sync metadata from cache
    const syncMeta: SyncMeta = cache.get<SyncMeta>(SYNC_META_KEY) || {};

    // Helper: compute health status from sync metadata
    function getHealth(platform: string): 'green' | 'yellow' | 'red' | 'unknown' {
      const meta = syncMeta[platform];
      if (!meta?.lastSync) return 'unknown';
      if (meta.lastStatus === 'error') return 'red';
      const ageMs = Date.now() - new Date(meta.lastSync).getTime();
      const ONE_HOUR = 60 * 60 * 1000;
      if (ageMs < ONE_HOUR) return 'green';
      if (ageMs < 24 * ONE_HOUR) return 'yellow';
      return 'red';
    }

    function getSyncInfo(platform: string) {
      const meta = syncMeta[platform];
      return {
        lastSync: meta?.lastSync || null,
        lastError: meta?.lastError || null,
        health: getHealth(platform),
      };
    }

    return NextResponse.json({
      integrations: {
        jotform: {
          configured: isJotformConfigured(),
          description: 'Medical consent forms (LHR, Injectables, Microneedling)',
          action: isJotformConfigured() ? 'Ready to sync' : 'Add JOTFORM_API_KEY to .env.local',
          ...getSyncInfo('jotform'),
        },
        square: {
          configured: isSquareConfigured(),
          description: 'Payment processing & transaction history',
          action: isSquareConfigured()
            ? 'Ready to sync'
            : 'Add SQUARE_ACCESS_TOKEN from developer.squareup.com',
          ...getSyncInfo('square'),
        },
        plaid: {
          configured: !!process.env.PLAID_CLIENT_ID,
          environment: process.env.PLAID_ENV || 'not set',
          description: 'Bank account connection (BECU)',
          action:
            process.env.PLAID_ENV === 'sandbox'
              ? 'Complete Plaid production questionnaires at dashboard.plaid.com'
              : 'Connect bank account via dashboard',
          ...getSyncInfo('plaid'),
        },
        mangomint: {
          configured: isMangomintConfigured(),
          webhooksEnabled: true,
          description: 'Booking & scheduling (2,181 clients) - Webhooks enabled',
          action: isMangomintConfigured()
            ? 'Ready to sync'
            : 'Webhooks add-on active. Add MANGOMINT_API_KEY to .env.local for full API sync.',
          ...getSyncInfo('mangomint'),
        },
        cherry: {
          configured: false,
          description: 'Patient financing applications',
          action: 'No API available - data extracted manually via dashboard scraping',
          lastSync: null,
          lastError: null,
          health: 'unknown' as const,
        },
        // AI Service integrations
        vapi: {
          configured: !!process.env.VAPI_API_KEY,
          description: 'AI phone receptionist - inbound call handling',
          action: process.env.VAPI_API_KEY
            ? 'Ready'
            : 'Add VAPI_API_KEY to .env.local',
          lastSync: null,
          lastError: null,
          health: (process.env.VAPI_API_KEY ? 'green' : 'unknown') as 'green' | 'unknown',
        },
        pinecone: {
          configured: !!process.env.PINECONE_API_KEY,
          description: 'Vector database for RAG knowledge base',
          action: process.env.PINECONE_API_KEY
            ? 'Ready'
            : 'Add PINECONE_API_KEY to .env.local',
          lastSync: null,
          lastError: null,
          health: (process.env.PINECONE_API_KEY ? 'green' : 'unknown') as 'green' | 'unknown',
        },
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
          description: 'Embeddings for semantic search (text-embedding-3-small)',
          action: process.env.OPENAI_API_KEY
            ? 'Ready'
            : 'Add OPENAI_API_KEY to .env.local',
          lastSync: null,
          lastError: null,
          health: (process.env.OPENAI_API_KEY ? 'green' : 'unknown') as 'green' | 'unknown',
        },
      },
    });
  } catch (error) {
    console.error('Integration status error:', error);
    return NextResponse.json(
      { error: 'Failed to get integration status' },
      { status: 500 }
    );
  }
}
