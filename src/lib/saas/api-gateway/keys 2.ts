/**
 * RaniOS API Key Management
 *
 * Key generation, rotation, scoped permissions, usage tracking,
 * revocation, rate limiting per key, IP allowlisting, webhook signing.
 */

import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────

export type KeyEnvironment = 'live' | 'test';

export type KeyStatus = 'active' | 'rotating' | 'revoked' | 'expired';

export type ApiScope =
  | 'clients:read'
  | 'clients:write'
  | 'appointments:read'
  | 'appointments:write'
  | 'analytics:read'
  | 'analytics:write'
  | 'ai:use'
  | 'templates:read'
  | 'templates:write'
  | 'webhooks:read'
  | 'webhooks:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'reviews:read'
  | 'reviews:write'
  | 'schedule:read'
  | 'schedule:write'
  | 'billing:read';

export const ALL_SCOPES: ApiScope[] = [
  'clients:read', 'clients:write',
  'appointments:read', 'appointments:write',
  'analytics:read', 'analytics:write',
  'ai:use',
  'templates:read', 'templates:write',
  'webhooks:read', 'webhooks:write',
  'inventory:read', 'inventory:write',
  'reviews:read', 'reviews:write',
  'schedule:read', 'schedule:write',
  'billing:read',
];

export const SCOPE_DESCRIPTIONS: Record<ApiScope, string> = {
  'clients:read': 'View client profiles, history, and segments',
  'clients:write': 'Create and update client records',
  'appointments:read': 'View appointments and schedule',
  'appointments:write': 'Create, update, and cancel appointments',
  'analytics:read': 'View KPIs, revenue, and performance data',
  'analytics:write': 'Create custom reports and snapshots',
  'ai:use': 'Access AI engines (recommendations, chat, intake)',
  'templates:read': 'View email and SMS templates',
  'templates:write': 'Create and modify templates',
  'webhooks:read': 'View webhook configurations',
  'webhooks:write': 'Create and manage webhooks',
  'inventory:read': 'View inventory levels and alerts',
  'inventory:write': 'Update inventory and reorder',
  'reviews:read': 'View reviews and ratings',
  'reviews:write': 'Respond to reviews',
  'schedule:read': 'View provider schedules and availability',
  'schedule:write': 'Modify schedules and block times',
  'billing:read': 'View billing and subscription details',
};

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  prefix: string; // First 12 chars shown to user
  keyHash: string; // SHA-256 of full key
  environment: KeyEnvironment;
  status: KeyStatus;
  scopes: ApiScope[];
  rateLimit: number | null; // requests per minute, null = use tier default
  ipAllowlist: string[]; // empty = all IPs allowed
  expiresAt: number | null;
  lastUsedAt: number | null;
  usageCount: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  revokedAt: number | null;
  revokedBy: string | null;
  revokedReason: string | null;
  rotatingFrom: string | null; // ID of key being rotated from
  gracePeriodEnds: number | null; // For rotation - old key still works until this time
  metadata: Record<string, unknown>;
}

export interface WebhookSigningKey {
  id: string;
  tenantId: string;
  secret: string;
  algorithm: 'hmac-sha256';
  createdAt: number;
  rotatedAt: number | null;
  previousSecret: string | null;
}

export interface KeyUsageLog {
  keyId: string;
  tenantId: string;
  path: string;
  method: string;
  ip: string;
  userAgent: string;
  status: number;
  timestamp: number;
}

export interface KeyAuditEntry {
  id: string;
  keyId: string;
  tenantId: string;
  action: 'created' | 'rotated' | 'revoked' | 'scopes_changed' | 'ip_updated' | 'rate_limit_changed';
  performedBy: string;
  details: Record<string, unknown>;
  timestamp: number;
}

export interface CreateKeyInput {
  tenantId: string;
  name: string;
  environment: KeyEnvironment;
  scopes: ApiScope[];
  rateLimit?: number | null;
  ipAllowlist?: string[];
  expiresAt?: number | null;
  createdBy: string;
}

export interface KeyValidationResult {
  valid: boolean;
  key: ApiKey | null;
  error: string | null;
  scopes: ApiScope[];
}

// ─── Schemas ──────────────────────────────────────────────────────

