import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { isConfigured as isJotformConfigured } from '@/lib/jotform/client';
import { isConfigured as isSquareConfigured } from '@/lib/square/client';
import { isConfigured as isMangomintConfigured, isWebhookConfigured as isMangomintWebhookConfigured } from '@/lib/mangomint/client';

// POST — trigger sync across all configured platforms
// Can also be called by cron/webhook for automatic syncing
export async function POST(request: NextRequest) {
  try {
    // Support both session auth and API key auth (for cron jobs)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader === `Bearer ${cronSecret}` && cronSecret) {
      // Authorized via cron secret — skip session check
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
        (results.platforms as Record<string, unknown>).jotform = {
          status: jotformRes.ok ? 'success' : 'error',
          ...jotformData,
        };
      } catch (err) {
        (results.platforms as Record<string, unknown>).jotform = {
          status: 'error',
          error: String(err),
        };
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
        (results.platforms as Record<string, unknown>).square = {
          status: squareRes.ok ? 'success' : 'error',
          ...squareData,
        };
      } catch (err) {
        (results.platforms as Record<string, unknown>).square = {
          status: 'error',
          error: String(err),
        };
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
      } else {
        (results.platforms as Record<string, unknown>).plaid = {
          status: 'not_connected',
          message: 'Connect bank account via Plaid Link in dashboard',
        };
      }
    } catch {
      (results.platforms as Record<string, unknown>).plaid = {
        status: 'not_connected',
      };
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
        (results.platforms as Record<string, unknown>).mangomint = {
          status: mangomintRes.ok ? 'success' : 'error',
          ...mangomintData,
        };
      } catch (err) {
        (results.platforms as Record<string, unknown>).mangomint = {
          status: 'error',
          error: String(err),
        };
      }
    } else {
      (results.platforms as Record<string, unknown>).mangomint = {
        status: isMangomintWebhookConfigured() ? 'webhooks_only' : 'not_configured',
        webhooksEnabled: true,
        message: 'Webhooks add-on enabled. Add MANGOMINT_API_KEY for full sync.',
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Sync-all error:', error);
    return NextResponse.json(
      { error: 'Failed to sync platforms', details: String(error) },
      { status: 500 }
    );
  }
}

// GET — check integration status across all platforms
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      integrations: {
        jotform: {
          configured: isJotformConfigured(),
          description: 'Medical consent forms (LHR, Injectables, Microneedling)',
          action: isJotformConfigured() ? 'Ready to sync' : 'Add JOTFORM_API_KEY to .env.local',
        },
        square: {
          configured: isSquareConfigured(),
          description: 'Payment processing & transaction history',
          action: isSquareConfigured()
            ? 'Ready to sync'
            : 'Add SQUARE_ACCESS_TOKEN from developer.squareup.com',
        },
        plaid: {
          configured: !!process.env.PLAID_CLIENT_ID,
          environment: process.env.PLAID_ENV || 'not set',
          description: 'Bank account connection (BECU)',
          action:
            process.env.PLAID_ENV === 'sandbox'
              ? 'Complete Plaid production questionnaires at dashboard.plaid.com'
              : 'Connect bank account via dashboard',
        },
        mangomint: {
          configured: isMangomintConfigured(),
          webhooksEnabled: true,
          description: 'Booking & scheduling (2,181 clients) — Webhooks enabled',
          action: isMangomintConfigured()
            ? 'Ready to sync'
            : 'Webhooks add-on active. Add MANGOMINT_API_KEY to .env.local for full API sync.',
        },
        cherry: {
          configured: false,
          description: 'Patient financing applications',
          action: 'No API available — data extracted manually via dashboard scraping',
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
