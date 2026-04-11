/**
 * API Key Management Tests — 35+ tests
 */

import {
  generateApiKey, validateApiKey, revokeKey, rotateKey,
  getKeysByTenant, getKeyById, updateKeyScopes, updateKeyIpAllowlist, updateKeyRateLimit,
  logKeyUsage, getKeyUsage,
  generateWebhookSigningKey, rotateWebhookSigningKey,
  signWebhookPayload, verifyWebhookSignature,
  getKeyAuditLog, getWebhookKeysByTenant,
  ALL_SCOPES, SCOPE_DESCRIPTIONS,
  resetKeys,
} from '../api-gateway/keys';

beforeEach(() => {
  resetKeys();
});

// ─── Key Generation ───────────────────────────────────────────────

describe('generateApiKey', () => {
  it('generates a key with correct format', () => {
    const { key, plainTextKey } = generateApiKey({
      tenantId: 't_001', name: 'Test Key', environment: 'live',
      scopes: ['clients:read'], createdBy: 'admin',
    });
    expect(key.id).toMatch(/^key_/);
    expect(plainTextKey).toMatch(/^rani_live_/);
    expect(key.status).toBe('active');
  });

  it('generates test environment key', () => {
    const { plainTextKey } = generateApiKey({
      tenantId: 't_001', name: 'Test Key', environment: 'test',
      scopes: ['clients:read'], createdBy: 'admin',
    });
    expect(plainTextKey).toMatch(/^rani_test_/);
  });

  it('stores scopes correctly', () => {
    const { key } = generateApiKey({
      tenantId: 't_001', name: 'Multi Scope', environment: 'live',
      scopes: ['clients:read', 'clients:write', 'ai:use'], createdBy: 'admin',
    });
    expect(key.scopes).toEqual(['clients:read', 'clients:write', 'ai:use']);
  });

  it('sets IP allowlist', () => {
    const { key } = generateApiKey({
      tenantId: 't_001', name: 'IP Limited', environment: 'live',
      scopes: ['clients:read'], ipAllowlist: ['1.2.3.4', '5.6.7.8'], createdBy: 'admin',
    });
    expect(key.ipAllowlist).toEqual(['1.2.3.4', '5.6.7.8']);
  });

  it('creates audit entry', () => {
    generateApiKey({ tenantId: 't_001', name: 'Audited', environment: 'live', scopes: ['clients:read'], createdBy: 'admin' });
    const audit = getKeyAuditLog({ tenantId: 't_001' });
    expect(audit.length).toBe(1);
    expect(audit[0].action).toBe('created');
  });
});

// ─── Key Validation ───────────────────────────────────────────────