export const CreateKeySchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1).max(100),
  environment: z.enum(['live', 'test']),
  scopes: z.array(z.enum([
    'clients:read', 'clients:write',
    'appointments:read', 'appointments:write',
    'analytics:read', 'analytics:write',
    'ai:use',
    'templates:read', 'templates:write',
    'webhooks:read', 'webhooks:write',
    'inventory:read', 'inventory:write',
    'reviews:read', 'reviews:write',
    'schedule:read', 'schedule:write',
    'billing:read',
  ])).min(1, 'At least one scope required'),
  rateLimit: z.number().int().min(1).max(10000).nullable().optional(),
  ipAllowlist: z.array(z.string().ip()).optional().default([]),
  expiresAt: z.number().int().nullable().optional(),
  createdBy: z.string().min(1),
});

// ─── In-Memory Stores ─────────────────────────────────────────────

const apiKeys = new Map<string, ApiKey>();
const keysByHash = new Map<string, string>(); // hash -> key ID
const webhookKeys = new Map<string, WebhookSigningKey>();
const keyUsageLogs: KeyUsageLog[] = [];
const keyAuditLog: KeyAuditEntry[] = [];

// ─── Key Generation ───────────────────────────────────────────────

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function hashKey(key: string): string {
  // Simple hash for demo - in production use crypto.subtle.digest
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return 'sha256_' + Math.abs(hash).toString(36) + '_' + key.length;
}

export function generateApiKey(input: CreateKeyInput): { key: ApiKey; plainTextKey: string } {
  const keyId = `key_${Date.now().toString(36)}_${generateRandomString(8)}`;
  const randomPart = generateRandomString(32);
  const prefix = `rani_${input.environment}_`;
  const tenantPart = input.tenantId.substring(0, 8);
  const plainTextKey = `${prefix}${tenantPart}_${randomPart}`;
  const keyHash = hashKey(plainTextKey);

  const apiKey: ApiKey = {
    id: keyId,
    tenantId: input.tenantId,
    name: input.name,
    prefix: plainTextKey.substring(0, 16) + '...',
    keyHash,
    environment: input.environment,
    status: 'active',
    scopes: input.scopes,
    rateLimit: input.rateLimit ?? null,
    ipAllowlist: input.ipAllowlist || [],
    expiresAt: input.expiresAt ?? null,
    lastUsedAt: null,
    usageCount: 0,
    createdBy: input.createdBy,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    revokedAt: null,
    revokedBy: null,
    revokedReason: null,
    rotatingFrom: null,
    gracePeriodEnds: null,
    metadata: {},
  };

  apiKeys.set(keyId, apiKey);
  keysByHash.set(keyHash, keyId);

  addAuditEntry({
    keyId,
    tenantId: input.tenantId,
    action: 'created',
    performedBy: input.createdBy,
    details: { name: input.name, environment: input.environment, scopes: input.scopes },
  });

  return { key: apiKey, plainTextKey };
}

// ─── Key Validation ───────────────────────────────────────────────

export function validateApiKey(
  plainTextKey: string,
  requiredScopes?: ApiScope[],
  requestIp?: string,
): KeyValidationResult {
  const keyHash = hashKey(plainTextKey);
  const keyId = keysByHash.get(keyHash);

  if (!keyId) {
    return { valid: false, key: null, error: 'Invalid API key', scopes: [] };
  }

  const key = apiKeys.get(keyId);
  if (!key) {
    return { valid: false, key: null, error: 'Key not found', scopes: [] };
  }

  // Check status
  if (key.status === 'revoked') {
    return { valid: false, key, error: 'API key has been revoked', scopes: [] };
  }

  if (key.status === 'expired') {
    return { valid: false, key, error: 'API key has expired', scopes: [] };
  }

  // Check expiration
  if (key.expiresAt && Date.now() > key.expiresAt) {
    key.status = 'expired';
    return { valid: false, key, error: 'API key has expired', scopes: [] };
  }

  // Check rotating grace period
  if (key.status === 'rotating' && key.gracePeriodEnds && Date.now() > key.gracePeriodEnds) {
    key.status = 'revoked';
    return { valid: false, key, error: 'Rotation grace period expired', scopes: [] };
  }

  // Check IP allowlist
  if (key.ipAllowlist.length > 0 && requestIp) {
    if (!key.ipAllowlist.includes(requestIp)) {
      return { valid: false, key, error: 'IP address not in allowlist', scopes: [] };
    }
  }

  // Check scopes
  if (requiredScopes && requiredScopes.length > 0) {
    const missingScopes = requiredScopes.filter(s => !key.scopes.includes(s));
    if (missingScopes.length > 0) {
      return {
        valid: false,
        key,
        error: `Missing required scopes: ${missingScopes.join(', ')}`,
        scopes: key.scopes,
      };
    }
  }

  // Update last used
  key.lastUsedAt = Date.now();
  key.usageCount += 1;

  return { valid: true, key, error: null, scopes: key.scopes };
}

