/**
 * RaniOS Tenant Management API
 *
 * CRUD operations for tenant configuration.
 * Protected by admin authentication.
 *
 * GET    /api/tenant              - List all tenants (admin)
 * GET    /api/tenant?id=xxx       - Get single tenant
 * POST   /api/tenant              - Create new tenant
 * PATCH  /api/tenant              - Update tenant config
 * DELETE /api/tenant              - Soft-delete tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantStore } from '@/lib/tenant/resolver';
import { isValidSlug, TIER_FEATURES, type SubscriptionTier } from '@/lib/tenant/config';
import { getSession } from '@/lib/auth/session';
import { createNewTenant } from '@/lib/tenant/onboarding';
import { z } from 'zod';

// ─── Auth Guard ─────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<{ error?: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  // Only CEO role can manage tenants (or a future 'platform_admin' role)
  if (session.role !== 'ceo') {
    return { error: NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 }) };
  }
  return {};
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const store = getTenantStore();
  const id = request.nextUrl.searchParams.get('id');

  if (id) {
    const tenant = await store.getById(id);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    // Strip sensitive data
    const safe = sanitizeTenantForResponse(tenant);
    return NextResponse.json(safe);
  }

  // List all tenants
  const active = request.nextUrl.searchParams.get('active');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
  const tenants = await store.list({
    active: active !== null ? active === 'true' : undefined,
    limit,
  });

  return NextResponse.json({
    tenants: tenants.map(sanitizeTenantForResponse),
    total: tenants.length,
  });
}

// ─── POST ───────────────────────────────────────────────────────────────────

const createTenantSchema = z.object({
  ownerEmail: z.string().email(),
  ownerName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createTenantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const tenant = await createNewTenant(parsed.data);

    return NextResponse.json(
      { tenant: sanitizeTenantForResponse(tenant) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API:Tenant] Create failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── PATCH ──────────────────────────────────────────────────────────────────

const updateTenantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  slug: z.string().min(3).optional(),
  customDomain: z.string().optional(),
  tier: z.enum(['starter', 'professional', 'enterprise']).optional(),
  branding: z
    .object({
      clinicName: z.string().optional(),
      logoUrl: z.string().optional(),
      colors: z
        .object({
          primary: z.string().optional(),
          secondary: z.string().optional(),
          accent: z.string().optional(),
          background: z.string().optional(),
          text: z.string().optional(),
          muted: z.string().optional(),
        })
        .optional(),
      fonts: z
        .object({
          heading: z.string().optional(),
          body: z.string().optional(),
        })
        .optional(),
      tagline: z.string().optional(),
    })
    .optional(),
  active: z.boolean().optional(),
  timezone: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = updateTenantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { id, tier, ...rest } = parsed.data;
    const store = getTenantStore();
    const existing = await store.getById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Validate slug uniqueness if changing
    if (rest.slug && rest.slug !== existing.slug) {
      if (!isValidSlug(rest.slug)) {
        return NextResponse.json({ error: 'Invalid or reserved slug' }, { status: 400 });
      }
      const bySlug = await store.getBySlug(rest.slug);
      if (bySlug && bySlug.id !== id) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
      }
    }

    // Build update payload
    const update: Record<string, unknown> = { ...rest };

    // Merge branding (don't overwrite entire object)
    if (rest.branding) {
      update.branding = {
        ...existing.branding,
        ...rest.branding,
        colors: { ...existing.branding.colors, ...rest.branding.colors },
        fonts: { ...existing.branding.fonts, ...rest.branding.fonts },
      };
    }

    // Handle tier change
    if (tier && tier !== existing.subscription.tier) {
      update.subscription = {
        ...existing.subscription,
        tier,
      };
      update.features = TIER_FEATURES[tier as SubscriptionTier];
    }

    const updated = await store.update(id, update as Partial<typeof existing>);

    return NextResponse.json({ tenant: sanitizeTenantForResponse(updated) });
  } catch (err) {
    console.error('[API:Tenant] Update failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
  }

  const store = getTenantStore();
  const existing = await store.getById(id);

  if (!existing) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Soft delete - set active to false
  await store.update(id, { active: false });

  return NextResponse.json({ success: true, message: `Tenant ${id} deactivated` });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sanitizeTenantForResponse(tenant: Record<string, unknown> | { id: string; name: string; slug: string; airtable: { baseId: string; pat: string }; [key: string]: unknown }) {
  // Remove sensitive fields from API responses
  const safe = { ...tenant } as Record<string, unknown>;

  // Mask Airtable PAT
  if (safe.airtable && typeof safe.airtable === 'object') {
    const at = { ...(safe.airtable as Record<string, unknown>) };
    if (typeof at.pat === 'string' && at.pat.length > 8) {
      at.pat = `${(at.pat as string).slice(0, 6)}...${'*'.repeat(8)}`;
    }
    safe.airtable = at;
  }

  // Mask integration secrets
  if (safe.integrations && typeof safe.integrations === 'object') {
    safe.integrations = '[configured]';
  }

  return safe;
}
