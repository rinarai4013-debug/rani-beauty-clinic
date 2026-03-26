// ═══════════════════════════════════════════════════════════════
// QuickBooks Online — OAuth 2.0 API Route
// Handles: authorization redirect, callback, disconnect, status
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  revokeTokens,
  getStoredTokens,
  getQBOConfig,
} from '@/lib/integrations/quickbooks/client';

/**
 * GET /api/integrations/quickbooks/auth
 *
 * Query params:
 *   action=connect    → Redirect to Intuit OAuth
 *   action=callback   → Handle OAuth callback (code, realmId, state)
 *   action=disconnect → Revoke tokens
 *   action=status     → Check connection status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'connect': {
        // Generate a random state param for CSRF protection
        const state = crypto.randomUUID();

        // Store state in a cookie for verification on callback
        const authUrl = getAuthorizationUrl(state);

        const response = NextResponse.redirect(authUrl);
        response.cookies.set('qbo_oauth_state', state, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 600, // 10 minutes
          path: '/',
        });

        return response;
      }

      case 'callback': {
        const code = searchParams.get('code');
        const realmId = searchParams.get('realmId');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Handle user denial
        if (error) {
          return NextResponse.redirect(
            new URL('/dashboard/finance/quickbooks?error=access_denied', request.url),
          );
        }

        if (!code || !realmId) {
          return NextResponse.redirect(
            new URL('/dashboard/finance/quickbooks?error=missing_params', request.url),
          );
        }

        // Verify state parameter (CSRF protection)
        const storedState = request.cookies.get('qbo_oauth_state')?.value;
        if (!storedState || storedState !== state) {
          return NextResponse.redirect(
            new URL('/dashboard/finance/quickbooks?error=invalid_state', request.url),
          );
        }

        // Exchange code for tokens
        await exchangeCodeForTokens(code, realmId);

        // Redirect to dashboard with success
        const response = NextResponse.redirect(
          new URL('/dashboard/finance/quickbooks?connected=true', request.url),
        );

        // Clear the state cookie
        response.cookies.delete('qbo_oauth_state');

        return response;
      }

      case 'disconnect': {
        await revokeTokens();
        return NextResponse.json({ success: true, message: 'Disconnected from QuickBooks' });
      }

      case 'status': {
        const tokens = getStoredTokens();
        const config = getQBOConfig();

        return NextResponse.json({
          connected: !!tokens,
          realmId: tokens?.realmId || null,
          environment: config.environment,
          accessTokenExpiresAt: tokens?.accessTokenExpiresAt
            ? new Date(tokens.accessTokenExpiresAt).toISOString()
            : null,
          refreshTokenExpiresAt: tokens?.refreshTokenExpiresAt
            ? new Date(tokens.refreshTokenExpiresAt).toISOString()
            : null,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: connect, callback, disconnect, or status' },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('[QBO Auth Error]', error);
    return NextResponse.json(
      {
        error: 'Authentication error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
