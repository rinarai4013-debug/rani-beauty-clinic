/**
 * RaniOS SDK - API Key Management API Route
 *
 * Endpoints:
 *   GET  /api/sdk/keys - List all API keys for the authenticated tenant
 *   POST /api/sdk/keys - Create a new API key
 *   DELETE /api/sdk/keys?id=key_xxx - Revoke an API key
 *
 * Protected by dashboard session authentication (CEO role required for key management).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  generateAPIKey,
  validateAPIKey,
  hashAPIKey,
  redactKey,
  ALL_SCOPES,
  SCOPE_PRESETS,
  type APIKeyRecord,
  type APIKeyScope,
  type APIKeyEnvironment,
  type CreateAPIKeyParams,
} from '@/lib/sdk/auth';
import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

// ─── In-Memory Key Store (swap with Airtable/DB in production) ──────────────

const keyStore = new Map<string, APIKeyRecord>();

function getKeysForTenant(tenantId: string): APIKeyRecord[] {
  return Array.from(keyStore.values()).filter((k) => k.tenantId === tenantId);
}

function getKeyById(id: string): APIKeyRecord | undefined {
  return keyStore.get(id);
}

function storeKey(record: APIKeyRecord): void {
  keyStore.set(record.id, record);
}

function revokeKey(id: string): boolean {
  const record = keyStore.get(id);
  if (!record) return false;
  record.revokedAt = new Date().toISOString();
  keyStore.set(id, record);
  return true;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json(
    { error: message, code: code ?? 'error', status },
    { status },
  );
}

async function requireCEOSession() {
  const session = await getSession();
  if (!session) {
    return { error: errorResponse('Authentication required', 401, 'authentication_error') };
  }
  if (session.role !== 'ceo') {
    return {
      error: errorResponse(
        'API key management requires CEO role',
        403,
        'authorization_error',
      ),
    };
  }
  return { session };
}

// ─── GET: List API Keys ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Rate limit
  const ip = getClientIP(request);
  const rl = rateLimit('sdk-keys-list', ip, RATE_LIMITS.VIEW);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  // Auth
  const auth = await requireCEOSession();
  if (auth.error) return auth.error;

  // Get tenant ID from header or default
  const tenantId = request.headers.get('x-tenant-id') ?? 'rani-beauty-clinic';
  const keys = getKeysForTenant(tenantId);

  // Return keys without sensitive data
  const safeKeys = keys.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    environment: k.environment,
    scopes: k.scopes,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
    expiresAt: k.expiresAt,
    revokedAt: k.revokedAt,
    createdBy: k.createdBy,
    requestCount: k.requestCount,
    metadata: k.metadata,
    status: k.revokedAt
      ? 'revoked'
      : k.expiresAt && new Date(k.expiresAt) < new Date()
        ? 'expired'
        : 'active',
  }));

  return jsonResponse({
    data: safeKeys,
    meta: {
      total: safeKeys.length,
      active: safeKeys.filter((k) => k.status === 'active').length,
    },
  });
}

// ─── POST: Create API Key ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Rate limit (strict - key creation)
  const ip = getClientIP(request);
  const rl = rateLimit('sdk-keys-create', ip, RATE_LIMITS.FORM);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  // Auth
  const auth = await requireCEOSession();
  if (auth.error) return auth.error;

  // Parse body
  let body: {
    name?: string;
    environment?: string;
    scopes?: string[];
    preset?: string;
    expiresIn?: number;
    metadata?: Record<string, string>;
  };

  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400, 'validation_error');
  }

  // Validate required fields
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return errorResponse('name is required', 400, 'validation_error');
  }

  if (body.name.length > 100) {
    return errorResponse('name must be 100 characters or less', 400, 'validation_error');
  }

  // Environment
  const environment = (body.environment ?? 'live') as APIKeyEnvironment;
  if (!['live', 'test'].includes(environment)) {
    return errorResponse('environment must be "live" or "test"', 400, 'validation_error');
  }

  // Scopes - from preset or explicit list
  let scopes: APIKeyScope[];
  if (body.preset) {
    const preset = SCOPE_PRESETS[body.preset as keyof typeof SCOPE_PRESETS];
    if (!preset) {
      return errorResponse(
        `Invalid preset. Valid presets: ${Object.keys(SCOPE_PRESETS).join(', ')}`,
        400,
        'validation_error',
      );
    }
    scopes = [...preset];
  } else if (body.scopes && Array.isArray(body.scopes)) {
    const invalid = body.scopes.filter((s) => !ALL_SCOPES.includes(s as APIKeyScope));
    if (invalid.length > 0) {
      return errorResponse(
        `Invalid scopes: ${invalid.join(', ')}. Valid scopes: ${ALL_SCOPES.join(', ')}`,
        400,
        'validation_error',
      );
    }
    scopes = body.scopes as APIKeyScope[];
  } else {
    return errorResponse(
      'Either scopes array or preset name is required',
      400,
      'validation_error',
    );
  }

  // Tenant
  const tenantId = request.headers.get('x-tenant-id') ?? 'rani-beauty-clinic';

  // Limit total keys per tenant
  const existingKeys = getKeysForTenant(tenantId).filter((k) => !k.revokedAt);
  if (existingKeys.length >= 25) {
    return errorResponse(
      'Maximum of 25 active API keys per tenant. Revoke unused keys first.',
      400,
      'validation_error',
    );
  }

  // Generate
  const params: CreateAPIKeyParams = {
    name: body.name.trim(),
    tenantId,
    environment,
    scopes,
    expiresIn: body.expiresIn,
    createdBy: auth.session!.username,
    metadata: body.metadata,
  };

  const { key, record } = generateAPIKey(params);
  storeKey(record);

  // Return full key (only time it's visible)
  return jsonResponse(
    {
      data: {
        key, // Full key - shown once only
        id: record.id,
        name: record.name,
        keyPrefix: record.keyPrefix,
        environment: record.environment,
        scopes: record.scopes,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
      },
      message: 'API key created. Save this key securely - it will not be shown again.',
    },
    201,
  );
}

// ─── DELETE: Revoke API Key ─────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  // Rate limit
  const ip = getClientIP(request);
  const rl = rateLimit('sdk-keys-revoke', ip, RATE_LIMITS.FORM);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  // Auth
  const auth = await requireCEOSession();
  if (auth.error) return auth.error;

  // Get key ID from query
  const keyId = request.nextUrl.searchParams.get('id');
  if (!keyId) {
    return errorResponse('id query parameter is required', 400, 'validation_error');
  }

  // Check key exists and belongs to tenant
  const tenantId = request.headers.get('x-tenant-id') ?? 'rani-beauty-clinic';
  const record = getKeyById(keyId);

  if (!record) {
    return errorResponse('API key not found', 404, 'not_found');
  }

  if (record.tenantId !== tenantId) {
    return errorResponse('API key not found', 404, 'not_found');
  }

  if (record.revokedAt) {
    return errorResponse('API key is already revoked', 400, 'conflict');
  }

  // Revoke
  const revoked = revokeKey(keyId);
  if (!revoked) {
    return errorResponse('Failed to revoke key', 500, 'internal_error');
  }

  return jsonResponse({
    data: {
      id: keyId,
      revokedAt: new Date().toISOString(),
      revokedBy: auth.session!.username,
    },
    message: 'API key revoked successfully.',
  });
}
