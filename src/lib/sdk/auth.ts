/**
 * RaniOS SDK - API Key Generation, Validation & Scoping
 *
 * API keys follow the format: rani_{env}_{32-char-hex}
 * Where env is 'live' or 'test'.
 *
 * Each key is scoped with permissions defining which resources
 * and actions the key holder can perform.
 */

import { randomBytes, createHmac } from 'crypto';

// ─── Types ──────────────────────────────────────────────────────────────────

export type APIKeyEnvironment = 'live' | 'test';

export type APIKeyScope =
  | 'clients:read'
  | 'clients:write'
  | 'appointments:read'
  | 'appointments:write'
  | 'revenue:read'
  | 'schedule:read'
  | 'schedule:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'loyalty:read'
  | 'loyalty:write'
  | 'referrals:read'
  | 'referrals:write'
  | 'ai:read'
  | 'ai:write'
  | 'templates:read'
  | 'webhooks:manage';

export const ALL_SCOPES: APIKeyScope[] = [
  'clients:read',
  'clients:write',
  'appointments:read',
  'appointments:write',
  'revenue:read',
  'schedule:read',
  'schedule:write',
  'inventory:read',
  'inventory:write',
  'loyalty:read',
  'loyalty:write',
  'referrals:read',
  'referrals:write',
  'ai:read',
  'ai:write',
  'templates:read',
  'webhooks:manage',
];

export const READ_ONLY_SCOPES: APIKeyScope[] = ALL_SCOPES.filter((s) => s.endsWith(':read'));

export const SCOPE_DESCRIPTIONS: Record<APIKeyScope, string> = {
  'clients:read': 'View client profiles, churn risk, and recommendations',
  'clients:write': 'Create and update client records',
  'appointments:read': 'View appointments, no-show risk scores',
  'appointments:write': 'Create and modify appointments',
  'revenue:read': 'View revenue KPIs, trends, and anomalies',
  'schedule:read': 'View daily schedule and optimization data',
  'schedule:write': 'Trigger schedule optimization',
  'inventory:read': 'View inventory alerts and waste analysis',
  'inventory:write': 'Update inventory levels and reorder status',
  'loyalty:read': 'View loyalty member details and point balances',
  'loyalty:write': 'Award points and redeem rewards',
  'referrals:read': 'View referral statistics',
  'referrals:write': 'Generate referral codes and links',
  'ai:read': 'View AI-generated insights',
  'ai:write': 'Trigger AI chat, recommendations, and intake analysis',
  'templates:read': 'View and render communication templates',
  'webhooks:manage': 'Create, update, and delete webhook subscriptions',
};