// ─── Key Rotation ─────────────────────────────────────────────────

export function rotateKey(
  keyId: string,
  performedBy: string,
  gracePeriodMs: number = 24 * 60 * 60 * 1000, // 24 hours default
): { newKey: ApiKey; plainTextKey: string } | null {
  const oldKey = apiKeys.get(keyId);
  if (!oldKey || oldKey.status !== 'active') return null;

  // Mark old key as rotating with grace period
  oldKey.status = 'rotating';
  oldKey.gracePeriodEnds = Date.now() + gracePeriodMs;
  oldKey.updatedAt = Date.now();

  // Generate new key with same config
  const result = generateApiKey({
    tenantId: oldKey.tenantId,
    name: oldKey.name,
    environment: oldKey.environment,
    scopes: oldKey.scopes,
    rateLimit: oldKey.rateLimit,
    ipAllowlist: oldKey.ipAllowlist,
    expiresAt: oldKey.expiresAt,
    createdBy: performedBy,
  });

  result.key.rotatingFrom = keyId;

  addAuditEntry({
    keyId: result.key.id,
    tenantId: oldKey.tenantId,
    action: 'rotated',
    performedBy,
    details: { oldKeyId: keyId, gracePeriodMs },
  });

  return result;
}

// ─── Key Revocation ───────────────────────────────────────────────

export function revokeKey(
  keyId: string,
  performedBy: string,
  reason: string,
): boolean {
  const key = apiKeys.get(keyId);
  if (!key) return false;

  key.status = 'revoked';
  key.revokedAt = Date.now();
  key.revokedBy = performedBy;
  key.revokedReason = reason;
  key.updatedAt = Date.now();

  addAuditEntry({
    keyId,
    tenantId: key.tenantId,
    action: 'revoked',
    performedBy,
    details: { reason },
  });

  return true;
}

// ─── Key Management ───────────────────────────────────────────────