describe('validateApiKey', () => {
  it('validates a valid key', () => {
    const { plainTextKey } = generateApiKey({
      tenantId: 't_001', name: 'Valid', environment: 'live',
      scopes: ['clients:read'], createdBy: 'admin',
    });
    const result = validateApiKey(plainTextKey);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('rejects invalid key', () => {
    const result = validateApiKey('rani_live_fake_invalid_key');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid API key');
  });

  it('validates required scopes', () => {
    const { plainTextKey } = generateApiKey({
      tenantId: 't_001', name: 'Limited', environment: 'live',
      scopes: ['clients:read'], createdBy: 'admin',
    });
    const result = validateApiKey(plainTextKey, ['clients:read', 'clients:write']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing required scopes');
  });

  it('rejects revoked key', () => {
    const { key, plainTextKey } = generateApiKey({
      tenantId: 't_001', name: 'Revokable', environment: 'live',
      scopes: ['clients:read'], createdBy: 'admin',
    });
    revokeKey(key.id, 'admin', 'Testing');
    const result = validateApiKey(plainTextKey);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('revoked');
  });

  it('checks IP allowlist', () => {
    const { plainTextKey } = generateApiKey({
      tenantId: 't_001', name: 'IP Check', environment: 'live',
      scopes: ['clients:read'], ipAllowlist: ['1.2.3.4'], createdBy: 'admin',
    });
    const result = validateApiKey(plainTextKey, undefined, '9.9.9.9');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('IP address');
  });

  it('allows valid IP', () => {
    const { plainTextKey } = generateApiKey({
      tenantId: 't_001', name: 'IP OK', environment: 'live',
      scopes: ['clients:read'], ipAllowlist: ['1.2.3.4'], createdBy: 'admin',
    });
    const result = validateApiKey(plainTextKey, undefined, '1.2.3.4');
    expect(result.valid).toBe(true);
  });

  it('updates last used timestamp', () => {
    const { key, plainTextKey } = generateApiKey({
      tenantId: 't_001', name: 'Usage Track', environment: 'live',
      scopes: ['clients:read'], createdBy: 'admin',
    });
    expect(key.lastUsedAt).toBeNull();
    validateApiKey(plainTextKey);
    const updated = getKeyById(key.id);
    expect(updated!.lastUsedAt).not.toBeNull();
    expect(updated!.usageCount).toBe(1);
  });
});

// ─── Key Rotation ─────────────────────────────────────────────────

describe('rotateKey', () => {
  it('creates a new key and marks old as rotating', () => {
    const { key: oldKey } = generateApiKey({
      tenantId: 't_001', name: 'Rotate Me', environment: 'live',
      scopes: ['clients:read'], createdBy: 'admin',
    });
    const result = rotateKey(oldKey.id, 'admin');
    expect(result).not.toBeNull();
    expect(result!.newKey.rotatingFrom).toBe(oldKey.id);
    expect(getKeyById(oldKey.id)!.status).toBe('rotating');
  });

  it('returns null for non-active keys', () => {
    const { key } = generateApiKey({
      tenantId: 't_001', name: 'Already Revoked', environment: 'live',
      scopes: ['clients:read'], createdBy: 'admin',
    });
    revokeKey(key.id, 'admin', 'test');
    const result = rotateKey(key.id, 'admin');
    expect(result).toBeNull();
  });

  it('preserves scopes on rotation', () => {
    const { key: oldKey } = generateApiKey({
      tenantId: 't_001', name: 'Scoped', environment: 'live',
      scopes: ['clients:read', 'ai:use'], createdBy: 'admin',
    });
    const result = rotateKey(oldKey.id, 'admin');
    expect(result!.newKey.scopes).toEqual(['clients:read', 'ai:use']);
  });
});

// ─── Key Revocation ───────────────────────────────────────────────

describe('revokeKey', () => {
  it('revokes an active key', () => {
    const { key } = generateApiKey({
      tenantId: 't_001', name: 'Revoke Me', environment: 'live',
      scopes: ['clients:read'], createdBy: 'admin',
    });
    expect(revokeKey(key.id, 'admin', 'Compromised')).toBe(true);
    expect(getKeyById(key.id)!.status).toBe('revoked');
    expect(getKeyById(key.id)!.revokedReason).toBe('Compromised');
  });

  it('returns false for non-existent key', () => {
    expect(revokeKey('fake_id', 'admin', 'test')).toBe(false);
  });
});

// ─── Key Management ───────────────────────────────────────────────

describe('key management', () => {
  it('lists keys by tenant', () => {
    generateApiKey({ tenantId: 't_001', name: 'Key 1', environment: 'live', scopes: ['clients:read'], createdBy: 'admin' });
    generateApiKey({ tenantId: 't_001', name: 'Key 2', environment: 'test', scopes: ['clients:read'], createdBy: 'admin' });
    generateApiKey({ tenantId: 't_002', name: 'Other', environment: 'live', scopes: ['clients:read'], createdBy: 'admin' });
    expect(getKeysByTenant('t_001').length).toBe(2);
  });

  it('excludes revoked keys by default', () => {
    const { key } = generateApiKey({ tenantId: 't_001', name: 'To Revoke', environment: 'live', scopes: ['clients:read'], createdBy: 'admin' });
    revokeKey(key.id, 'admin', 'test');
    expect(getKeysByTenant('t_001').length).toBe(0);
    expect(getKeysByTenant('t_001', true).length).toBe(1);
  });

  it('updates scopes', () => {
    const { key } = generateApiKey({ tenantId: 't_001', name: 'Scope Update', environment: 'live', scopes: ['clients:read'], createdBy: 'admin' });
    updateKeyScopes(key.id, ['clients:read', 'clients:write', 'ai:use'], 'admin');
    expect(getKeyById(key.id)!.scopes).toEqual(['clients:read', 'clients:write', 'ai:use']);
  });

  it('updates IP allowlist', () => {
    const { key } = generateApiKey({ tenantId: 't_001', name: 'IP Update', environment: 'live', scopes: ['clients:read'], createdBy: 'admin' });
    updateKeyIpAllowlist(key.id, ['10.0.0.1'], 'admin');
    expect(getKeyById(key.id)!.ipAllowlist).toEqual(['10.0.0.1']);
  });

  it('updates rate limit', () => {
    const { key } = generateApiKey({ tenantId: 't_001', name: 'Rate Update', environment: 'live', scopes: ['clients:read'], createdBy: 'admin' });
    updateKeyRateLimit(key.id, 500, 'admin');
    expect(getKeyById(key.id)!.rateLimit).toBe(500);
  });
});

// ─── Key Usage Tracking ───────────────────────────────────────────

describe('key usage', () => {
  it('logs and retrieves usage', () => {
    logKeyUsage({ keyId: 'key_1', tenantId: 't_001', path: '/clients', method: 'GET', ip: '1.2.3.4', userAgent: 'test', status: 200 });
    logKeyUsage({ keyId: 'key_1', tenantId: 't_001', path: '/clients', method: 'GET', ip: '1.2.3.4', userAgent: 'test', status: 200 });
    const usage = getKeyUsage('key_1', 7);
    expect(usage.total).toBe(2);
  });
});

// ─── Webhook Signing Keys ─────────────────────────────────────────

describe('webhook signing keys', () => {
  it('generates webhook signing key', () => {
    const key = generateWebhookSigningKey('t_001');
    expect(key.id).toMatch(/^whsec_/);
    expect(key.secret).toMatch(/^whsec_/);
    expect(key.algorithm).toBe('hmac-sha256');
  });

  it('rotates webhook key', () => {
    const key = generateWebhookSigningKey('t_001');
    const rotated = rotateWebhookSigningKey(key.id);
    expect(rotated).not.toBeNull();
    expect(rotated!.secret).not.toBe(key.secret);
    expect(rotated!.previousSecret).toBe(key.secret);
  });

  it('signs webhook payload', () => {
    const key = generateWebhookSigningKey('t_001');
    const signature = signWebhookPayload(key.id, '{"event":"test"}', Date.now());
    expect(signature).not.toBeNull();
    expect(signature).toContain('t=');
    expect(signature).toContain('v1=');
  });

  it('verifies webhook signature', () => {
    const key = generateWebhookSigningKey('t_001');
    const now = Math.floor(Date.now() / 1000);
    const sig = signWebhookPayload(key.id, '{"event":"test"}', now);
    const valid = verifyWebhookSignature(key.id, '{"event":"test"}', sig!);
    expect(valid).toBe(true);
  });

  it('lists webhook keys by tenant', () => {
    generateWebhookSigningKey('t_001');
    generateWebhookSigningKey('t_001');
    expect(getWebhookKeysByTenant('t_001').length).toBe(2);
  });
});

// ─── Scopes ───────────────────────────────────────────────────────

describe('scopes', () => {
  it('has 17 scopes defined', () => {
    expect(ALL_SCOPES.length).toBe(17);
  });

  it('all scopes have descriptions', () => {
    ALL_SCOPES.forEach(scope => {
      expect(SCOPE_DESCRIPTIONS[scope]).toBeDefined();
      expect(SCOPE_DESCRIPTIONS[scope].length).toBeGreaterThan(0);
    });
  });
});

// ─── Audit Trail ──────────────────────────────────────────────────

describe('audit trail', () => {
  it('tracks key creation', () => {
    generateApiKey({ tenantId: 't_001', name: 'Audit Test', environment: 'live', scopes: ['clients:read'], createdBy: 'admin' });
    const audit = getKeyAuditLog({ action: 'created' });
    expect(audit.length).toBeGreaterThan(0);
  });

  it('tracks revocation', () => {
    const { key } = generateApiKey({ tenantId: 't_001', name: 'Revoke Audit', environment: 'live', scopes: ['clients:read'], createdBy: 'admin' });
    revokeKey(key.id, 'admin', 'test');
    const audit = getKeyAuditLog({ action: 'revoked' });
    expect(audit.length).toBe(1);
  });

  it('tracks scope changes', () => {
    const { key } = generateApiKey({ tenantId: 't_001', name: 'Scope Audit', environment: 'live', scopes: ['clients:read'], createdBy: 'admin' });
    updateKeyScopes(key.id, ['clients:read', 'ai:use'], 'admin');
    const audit = getKeyAuditLog({ action: 'scopes_changed' });
    expect(audit.length).toBe(1);
  });

  it('filters by tenant', () => {
    generateApiKey({ tenantId: 't_001', name: 'T1 Key', environment: 'live', scopes: ['clients:read'], createdBy: 'admin' });
    generateApiKey({ tenantId: 't_002', name: 'T2 Key', environment: 'live', scopes: ['clients:read'], createdBy: 'admin' });
    expect(getKeyAuditLog({ tenantId: 't_001' }).length).toBe(1);
  });
});
