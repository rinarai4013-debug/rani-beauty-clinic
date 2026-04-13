/**
 * Integration tests for Intelligence routes:
 *   GET /api/dashboard/pricing
 *   GET /api/dashboard/finance/pnl
 *   GET /api/dashboard/inventory
 *   GET /api/dashboard/social
 *   GET /api/dashboard/meta-ads/optimize
 *   GET|POST /api/dashboard/consult
 *   GET /api/dashboard/knowledge-base
 *   GET /api/dashboard/phone-agent
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CEO_SESSION,
  MARKETING_SESSION,
  PROVIDER_SESSION,
  buildGetRequest,
  buildPostRequest,
  expectUnauthorized,
  expectForbidden,
  expectServerError,
} from './helpers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn();
const mockHasPermission = vi.fn();
const mockFetchAll = vi.fn();
const mockCacheGet = vi.fn().mockReturnValue(null);
const mockCacheSet = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    appointments: vi.fn(),
    transactions: vi.fn(),
    clients: vi.fn(),
    kpis: vi.fn(),
    alerts: vi.fn(),
    reviews: vi.fn(),
    competitorIntel: vi.fn(),
    memberships: vi.fn(),
  },
  fetchAll: (...args: unknown[]) => mockFetchAll(...args),
  fetchFirst: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    appointments: { date: 'Date', time: 'Time', status: 'Status', provider: 'Provider', duration: 'Duration', service: 'Service Name', amountQuoted: 'Amount Quoted', amountPaid: 'Amount Paid' },
    transactions: { date: 'Date', status: 'Status', amount: 'Amount', type: 'Type', paymentMethod: 'Payment Method', provider: 'Provider', serviceName: 'Service Name' },
    clients: { name: 'Client' },
  },
}));

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: vi.fn((v: string) => v),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
    invalidate: vi.fn(),
    invalidatePrefix: vi.fn(),
  },
  TTL: { REALTIME: 15, STANDARD: 30, MODERATE: 60, RELAXED: 120 },
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

vi.mock('@/lib/pricing/dynamic-engine', () => ({
  analyzePricing: vi.fn().mockReturnValue({
    recommendations: [],
    smartPackages: [],
    promotionalStrategies: [],
    marketPosition: 'competitive',
  }),
}));

vi.mock('@/lib/finance/pnl-engine', () => ({
  generateFinancialIntelligence: vi.fn().mockReturnValue({
    healthScore: 80,
    revenue: { total: 50000 },
    expenses: { total: 20000 },
    netIncome: 30000,
    serviceProfitability: [],
    cashFlowProjection: [],
  }),
}));

vi.mock('@/lib/inventory/auto-manager', () => ({
  analyzeInventory: vi.fn().mockReturnValue({
    alerts: [],
    reorderRecommendations: [],
    wasteAnalysis: [],
    parLevels: [],
  }),
}));

vi.mock('@/lib/social/auto-post-engine', () => ({
  generateWeeklyPlan: vi.fn().mockReturnValue({
    weeklyCalendar: [],
    monthlyTheme: 'Spring Glow',
    hashtagStrategy: { branded: [], location: [] },
  }),
}));

vi.mock('@/lib/ads/meta-ads-manager', () => ({
  analyzeMetaAds: vi.fn().mockReturnValue({
    campaigns: [],
    optimizations: [],
    adCopyVariants: [],
    budgetRecommendation: 'maintain',
  }),
}));

vi.mock('@/lib/consult/copilot-engine', () => ({
  generateConsultBriefing: vi.fn().mockReturnValue({
    clientIntelligence: {},
    treatmentPlan: {},
    talkingPoints: [],
    objectionHandlers: [],
    closingStrategies: [],
  }),
}));

vi.mock('@/lib/rag/knowledge-base', () => ({
  getKnowledgeBaseStats: vi.fn().mockReturnValue({
    totalDocuments: 12,
    coverageScore: 85,
    documentsbyCategory: {},
    knowledgeGaps: [],
  }),
  searchKnowledgeBase: vi.fn().mockReturnValue({
    results: [],
    confidence: 0,
  }),
  buildRAGContext: vi.fn().mockReturnValue({
    contextText: '',
    confidence: 0,
    sources: [],
  }),
}));

vi.mock('@/lib/phone/vapi-agent', () => ({
  getPhoneAgentConfig: vi.fn().mockReturnValue({
    assistantConfig: {},
    callFlows: [],
    analytics: { totalCalls: 0, avgDuration: 0 },
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupAuthCEO() {
  mockGetSession.mockResolvedValue(CEO_SESSION);
  mockHasPermission.mockReturnValue(true);
}

function setupUnauth() {
  mockGetSession.mockResolvedValue(null);
}

function setupForbidden() {
  mockGetSession.mockResolvedValue(MARKETING_SESSION);
  mockHasPermission.mockReturnValue(false);
}

// ---------------------------------------------------------------------------
// GET /api/dashboard/pricing
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/pricing/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking view_revenue permission', async () => {
    setupForbidden();
    const { GET } = await import('@/app/api/dashboard/pricing/route');
    const response = await GET();
    await expectForbidden(response);
  });

  it('should return pricing analysis', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/pricing/route');
    const response = await GET();

    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/finance/pnl
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/finance/pnl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/finance/pnl/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking view_finance permission', async () => {
    setupForbidden();
    const { GET } = await import('@/app/api/dashboard/finance/pnl/route');
    const response = await GET();
    await expectForbidden(response);
  });

  it('should return P&L data', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/finance/pnl/route');
    const response = await GET();

    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/inventory
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/inventory/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return inventory intelligence', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/inventory/route');
    const response = await GET();

    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/social
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/social', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/social/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return social media plan', async () => {
    setupAuthCEO();

    const { GET } = await import('@/app/api/dashboard/social/route');
    const response = await GET();

    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/meta-ads/optimize
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/meta-ads/optimize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/meta-ads/optimize/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return ad optimization data', async () => {
    setupAuthCEO();

    const { GET } = await import('@/app/api/dashboard/meta-ads/optimize/route');
    const response = await GET();

    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET|POST /api/dashboard/consult
// ---------------------------------------------------------------------------

describe('GET|POST /api/dashboard/consult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('GET should return 401 when not authenticated', async () => {
    setupUnauth();
    const mod = await import('@/app/api/dashboard/consult/route');
    const response = await mod.GET();
    await expectUnauthorized(response);
  });

  it('POST should return 401 when not authenticated', async () => {
    setupUnauth();
    const mod = await import('@/app/api/dashboard/consult/route');
    const req = buildPostRequest('/api/dashboard/consult', { clientId: 'rec001' });
    const response = await mod.POST(req as never);
    await expectUnauthorized(response);
  });

  it('GET should return sample consult briefing', async () => {
    setupAuthCEO();

    const mod = await import('@/app/api/dashboard/consult/route');
    const response = await mod.GET();

    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/knowledge-base
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/knowledge-base', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/knowledge-base/route');
    const req = buildGetRequest('/api/dashboard/knowledge-base');
    const response = await GET(req as never);
    await expectUnauthorized(response);
  });

  it('should return knowledge base stats', async () => {
    setupAuthCEO();

    const { GET } = await import('@/app/api/dashboard/knowledge-base/route');
    const req = buildGetRequest('/api/dashboard/knowledge-base');
    const response = await GET(req as never);

    expect(response.status).toBe(200);
  });

  it('should perform search when q param is provided', async () => {
    setupAuthCEO();

    const { GET } = await import('@/app/api/dashboard/knowledge-base/route');
    const req = buildGetRequest('/api/dashboard/knowledge-base', { q: 'botox aftercare' });
    const response = await GET(req as never);

    expect(response.status).toBe(200);
  });

  it('should trim search query before calling searchKnowledgeBase', async () => {
    setupAuthCEO();
    const knowledgeBase = await import('@/lib/rag/knowledge-base');

    const { GET } = await import('@/app/api/dashboard/knowledge-base/route');
    const req = buildGetRequest('/api/dashboard/knowledge-base', { q: '  botox aftercare  ' });
    const response = await GET(req as never);

    expect(response.status).toBe(200);
    expect(knowledgeBase.searchKnowledgeBase).toHaveBeenCalledWith('botox aftercare');
  });

  it('should return 400 when q is too long', async () => {
    setupAuthCEO();
    const { GET } = await import('@/app/api/dashboard/knowledge-base/route');
    const req = buildGetRequest('/api/dashboard/knowledge-base', { q: 'x'.repeat(201) });
    const response = await GET(req as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Query too long');
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/phone-agent
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/phone-agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/phone-agent/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return phone agent data', async () => {
    setupAuthCEO();

    const { GET } = await import('@/app/api/dashboard/phone-agent/route');
    const response = await GET();

    expect(response.status).toBe(200);
  });
});
