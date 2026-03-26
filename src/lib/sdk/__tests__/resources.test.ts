/**
 * RaniOS SDK - Resource Tests
 *
 * Tests for all resource classes (30+ tests):
 * - ClientsResource: list, get, getChurnRisk, getRecommendations, getAtRisk
 * - AppointmentsResource: list, getUpcoming, getNoShowRisk
 * - RevenueResource: getKPIs, getTrends, getAnomalies
 * - ScheduleResource: getToday, optimize
 * - InventoryResource: getAlerts, getWaste
 * - LoyaltyResource: getMember, awardPoints, redeemReward
 * - ReferralsResource: generate, getStats
 * - AIResource: chat, recommend, analyzeIntake
 * - TemplatesResource: postTreatment, reactivation, preConsult
 * - Auth: generateAPIKey, validateAPIKey, scopes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RaniOSClient } from '../client';
import {
  generateAPIKey,
  validateAPIKey,
  hashAPIKey,
  hasScope,
  hasAllScopes,
  hasAnyScope,
  isValidKeyFormat,
  parseKeyEnvironment,
  redactKey,
  ALL_SCOPES,
  READ_ONLY_SCOPES,
  SCOPE_PRESETS,
  type APIKeyRecord,
} from '../auth';

// ─── Mock fetch ─────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({
      'x-request-id': 'req_test123',
      'x-ratelimit-limit': '60',
      'x-ratelimit-remaining': '59',
      'x-ratelimit-reset': '60',
    }),
    json: vi.fn().mockResolvedValue(data),
  };
}

// ─── Setup ──────────────────────────────────────────────────────────────────

let client: RaniOSClient;

beforeEach(() => {
  vi.clearAllMocks();
  client = new RaniOSClient({
    apiKey: 'rani_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    tenantId: 'test-clinic',
    baseUrl: 'https://api.test.ranios.com/v1',
    maxRetries: 0,
  });
});

// ─── Clients Resource ───────────────────────────────────────────────────────

describe('ClientsResource', () => {
  it('should call list with params', async () => {
    const mockData = [{ id: 'rec_1', name: 'Jane' }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockData }));

    const result = await client.clients.list({ status: 'active', page: 1 });

    expect(result.data).toEqual(mockData);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/clients');
    expect(url).toContain('status=active');
  });

  it('should call get with client ID', async () => {
    const mockData = { id: 'rec_123', name: 'Jane Doe', appointments: [] };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockData }));

    const result = await client.clients.get('rec_123', { full: true });

    expect(result.data.id).toBe('rec_123');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/clients/rec_123');
    expect(url).toContain('full=true');
  });

  it('should call getChurnRisk', async () => {
    const mockChurn = { clientId: 'rec_123', score: 72, level: 'high', factors: [] };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockChurn }));

    const result = await client.clients.getChurnRisk('rec_123');

    expect(result.data.score).toBe(72);
    expect(result.data.level).toBe('high');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/clients/rec_123/churn');
  });

  it('should call getRecommendations with limit', async () => {
    const mockRecs = [{ service: 'Sofwave', strategy: 'pathway', confidence: 0.92 }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockRecs }));

    const result = await client.clients.getRecommendations('rec_123', { limit: 5 });

    expect(result.data).toHaveLength(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/clients/rec_123/recommend');
    expect(url).toContain('limit=5');
  });

  it('should call getAtRisk with urgency filter', async () => {
    const mockAtRisk = [{ client: { id: 'rec_1' }, urgency: 'immediate' }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockAtRisk }));

    const result = await client.clients.getAtRisk({ urgency: 'immediate' });

    expect(result.data).toHaveLength(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/clients/at-risk');
    expect(url).toContain('urgency=immediate');
  });
});

// ─── Appointments Resource ──────────────────────────────────────────────────

describe('AppointmentsResource', () => {
  it('should call list with date range', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));

    await client.appointments.list({ dateFrom: '2026-03-25', dateTo: '2026-03-31' });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('dateFrom=2026-03-25');
    expect(url).toContain('dateTo=2026-03-31');
  });

  it('should call getUpcoming with options', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));

    await client.appointments.getUpcoming({ days: 7, includeNoShowRisk: true });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/appointments/upcoming');
    expect(url).toContain('days=7');
    expect(url).toContain('includeNoShowRisk=true');
  });

  it('should call getNoShowRisk with date', async () => {
    const mockRisks = [{ appointmentId: 'apt_1', score: 65, level: 'moderate' }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockRisks }));

    const result = await client.appointments.getNoShowRisk('2026-03-28');

    expect(result.data[0].score).toBe(65);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/appointments/no-show-risk');
    expect(url).toContain('date=2026-03-28');
  });
});

// ─── Revenue Resource ───────────────────────────────────────────────────────

describe('RevenueResource', () => {
  it('should call getKPIs with range', async () => {
    const mockKPIs = { mtd: 67500, target: 80000 };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockKPIs }));

    const result = await client.revenue.getKPIs({ range: '30d' });

    expect(result.data.mtd).toBe(67500);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/revenue/kpis');
    expect(url).toContain('range=30d');
  });

  it('should call getTrends with options', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: { daily: [], summary: {} } }));

    await client.revenue.getTrends({ days: 30, groupBy: 'week' });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/revenue/trends');
    expect(url).toContain('days=30');
    expect(url).toContain('groupBy=week');
  });

  it('should call getAnomalies', async () => {
    const mockAnomalies = { anomalies: [], healthScore: 85 };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockAnomalies }));

    const result = await client.revenue.getAnomalies();

    expect(result.data.healthScore).toBe(85);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/revenue/anomalies');
  });
});

// ─── Schedule Resource ──────────────────────────────────────────────────────

describe('ScheduleResource', () => {
  it('should call getToday', async () => {
    const mockSchedule = { date: '2026-03-25', entries: [], summary: {} };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockSchedule }));

    const result = await client.schedule.getToday();

    expect(result.data.date).toBe('2026-03-25');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedule/today');
  });

  it('should call optimize', async () => {
    const mockOpt = { efficiencyScore: 78, gaps: [], conflicts: [] };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockOpt }));

    const result = await client.schedule.optimize();

    expect(result.data.efficiencyScore).toBe(78);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/schedule/optimize');
  });
});

// ─── Inventory Resource ─────────────────────────────────────────────────────

describe('InventoryResource', () => {
  it('should call getAlerts with severity filter', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));

    await client.inventory.getAlerts({ severity: 'critical' });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/inventory/alerts');
    expect(url).toContain('severity=critical');
  });

  it('should call getWaste', async () => {
    const mockWaste = { totalWasteCost: 1200, wasteRate: 3.2 };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockWaste }));

    const result = await client.inventory.getWaste();

    expect(result.data.totalWasteCost).toBe(1200);
  });
});

// ─── Loyalty Resource ───────────────────────────────────────────────────────

describe('LoyaltyResource', () => {
  it('should call getMember', async () => {
    const mockMember = { id: 'mem_1', tier: 'gold', pointsBalance: 2500 };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockMember }));

    const result = await client.loyalty.getMember('mem_1');

    expect(result.data.tier).toBe('gold');
    expect(result.data.pointsBalance).toBe(2500);
  });

  it('should call awardPoints', async () => {
    const mockTxn = { id: 'txn_1', amount: 500, type: 'earned' };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockTxn }));

    const result = await client.loyalty.awardPoints({
      memberId: 'mem_1',
      amount: 500,
      source: 'appointment',
      description: 'Sofwave completed',
    });

    expect(result.data.amount).toBe(500);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
  });

  it('should call redeemReward', async () => {
    const mockRedeem = { transactionId: 'txn_2', pointsDeducted: 1000, redemptionCode: 'ABC123' };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockRedeem }));

    const result = await client.loyalty.redeemReward({
      memberId: 'mem_1',
      rewardId: 'rwd_1',
    });

    expect(result.data.redemptionCode).toBe('ABC123');
  });
});

// ─── Referrals Resource ─────────────────────────────────────────────────────

describe('ReferralsResource', () => {
  it('should call generate', async () => {
    const mockCode = { id: 'ref_1', code: 'JANE2026', link: 'https://...' };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockCode }));

    const result = await client.referrals.generate({
      clientId: 'rec_123',
      referrerReward: { type: 'points', value: 500 },
      refereeReward: { type: 'discount', value: 50 },
    });

    expect(result.data.code).toBe('JANE2026');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
  });

  it('should call getStats', async () => {
    const mockStats = { totalReferrals: 45, conversionRate: 32.5 };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockStats }));

    const result = await client.referrals.getStats({ period: '90d' });

    expect(result.data.totalReferrals).toBe(45);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('period=90d');
  });
});

// ─── AI Resource ────────────────────────────────────────────────────────────

describe('AIResource', () => {
  it('should call chat', async () => {
    const mockChat = { message: 'I recommend...', intent: 'inquiry', conversationId: 'conv_1' };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockChat }));

    const result = await client.ai.chat({
      message: 'What treatments for fine lines?',
      context: { currentPage: '/services' },
    });

    expect(result.data.intent).toBe('inquiry');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);
    expect(body.message).toBe('What treatments for fine lines?');
  });

  it('should call recommend', async () => {
    const mockPlans = { plans: [{ tier: 'good' }, { tier: 'better' }, { tier: 'best' }] };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockPlans }));

    const result = await client.ai.recommend({
      concerns: ['fine lines'],
      goals: ['anti-aging'],
      budget: 'moderate',
    });

    expect(result.data.plans).toHaveLength(3);
  });

  it('should call analyzeIntake', async () => {
    const mockAnalysis = { summary: 'New client...', riskFlags: [] };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockAnalysis }));

    const result = await client.ai.analyzeIntake({
      clientId: 'rec_123',
      formData: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@test.com',
        phone: '+12065551234',
        concerns: ['acne scars'],
      },
    });

    expect(result.data.summary).toBeTruthy();
  });
});

// ─── Templates Resource ─────────────────────────────────────────────────────

describe('TemplatesResource', () => {
  it('should call postTreatment', async () => {
    const mockTemplate = { service: 'Sofwave', steps: [{}, {}, {}, {}, {}] };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockTemplate }));

    const result = await client.templates.postTreatment({
      clientName: 'Jane Doe',
      service: 'Sofwave',
      provider: 'Dr. Kim',
      appointmentDate: '2026-03-25',
    });

    expect(result.data.steps).toHaveLength(5);
  });

  it('should call reactivation', async () => {
    const mockTemplate = { tier: 'lapsed_30', urgency: 'gentle' };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockTemplate }));

    const result = await client.templates.reactivation({
      clientName: 'Jane Doe',
      daysSinceLastVisit: 35,
    });

    expect(result.data.tier).toBe('lapsed_30');
  });

  it('should call preConsult', async () => {
    const mockTemplate = { service: 'PicoWay', prepInstructions: ['Avoid sun'] };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: mockTemplate }));

    const result = await client.templates.preConsult({
      clientName: 'Jane Doe',
      service: 'PicoWay',
      appointmentDate: '2026-03-28',
      appointmentTime: '10:00 AM',
      isNewClient: true,
    });

    expect(result.data.prepInstructions).toContain('Avoid sun');
  });
});

// ─── Auth Module ────────────────────────────────────────────────────────────

describe('Auth', () => {
  it('should generate a valid API key', () => {
    const { key, record } = generateAPIKey({
      name: 'Test Key',
      tenantId: 'test-clinic',
      environment: 'live',
      scopes: ['clients:read'],
      createdBy: 'admin',
    });

    expect(key).toMatch(/^rani_live_[a-f0-9]{32}$/);
    expect(record.name).toBe('Test Key');
    expect(record.tenantId).toBe('test-clinic');
    expect(record.environment).toBe('live');
    expect(record.scopes).toEqual(['clients:read']);
    expect(record.revokedAt).toBeNull();
  });

  it('should generate test environment keys', () => {
    const { key } = generateAPIKey({
      name: 'Test',
      tenantId: 'tc',
      environment: 'test',
      scopes: ['clients:read'],
      createdBy: 'admin',
    });

    expect(key).toMatch(/^rani_test_/);
  });

  it('should throw on invalid scopes', () => {
    expect(() =>
      generateAPIKey({
        name: 'Test',
        tenantId: 'tc',
        environment: 'live',
        scopes: ['invalid:scope' as never],
        createdBy: 'admin',
      }),
    ).toThrow('Invalid scopes');
  });

  it('should set expiration correctly', () => {
    const { record } = generateAPIKey({
      name: 'Test',
      tenantId: 'tc',
      environment: 'live',
      scopes: ['clients:read'],
      expiresIn: 3600, // 1 hour
      createdBy: 'admin',
    });

    expect(record.expiresAt).toBeTruthy();
    const expires = new Date(record.expiresAt!).getTime();
    expect(expires).toBeGreaterThan(Date.now());
    expect(expires).toBeLessThanOrEqual(Date.now() + 3600 * 1000 + 1000);
  });

  it('should validate a correct API key', () => {
    const { key, record } = generateAPIKey({
      name: 'Test',
      tenantId: 'tc',
      environment: 'live',
      scopes: ['clients:read'],
      createdBy: 'admin',
    });

    const result = validateAPIKey(key, [record]);
    expect(result.valid).toBe(true);
    expect(result.record?.id).toBe(record.id);
  });

  it('should reject an unknown key', () => {
    const result = validateAPIKey('rani_live_aaaabbbbccccddddeeeeffffaaaabbbb', []);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not found');
  });

  it('should reject a revoked key', () => {
    const { key, record } = generateAPIKey({
      name: 'Test',
      tenantId: 'tc',
      environment: 'live',
      scopes: ['clients:read'],
      createdBy: 'admin',
    });
    record.revokedAt = new Date().toISOString();

    const result = validateAPIKey(key, [record]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('revoked');
  });

  it('should reject an expired key', () => {
    const { key, record } = generateAPIKey({
      name: 'Test',
      tenantId: 'tc',
      environment: 'live',
      scopes: ['clients:read'],
      createdBy: 'admin',
    });
    record.expiresAt = new Date(Date.now() - 1000).toISOString();

    const result = validateAPIKey(key, [record]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('expired');
  });

  it('should reject invalid key format', () => {
    const result = validateAPIKey('invalid_key_format', []);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid key format');
  });

  it('should check individual scope', () => {
    const { record } = generateAPIKey({
      name: 'Test',
      tenantId: 'tc',
      environment: 'live',
      scopes: ['clients:read', 'revenue:read'],
      createdBy: 'admin',
    });

    expect(hasScope(record, 'clients:read')).toBe(true);
    expect(hasScope(record, 'clients:write')).toBe(false);
  });

  it('should check all scopes', () => {
    const { record } = generateAPIKey({
      name: 'Test',
      tenantId: 'tc',
      environment: 'live',
      scopes: ['clients:read', 'revenue:read'],
      createdBy: 'admin',
    });

    expect(hasAllScopes(record, ['clients:read', 'revenue:read'])).toBe(true);
    expect(hasAllScopes(record, ['clients:read', 'clients:write'])).toBe(false);
  });

  it('should check any scope', () => {
    const { record } = generateAPIKey({
      name: 'Test',
      tenantId: 'tc',
      environment: 'live',
      scopes: ['clients:read'],
      createdBy: 'admin',
    });

    expect(hasAnyScope(record, ['clients:read', 'clients:write'])).toBe(true);
    expect(hasAnyScope(record, ['revenue:read', 'clients:write'])).toBe(false);
  });

  it('should validate key format', () => {
    expect(isValidKeyFormat('rani_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')).toBe(true);
    expect(isValidKeyFormat('rani_test_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')).toBe(true);
    expect(isValidKeyFormat('rani_dev_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')).toBe(false);
    expect(isValidKeyFormat('invalid')).toBe(false);
    expect(isValidKeyFormat('')).toBe(false);
  });

  it('should parse key environment', () => {
    expect(parseKeyEnvironment('rani_live_abc...')).toBe('live');
    expect(parseKeyEnvironment('rani_test_abc...')).toBe('test');
    expect(parseKeyEnvironment('invalid')).toBeNull();
  });

  it('should redact keys for display', () => {
    const redacted = redactKey('rani_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');
    expect(redacted).toContain('rani_live_a1');
    expect(redacted).toContain('...');
    expect(redacted.length).toBeLessThan(40);
  });

  it('should have correct scope presets', () => {
    expect(SCOPE_PRESETS.readonly).toEqual(READ_ONLY_SCOPES);
    expect(SCOPE_PRESETS.full).toEqual(ALL_SCOPES);
    expect(SCOPE_PRESETS.dashboard).toContain('clients:read');
    expect(SCOPE_PRESETS.dashboard).toContain('revenue:read');
    expect(SCOPE_PRESETS.crm).toContain('clients:write');
    expect(SCOPE_PRESETS.ai).toContain('ai:write');
  });

  it('should produce consistent hashes', () => {
    const key = 'rani_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
    const hash1 = hashAPIKey(key);
    const hash2 = hashAPIKey(key);
    expect(hash1).toBe(hash2);
  });
});