export function getKeysByTenant(
  tenantId: string,
  includeRevoked: boolean = false,
): ApiKey[] {
  return Array.from(apiKeys.values())
    .filter(k => k.tenantId === tenantId && (includeRevoked || k.status !== 'revoked'))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getKeyById(keyId: string): ApiKey | null {
  return apiKeys.get(keyId) || null;
}

export function updateKeyScopes(
  keyId: string,
  scopes: ApiScope[],
  performedBy: string,
): boolean {
  const key = apiKeys.get(keyId);
  if (!key || key.status === 'revoked') return false;

  const oldScopes = [...key.scopes];
  key.scopes = scopes;
  key.updatedAt = Date.now();

  addAuditEntry({
    keyId,
    tenantId: key.tenantId,
    action: 'scopes_changed',
    performedBy,
    details: { oldScopes, newScopes: scopes },
  });

  return true;
}

export function updateKeyIpAllowlist(
  keyId: string,
  ips: string[],
  performedBy: string,
): boolean {
  const key = apiKeys.get(keyId);
  if (!key || key.status === 'revoked') return false;

  const oldIps = [...key.ipAllowlist];
  key.ipAllowlist = ips;
  key.updatedAt = Date.now();

  addAuditEntry({
    keyId,
    tenantId: key.tenantId,
    action: 'ip_updated',
    performedBy,
    details: { oldIps, newIps: ips },
  });

  return true;
}

export function updateKeyRateLimit(
  keyId: string,
  rateLimit: number | null,
  performedBy: string,
): boolean {
  const key = apiKeys.get(keyId);
  if (!key || key.status === 'revoked') return false;

  const oldLimit = key.rateLimit;
  key.rateLimit = rateLimit;
  key.updatedAt = Date.now();

  addAuditEntry({
    keyId,
    tenantId: key.tenantId,
    action: 'rate_limit_changed',
    performedBy,
    details: { oldLimit, newLimit: rateLimit },
  });

  return true;
}

// ─── Key Usage Tracking ───────────────────────────────────────────

export function logKeyUsage(log: Omit<KeyUsageLog, 'timestamp'>): void {
  keyUsageLogs.push({ ...log, timestamp: Date.now() });
  if (keyUsageLogs.length > 50_000) {
    keyUsageLogs.splice(0, keyUsageLogs.length - 50_000);
  }
}

export function getKeyUsage(
  keyId: string,
  days: number = 7,
): { daily: { date: string; count: number }[]; total: number; avgPerDay: number } {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const logs = keyUsageLogs.filter(l => l.keyId === keyId && l.timestamp >= cutoff);

  const dailyMap = new Map<string, number>();
  logs.forEach(l => {
    const date = new Date(l.timestamp).toISOString().split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
  });

  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return {
    daily,
    total: logs.length,
    avgPerDay: days > 0 ? Math.round(logs.length / days) : 0,
  };
}

// ─── Webhook Signing Keys ─────────────────────────────────────────

export function generateWebhookSigningKey(tenantId: string): WebhookSigningKey {
  const key: WebhookSigningKey = {
    id: `whsec_${Date.now().toString(36)}_${generateRandomString(8)}`,
    tenantId,
    secret: `whsec_${generateRandomString(48)}`,
    algorithm: 'hmac-sha256',
    createdAt: Date.now(),
    rotatedAt: null,
    previousSecret: null,
  };

  webhookKeys.set(key.id, key);
  return key;
}

export function rotateWebhookSigningKey(keyId: string): WebhookSigningKey | null {
  const key = webhookKeys.get(keyId);
  if (!key) return null;

  key.previousSecret = key.secret;
  key.secret = `whsec_${generateRandomString(48)}`;
  key.rotatedAt = Date.now();

  return { ...key };
}

export function signWebhookPayload(
  keyId: string,
  payload: string,
  timestamp: number,
): string | null {
  const key = webhookKeys.get(keyId);
  if (!key) return null;

  // Simple HMAC simulation - in production use crypto.createHmac
  const data = `${timestamp}.${payload}`;
  const hash = simpleHmac(key.secret, data);
  return `t=${timestamp},v1=${hash}`;
}

export function verifyWebhookSignature(
  keyId: string,
  payload: string,
  signature: string,
  tolerance: number = 300, // 5 minutes
): boolean {
  const key = webhookKeys.get(keyId);
  if (!key) return false;

  const parts = signature.split(',');
  const timestampPart = parts.find(p => p.startsWith('t='));
  const sigPart = parts.find(p => p.startsWith('v1='));

  if (!timestampPart || !sigPart) return false;

  const timestamp = parseInt(timestampPart.replace('t=', ''), 10);
  const sig = sigPart.replace('v1=', '');

  // Check timestamp tolerance
  const age = Math.abs(Date.now() / 1000 - timestamp);
  if (age > tolerance) return false;

  const expectedSig = simpleHmac(key.secret, `${timestamp}.${payload}`);
  if (sig === expectedSig) return true;

  // Check previous secret during rotation
  if (key.previousSecret) {
    const prevSig = simpleHmac(key.previousSecret, `${timestamp}.${payload}`);
    if (sig === prevSig) return true;
  }

  return false;
}

function simpleHmac(secret: string, data: string): string {
  let hash = 0;
  const combined = secret + ':' + data;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

export function getWebhookKeysByTenant(tenantId: string): WebhookSigningKey[] {
  return Array.from(webhookKeys.values()).filter(k => k.tenantId === tenantId);
}

// ─── Audit Trail ──────────────────────────────────────────────────

function addAuditEntry(entry: Omit<KeyAuditEntry, 'id' | 'timestamp'>): void {
  keyAuditLog.push({
    ...entry,
    id: `audit_${Date.now().toString(36)}_${generateRandomString(6)}`,
    timestamp: Date.now(),
  });
  if (keyAuditLog.length > 10_000) {
    keyAuditLog.splice(0, keyAuditLog.length - 10_000);
  }
}

export function getKeyAuditLog(
  filter?: { keyId?: string; tenantId?: string; action?: string; limit?: number },
): KeyAuditEntry[] {
  let logs = [...keyAuditLog];
  if (filter?.keyId) logs = logs.filter(l => l.keyId === filter.keyId);
  if (filter?.tenantId) logs = logs.filter(l => l.tenantId === filter.tenantId);
  if (filter?.action) logs = logs.filter(l => l.action === filter.action);
  logs.sort((a, b) => b.timestamp - a.timestamp);
  return logs.slice(0, filter?.limit || 100);
}

// ─── Reset (for testing) ─────────────────────────────────────────

export function resetKeys(): void {
  apiKeys.clear();
  keysByHash.clear();
  webhookKeys.clear();
  keyUsageLogs.length = 0;
  keyAuditLog.length = 0;
}
