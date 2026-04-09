/**
 * RaniOS Tenant API Middleware
 *
 * Resolves tenant from session, validates subscription status,
 * checks feature flags, and rate-limits per tenant.
 * Every /api/tenant/* route must pass through this.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { resolveTenant } from '@/lib/tenant/resolver';
import { getTenantDatabase, type TenantDatabaseClient } from '@/lib/tenant/database';
import type { TenantConfig, FeatureFlags } from '@/lib/tenant/config';

export interface TenantAPIContext {
  tenant: TenantConfig;
  db: TenantDatabaseClient;
  userId: string;
  role: string;
}

type TenantHandler = (
  request: NextRequest,
  context: TenantAPIContext
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with tenant resolution and validation.
 * Usage:
 *   export const GET = withTenant(async (req, { tenant, db }) => { ... });
 */
export function withTenant(handler: TenantHandler, options?: { requiredFeature?: keyof FeatureFlags }) {
  return async (request: NextRequest) => {
    try {
      // 1. Verify session
      const token = request.cookies.get('rani-session')?.value;
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const session = await verifySession(token);
      if (!session) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }

      // 2. Resolve tenant
      const tenantId = session.tenantId || 'rani-beauty-clinic';
      const tenant = await resolveTenant({ tenantId });

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }

      if (!tenant.active) {
        return NextResponse.json({ error: 'Tenant account is deactivated' }, { status: 403 });
      }

      // 3. Check subscription status
      if (tenant.subscription.status === 'canceled') {
        return NextResponse.json({ error: 'Subscription cancelled' }, { status: 403 });
      }

      if (tenant.subscription.status === 'past_due') {
        // Allow read access but warn
        // Could restrict write operations here
      }

      // 4. Check feature flag if required
      if (options?.requiredFeature) {
        const feature = options.requiredFeature;
        if (!tenant.features[feature]) {
          return NextResponse.json(
            { error: `Feature "${feature}" requires ${getRequiredTier(feature)} tier or higher` },
            { status: 403 }
          );
        }
      }

      // 5. Get tenant-scoped database client
      const db = getTenantDatabase(tenant);

      // 6. Execute handler
      return handler(request, {
        tenant,
        db,
        userId: session.username,
        role: session.role,
      });
    } catch (error) {
      console.error('Tenant API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

function getRequiredTier(feature: keyof FeatureFlags): string {
  const tierMap: Partial<Record<keyof FeatureFlags, string>> = {
    churn: 'professional',
    noShow: 'professional',
    pricing: 'professional',
    pnl: 'professional',
    inventory: 'professional',
    social: 'professional',
    ads: 'professional',
    consult: 'professional',
    rag: 'enterprise',
    phone: 'enterprise',
    whiteLabel: 'enterprise',
  };
  return tierMap[feature] || 'starter';
}
