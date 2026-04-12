/**
 * Integration tests for Dashboard Feature routes:
 *   GET /api/dashboard/revenue-optimizer
 *   GET /api/dashboard/agents/feed
 *   GET /api/dashboard/agents/[agentId]
 *   GET /api/dashboard/backlinks
 *   GET /api/dashboard/compliance
 *   GET /api/dashboard/training
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CEO_SESSION,
  MARKETING_SESSION,
  buildGetRequest,
  expectUnauthorized,
  expectServerError,
} from './helpers';

// ---------------------------------------------------------------------------
// Shared mutable mock refs (hoisted vi.mock pattern)
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn();
const mockHasPermission = vi.fn();
const mockCacheGet = vi.fn().mockReturnValue(null);
const mockCacheSet = vi.fn();
const mockGenerateWeeklyBrief = vi.fn();
const mockCalculateComplianceScore = vi.fn();
const mockBuildOfflineReport = vi.fn();
const mockBuildComplianceReport = vi.fn();
const mockBuildFinanceReport = vi.fn();
const mockBuildScoredReport = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
  },
  TTL: { REALTIME: 15, STANDARD: 30, MODERATE: 60, RELAXED: 120, SLOW: 300 },
}));

vi.mock('@/lib/backlinks/engine', () => ({
  generateWeeklyBrief: (...args: unknown[]) => mockGenerateWeeklyBrief(...args),
}));

vi.mock('@/lib/compliance', () => ({
  calculateComplianceScore: (...args: unknown[]) => mockCalculateComplianceScore(...args),
}));

vi.mock('@/lib/agents/registry', () => ({
  AGENT_IDS: ['compliance-guardian', 'finance-strategist'],
  AGENT_REGISTRY: {
    'compliance-guardian': {
      id: 'compliance-guardian',
      name: 'Compliance Guardian',
      icon: '🛡️',
      category: 'operations',
      status: 'live',
      mission: 'HIPAA compliance monitoring',
      enginePath: 'lib/compliance/index.ts',
      apiRoutes: ['/api/dashboard/compliance'],
      dashboardPath: '/dashboard/compliance',
      refreshInterval: 300,
      dependencies: [],
    },
    'finance-strategist': {
      id: 'finance-strategist',
      name: 'Finance Strategist',
      icon: '💰',
      category: 'operations',
      status: 'live',
      mission: 'Financial intelligence',
      enginePath: 'lib/finance/pnl-engine.ts',
      apiRoutes: ['/api/dashboard/finance/pnl'],
      dashboardPath: '/dashboard/pnl',
      refreshInterval: 300,
      dependencies: [],
    },
  },
}));

vi.mock('@/lib/agents/report-builder', () => ({
  buildOfflineReport: (...args: unknown[]) => mockBuildOfflineReport(...args),
  buildComplianceReport: (...args: unknown[]) => mockBuildComplianceReport(...args),
  buildFinanceReport: (...args: unknown[]) => mockBuildFinanceReport(...args),
  buildScoredReport: (...args: unknown[]) => mockBuildScoredReport(...args),
}));

vi.mock('@/data/training/modules', () => {
  const mockModule = {
    id: 'fd-001',
    slug: 'booking-workflow',
    title: 'Booking Workflow Mastery',
    description: 'End-to-end booking process',
    role: 'front-desk' as const,
    duration: 45,
    prerequisites: [],
    sections: [
      {
        title: 'Introduction',
        content: 'Sample content',
        quiz: [{ question: 'Q1?', options: ['A', 'B'], correctIndex: 0, explanation: 'Explanation' }],
      },
    ],
  };
  return {
    TRAINING_MODULES: [mockModule],
    ROLE_LABELS: {
      'front-desk': 'Front Desk',
      'provider': 'Provider',
      'all-staff': 'All Staff',
      'management': 'Management',
    },
    ROLE_COLORS: {
      'front-desk': '#3B82F6',
      'provider': '#8B5CF6',
      'all-staff': '#C9A96E',
      'management': '#059669',
    },
  };
});

// Suppress global fetch for agents/feed route (it calls sub-routes internally)
const mockGlobalFetch = vi.fn();
vi.stubGlobal('fetch', mockGlobalFetch);

// ---------------------------------------------------------------------------
// Imports (after all vi.mock calls)
// ---------------------------------------------------------------------------

import { GET as revenueOptimizerGET } from '@/app/api/dashboard/revenue-optimizer/route';
import { GET as agentsFeedGET } from '@/app/api/dashboard/agents/feed/route';
import { GET as agentByIdGET } from '@/app/api/dashboard/agents/[agentId]/route';
import { GET as backlinksGET } from '@/app/api/dashboard/backlinks/route';
import { GET as complianceGET } from '@/app/api/dashboard/compliance/route';
import { GET as trainingGET } from '@/app/api/dashboard/training/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupAuthenticatedCEO() {
  mockGetSession.mockResolvedValue(CEO_SESSION);
  mockHasPermission.mockReturnValue(true);
}

function setupUnauthenticated() {
  mockGetSession.mockResolvedValue(null);
}

function setupForbidden() {
  mockGetSession.mockResolvedValue(MARKETING_SESSION);
  mockHasPermission.mockReturnValue(false);
}

function buildNextRequest(path: string, params?: Record<string, string>) {
  const url = new URL(path, 'http://localhost:3000');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return {
    url: url.toString(),
    nextUrl: url,
    headers: new Headers({ cookie: 'rani-session=mock-jwt' }),
  };
}

// ==========================================================================
// GET /api/dashboard/revenue-optimizer
// ==========================================================================

describe('GET /api/dashboard/revenue-optimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const response = await revenueOptimizerGET();
    await expectUnauthorized(response);
  });

  it('should return 200 with revenue optimization summary', async () => {
    setupAuthenticatedCEO();
    const response = await revenueOptimizerGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('totalAddressableGap');
    expect(data).toHaveProperty('fillabilityScore');
    expect(data).toHaveProperty('topActions');
    expect(Array.isArray(data.topActions)).toBe(true);
  });

  it('should return 500 when getSession throws', async () => {
    mockGetSession.mockRejectedValue(new Error('Session service down'));
    const response = await revenueOptimizerGET();
    await expectServerError(response);
  });
});

// ==========================================================================
// GET /api/dashboard/agents/feed
// ==========================================================================

describe('GET /api/dashboard/agents/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
    mockGlobalFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: null }), { status: 200 }),
    );
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const req = buildNextRequest('/api/dashboard/agents/feed');
    const response = await agentsFeedGET(req as any);
    await expectUnauthorized(response);
  });

  it('should return 403 when user lacks view_executive permission', async () => {
    setupForbidden();
    const req = buildNextRequest('/api/dashboard/agents/feed');
    const response = await agentsFeedGET(req as any);
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it('should return cached data if available', async () => {
    setupAuthenticatedCEO();
    const cachedFeed = { alerts: [], recommendations: [], agentStatuses: [] };
    mockCacheGet.mockReturnValue(cachedFeed);

    const req = buildNextRequest('/api/dashboard/agents/feed');
    const response = await agentsFeedGET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(cachedFeed);
  });

  it('should return 200 with feed structure', async () => {
    setupAuthenticatedCEO();

    const req = buildNextRequest('/api/dashboard/agents/feed');
    const response = await agentsFeedGET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('alerts');
    expect(data.data).toHaveProperty('recommendations');
    expect(data.data).toHaveProperty('agentStatuses');
    expect(data.data).toHaveProperty('generatedAt');
  });

  it('should return 500 when getSession throws', async () => {
    mockGetSession.mockRejectedValue(new Error('Session service down'));
    const req = buildNextRequest('/api/dashboard/agents/feed');
    const response = await agentsFeedGET(req as any);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});

// ==========================================================================
// GET /api/dashboard/agents/[agentId]
// ==========================================================================

describe('GET /api/dashboard/agents/[agentId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
    mockBuildOfflineReport.mockReturnValue({
      agentId: 'compliance-guardian',
      agentName: 'Compliance Guardian',
      status: 'offline',
      scorecard: { score: 0 },
      alerts: [],
      recommendations: [],
      generatedAt: new Date().toISOString(),
    });
    mockBuildComplianceReport.mockReturnValue({
      agentId: 'compliance-guardian',
      agentName: 'Compliance Guardian',
      status: 'live',
      scorecard: { score: 92 },
      alerts: [],
      recommendations: [],
      generatedAt: new Date().toISOString(),
    });
    mockGlobalFetch.mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { overall: 92, categories: {}, status: 'compliant', upcomingDeadlines: [] } }), { status: 200 }),
    );
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const req = buildNextRequest('/api/dashboard/agents/compliance-guardian');
    const response = await agentByIdGET(req as any, {
      params: Promise.resolve({ agentId: 'compliance-guardian' }),
    });
    await expectUnauthorized(response);
  });

  it('should return 403 when user lacks view_executive permission', async () => {
    setupForbidden();
    const req = buildNextRequest('/api/dashboard/agents/compliance-guardian');
    const response = await agentByIdGET(req as any, {
      params: Promise.resolve({ agentId: 'compliance-guardian' }),
    });
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it('should return 404 for unknown agent ID', async () => {
    setupAuthenticatedCEO();
    const req = buildNextRequest('/api/dashboard/agents/nonexistent-agent');
    const response = await agentByIdGET(req as any, {
      params: Promise.resolve({ agentId: 'nonexistent-agent' }),
    });
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toContain('Unknown agent');
  });

  it('should return cached data if available', async () => {
    setupAuthenticatedCEO();
    const cachedReport = { agentId: 'compliance-guardian', status: 'live', scorecard: { score: 92 } };
    mockCacheGet.mockReturnValue(cachedReport);

    const req = buildNextRequest('/api/dashboard/agents/compliance-guardian');
    const response = await agentByIdGET(req as any, {
      params: Promise.resolve({ agentId: 'compliance-guardian' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(cachedReport);
  });

  it('should return 200 with agent report for a valid agent', async () => {
    setupAuthenticatedCEO();

    const req = buildNextRequest('/api/dashboard/agents/compliance-guardian');
    const response = await agentByIdGET(req as any, {
      params: Promise.resolve({ agentId: 'compliance-guardian' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('agentId');
  });

  it('should return 500 on internal error', async () => {
    mockGetSession.mockRejectedValue(new Error('Internal failure'));
    const req = buildNextRequest('/api/dashboard/agents/compliance-guardian');
    const response = await agentByIdGET(req as any, {
      params: Promise.resolve({ agentId: 'compliance-guardian' }),
    });
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});

// ==========================================================================
// GET /api/dashboard/backlinks
// ==========================================================================

describe('GET /api/dashboard/backlinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
    mockGenerateWeeklyBrief.mockReturnValue({
      score: 65,
      totalBacklinks: 120,
      newThisWeek: 3,
      lostThisWeek: 1,
      topReferrers: [],
      opportunities: [],
    });
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const response = await backlinksGET();
    await expectUnauthorized(response);
  });

  it('should return 403 when user lacks view_executive permission', async () => {
    setupForbidden();
    const response = await backlinksGET();
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it('should return cached data if available', async () => {
    setupAuthenticatedCEO();
    const cachedData = { brief: { score: 65 }, asOf: '2026-04-01' };
    mockCacheGet.mockReturnValue(cachedData);

    const response = await backlinksGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(cachedData);
  });

  it('should return 200 with backlink brief', async () => {
    setupAuthenticatedCEO();
    const response = await backlinksGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('brief');
    expect(data).toHaveProperty('asOf');
  });

  it('should return 500 on engine error', async () => {
    setupAuthenticatedCEO();
    mockGenerateWeeklyBrief.mockImplementation(() => {
      throw new Error('Engine failure');
    });

    const response = await backlinksGET();
    await expectServerError(response);
  });
});

// ==========================================================================
// GET /api/dashboard/compliance
// ==========================================================================

describe('GET /api/dashboard/compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
    mockCalculateComplianceScore.mockReturnValue({
      overall: 88,
      categories: {
        hipaa: { score: 92, issues: 1, label: 'HIPAA' },
        osha: { score: 85, issues: 2, label: 'OSHA' },
      },
      status: 'compliant',
    });
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const response = await complianceGET();
    await expectUnauthorized(response);
  });

  it('should return 403 when user lacks view_executive permission', async () => {
    setupForbidden();
    const response = await complianceGET();
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it('should return cached data if available', async () => {
    setupAuthenticatedCEO();
    const cachedData = { success: true, data: { overall: 88 } };
    mockCacheGet.mockReturnValue(cachedData);

    const response = await complianceGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(cachedData);
  });

  it('should return 200 with compliance score', async () => {
    setupAuthenticatedCEO();
    const response = await complianceGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('overall');
    expect(data).toHaveProperty('generatedAt');
  });

  it('should return 500 on engine error', async () => {
    setupAuthenticatedCEO();
    mockCalculateComplianceScore.mockImplementation(() => {
      throw new Error('Compliance calculation failed');
    });

    const response = await complianceGET();
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});

// ==========================================================================
// GET /api/dashboard/training
// ==========================================================================

describe('GET /api/dashboard/training', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const req = buildGetRequest('/api/dashboard/training');
    const response = await trainingGET(req as any);
    await expectUnauthorized(response);
  });

  it('should return 200 with training modules structure', async () => {
    setupAuthenticatedCEO();
    const req = buildGetRequest('/api/dashboard/training');
    const response = await trainingGET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('modules');
    expect(data).toHaveProperty('byRole');
    expect(data).toHaveProperty('stats');
    expect(data).toHaveProperty('roleLabels');
    expect(data).toHaveProperty('roleColors');
    expect(Array.isArray(data.modules)).toBe(true);
  });

  it('should include stats with totals', async () => {
    setupAuthenticatedCEO();
    const req = buildGetRequest('/api/dashboard/training');
    const response = await trainingGET(req as any);
    const data = await response.json();

    expect(data.stats).toHaveProperty('totalModules');
    expect(data.stats).toHaveProperty('totalSections');
    expect(data.stats).toHaveProperty('totalQuizQuestions');
    expect(data.stats).toHaveProperty('totalDuration');
    expect(data.stats).toHaveProperty('byRole');
  });

  it('should filter modules by role query param', async () => {
    setupAuthenticatedCEO();
    const req = buildGetRequest('/api/dashboard/training', { role: 'front-desk' });
    const response = await trainingGET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    // All returned modules should be front-desk
    for (const mod of data.modules) {
      expect(mod.role).toBe('front-desk');
    }
  });

  it('should return empty modules array for non-matching role', async () => {
    setupAuthenticatedCEO();
    const req = buildGetRequest('/api/dashboard/training', { role: 'management' });
    const response = await trainingGET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Our mock only has a front-desk module, so management should be empty
    expect(data.modules).toEqual([]);
  });

  it('should return 500 on error', async () => {
    mockGetSession.mockRejectedValue(new Error('Session error'));
    const req = buildGetRequest('/api/dashboard/training');
    const response = await trainingGET(req as any);
    await expectServerError(response);
  });
});