export interface APIKeyRecord {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string;        // First 12 chars for display (rani_live_ab...)
  keyHash: string;          // SHA-256 hash of full key for validation
  environment: APIKeyEnvironment;
  scopes: APIKeyScope[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdBy: string;
  requestCount: number;
  metadata?: Record<string, string>;
}

export interface CreateAPIKeyParams {
  name: string;
  tenantId: string;
  environment: APIKeyEnvironment;
  scopes: APIKeyScope[];
  expiresIn?: number;       // Seconds from now, undefined = no expiry
  createdBy: string;
  metadata?: Record<string, string>;
}

export interface CreateAPIKeyResult {
  /** Full API key - only shown once, never stored */
  key: string;
  /** The stored record (without the full key) */
  record: APIKeyRecord;
}

export interface ValidateKeyResult {
  valid: boolean;
  record?: APIKeyRecord;
  reason?: string;
}

// ─── Key Generation ─────────────────────────────────────────────────────────

/**
 * Generate a new API key with the format: rani_{env}_{32-hex-chars}
 *
 * The full key is returned once and should be shown to the user.
 * Only the hash is stored for validation.
 */
export function generateAPIKey(params: CreateAPIKeyParams): CreateAPIKeyResult {
  const { name, tenantId, environment, scopes, expiresIn, createdBy, metadata } = params;

  // Validate scopes
  const invalidScopes = scopes.filter((s) => !ALL_SCOPES.includes(s));
  if (invalidScopes.length > 0) {
    throw new Error(`Invalid scopes: ${invalidScopes.join(', ')}`);
  }

  // Generate key
  const randomPart = randomBytes(16).toString('hex'); // 32 hex chars
  const key = `rani_${environment}_${randomPart}`;
  const keyPrefix = key.slice(0, 16);
  const keyHash = hashAPIKey(key);

  const now = new Date().toISOString();
  const record: APIKeyRecord = {
    id: `key_${randomBytes(12).toString('hex')}`,
    tenantId,
    name,
    keyPrefix,
    keyHash,
    environment,
    scopes,
    createdAt: now,
    lastUsedAt: null,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    revokedAt: null,
    createdBy,
    requestCount: 0,
    metadata,
  };

  return { key, record };
}

/**
 * Hash an API key for secure storage using HMAC-SHA256.
 * We use a static salt since the keys already have high entropy.
 */
export function hashAPIKey(key: string): string {
  return createHmac('sha256', 'ranios-api-key-salt')
    .update(key)
    .digest('hex');
}

/**
 * Validate an API key against stored records.
 * Returns the matching record if valid.
 */
export function validateAPIKey(
  key: string,
  storedKeys: APIKeyRecord[],
): ValidateKeyResult {
  // Check format
  if (!isValidKeyFormat(key)) {
    return { valid: false, reason: 'Invalid key format. Expected rani_{live|test}_{hex}.' };
  }

  // Hash and find match
  const hash = hashAPIKey(key);
  const record = storedKeys.find((r) => r.keyHash === hash);

  if (!record) {
    return { valid: false, reason: 'API key not found.' };
  }

  // Check revocation
  if (record.revokedAt) {
    return { valid: false, reason: 'API key has been revoked.', record };
  }

  // Check expiration
  if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
    return { valid: false, reason: 'API key has expired.', record };
  }

  return { valid: true, record };
}

/**
 * Check if a key has the required scope for an operation.
 */
export function hasScope(record: APIKeyRecord, requiredScope: APIKeyScope): boolean {
  return record.scopes.includes(requiredScope);
}

/**
 * Check if a key has ALL of the required scopes.
 */
export function hasAllScopes(record: APIKeyRecord, requiredScopes: APIKeyScope[]): boolean {
  return requiredScopes.every((scope) => record.scopes.includes(scope));
}

/**
 * Check if a key has ANY of the required scopes.
 */
export function hasAnyScope(record: APIKeyRecord, requiredScopes: APIKeyScope[]): boolean {
  return requiredScopes.some((scope) => record.scopes.includes(scope));
}

/**
 * Parse the environment from an API key string.
 */
export function parseKeyEnvironment(key: string): APIKeyEnvironment | null {
  const match = key.match(/^rani_(live|test)_/);
  return match ? (match[1] as APIKeyEnvironment) : null;
}

/**
 * Validate the format of an API key string.
 */
export function isValidKeyFormat(key: string): boolean {
  return /^rani_(live|test)_[a-f0-9]{32}$/.test(key);
}

/**
 * Redact an API key for logging/display. Shows prefix and last 4 chars.
 */
export function redactKey(key: string): string {
  if (key.length < 20) return '***';
  return `${key.slice(0, 12)}...${key.slice(-4)}`;
}

/**
 * Preset scope bundles for common use cases.
 */
export const SCOPE_PRESETS = {
  /** Read-only access to all resources */
  readonly: READ_ONLY_SCOPES,

  /** Full access to all resources */
  full: ALL_SCOPES,

  /** Dashboard integration - read KPIs and client data */
  dashboard: [
    'clients:read',
    'appointments:read',
    'revenue:read',
    'schedule:read',
    'inventory:read',
  ] as APIKeyScope[],

  /** CRM integration - manage clients and appointments */
  crm: [
    'clients:read',
    'clients:write',
    'appointments:read',
    'appointments:write',
    'loyalty:read',
    'loyalty:write',
  ] as APIKeyScope[],

  /** AI features only */
  ai: [
    'ai:read',
    'ai:write',
    'clients:read',
    'templates:read',
  ] as APIKeyScope[],

  /** Webhook management */
  webhooks: [
    'webhooks:manage',
  ] as APIKeyScope[],
} as const;
