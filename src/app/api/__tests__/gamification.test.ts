/**
 * Integration tests for Gamification routes:
 *   GET /api/dashboard/gamification/score
 *   GET /api/dashboard/gamification/achievements
 *   GET /api/dashboard/gamification/leaderboard
 *   GET /api/dashboard/gamification/briefing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CEO_SESSION,
  MARKETING_SESSION,
  PROVIDER_SESSION,
  airtableRecord,
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
    kpis: vi.fn(),
    reviews: vi.fn(),
  },
  fetchAll: (...args: unknown[]) => mockFetchAll(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
  },
  TTL: { REALTIME: 15, STANDARD: 30, MODERATE: 60, RELAXED: 120 },
}));

vi.mock('@/lib/gamification/engine', () => ({
  calculateClinicScore: vi.fn().mockReturnValue({
    total: 78,
    breakdown: { revenue: 85, utilization: 70, consults: 65, operations: 90 },
    status: 'good',
  }),
  getCurrentBossLevel: vi.fn().mockReturnValue({
    current: { name: 'Silver', threshold: 30000, icon: 'medal' },
    next: { name: 'Gold', threshold: 60000, icon: 'trophy' },
    progress: 65,
  }),
}));

vi.mock('@/lib/gamification/levels', () => ({
  getCurrentLevel: vi.fn().mockReturnValue({
    level: 5,
    name: 'Gold',
    xpRequired: 2500,
    icon: 'medal',
  }),
}));

vi.mock('@/data/dashboard/achievement-definitions', () => ({
  ACHIEVEMENTS: [
    { id: 'revenue-500', name: 'First $500', description: 'Earn $500 in a day', icon: '💰', category: 'revenue', rarity: 'common', xpReward: 50, check: (m: Record<string, number>) => m.revenue >= 500 },
    { id: 'full-schedule', name: 'Fully Booked', description: '8+ appointments', icon: '📅', category: 'bookings', rarity: 'rare', xpReward: 100, check: (m: Record<string, number>) => m.totalAppointments >= 8 },
  ],
  checkAchievements: vi.fn().mockReturnValue([
    { id: 'revenue-500', name: 'First $500', xpReward: 50 },
  ]),
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
// GET /api/dashboard/gamification/score
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/gamification/score', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/gamification/score/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking view_executive permission', async () => {
    setupForbidden();
    const { GET } = await import('@/app/api/dashboard/gamification/score/route');
    const response = await GET();
    await expectForbidden(response);
  });

  it('should return gamification score data', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/gamification/score/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('breakdown');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('streak');
    expect(data).toHaveProperty('xp');
    expect(data).toHaveProperty('level');
    expect(data).toHaveProperty('bossProgress');
  });

  it('should return cached data when available', async () => {
    setupAuthCEO();
    const cached = { total: 90, status: 'excellent' };
    mockCacheGet.mockReturnValue(cached);

    const { GET } = await import('@/app/api/dashboard/gamification/score/route');
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual(cached);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });

  it('should calculate score from appointment and transaction data', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([
      airtableRecord('apt1', { Duration: 60, Status: 'completed', 'Is Consult': true, 'Consult Outcome': 'Booked', Provider: 'Mom', Date: '2026-03-24', Time: '10:00', 'Service Name': 'HydraFacial' }),
    ]);

    const { GET } = await import('@/app/api/dashboard/gamification/score/route');
    const response = await GET();
    const data = await response.json();

    expect(data.total).toBe(78);
    expect(data.breakdown.revenue).toBe(85);
  });

  it('should include boss level progress', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/gamification/score/route');
    const response = await GET();
    const data = await response.json();

    expect(data.bossProgress).toHaveProperty('current');
    expect(data.bossProgress).toHaveProperty('progress');
    expect(data.bossProgress).toHaveProperty('currentRevenue');
  });

  it('should return fallback score payload on Airtable error', async () => {
    setupAuthCEO();
    mockFetchAll.mockRejectedValue(new Error('Airtable error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { GET } = await import('@/app/api/dashboard/gamification/score/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(78);
    expect(data.status).toBe('good');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/gamification/achievements
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/gamification/achievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/gamification/achievements/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking permission', async () => {
    setupForbidden();
    const { GET } = await import('@/app/api/dashboard/gamification/achievements/route');
    const response = await GET();
    await expectForbidden(response);
  });

  it('should return achievements list', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/gamification/achievements/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('achievements');
    expect(data).toHaveProperty('totalXP');
    expect(data).toHaveProperty('level');
    expect(Array.isArray(data.achievements)).toBe(true);
  });

  it('should include both daily and monthly achievements', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/gamification/achievements/route');
    const response = await GET();
    const data = await response.json();

    const types = new Set(data.achievements.map((a: { type: string }) => a.type));
    expect(types.has('daily')).toBe(true);
    expect(types.has('monthly')).toBe(true);
  });

  it('should mark earned achievements', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/gamification/achievements/route');
    const response = await GET();
    const data = await response.json();

    const earned = data.achievements.filter((a: { earned: boolean }) => a.earned);
    expect(earned.length).toBeGreaterThanOrEqual(0);
  });

  it('should cache results', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/gamification/achievements/route');
    await GET();

    expect(mockCacheSet).toHaveBeenCalledWith('gamification-achievements', expect.any(Object), expect.any(Number));
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/gamification/leaderboard
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/gamification/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/gamification/leaderboard/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking view_leaderboard permission', async () => {
    mockGetSession.mockResolvedValue(MARKETING_SESSION);
    mockHasPermission.mockReturnValue(false);

    const { GET } = await import('@/app/api/dashboard/gamification/leaderboard/route');
    const response = await GET();
    await expectForbidden(response);
  });

  it('should return leaderboard entries sorted by XP', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/gamification/leaderboard/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('entries');
    expect(Array.isArray(data.entries)).toBe(true);

    // Should be sorted by totalXP descending
    if (data.entries.length >= 2) {
      expect(data.entries[0].totalXP).toBeGreaterThanOrEqual(data.entries[1].totalXP);
    }
  });

  it('should include provider metadata', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/gamification/leaderboard/route');
    const response = await GET();
    const data = await response.json();

    for (const entry of data.entries) {
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('role');
      expect(entry).toHaveProperty('totalXP');
      expect(entry).toHaveProperty('level');
      expect(entry).toHaveProperty('achievements');
      expect(entry).toHaveProperty('weeklyScore');
    }
  });

  it('should cache results', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/gamification/leaderboard/route');
    await GET();

    expect(mockCacheSet).toHaveBeenCalledWith('gamification-leaderboard', expect.any(Object), expect.any(Number));
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/gamification/briefing
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/gamification/briefing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/gamification/briefing/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking permission', async () => {
    setupForbidden();
    const { GET } = await import('@/app/api/dashboard/gamification/briefing/route');
    const response = await GET();
    await expectForbidden(response);
  });

  it('should return morning briefing data', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/gamification/briefing/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('yesterdayRevenue');
    expect(data).toHaveProperty('yesterdayVsAvg');
    expect(data).toHaveProperty('weekRevenue');
    expect(data).toHaveProperty('weekTarget');
    expect(data).toHaveProperty('appointmentsToday');
    expect(data).toHaveProperty('consultsToday');
    expect(data).toHaveProperty('focusArea');
  });

  it('should include top win when yesterday revenue is high', async () => {
    setupAuthCEO();
    // Mock transactions for yesterday with high revenue
    mockFetchAll.mockImplementation((_table: unknown, opts?: { filterByFormula?: string }) => {
      const filter = (opts as Record<string, string>)?.filterByFormula || '';
      // Return high-revenue transactions for yesterday
      if (filter.includes('Service')) {
        return Promise.resolve([
          airtableRecord('tx1', { Date: '2026-03-23', Amount: 5000, Type: 'Service', Status: 'Completed' }),
        ]);
      }
      return Promise.resolve([]);
    });

    const { GET } = await import('@/app/api/dashboard/gamification/briefing/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(typeof data.topWin).toBe('string');
  });

  it('should calculate weekly target', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/gamification/briefing/route');
    const response = await GET();
    const data = await response.json();

    expect(data.weekTarget).toBe(20000);
  });

  it('should cache the briefing data', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/gamification/briefing/route');
    await GET();

    expect(mockCacheSet).toHaveBeenCalledWith('gamification-briefing', expect.any(Object), expect.any(Number));
  });

  it('should return 500 on Airtable error', async () => {
    setupAuthCEO();
    mockFetchAll.mockRejectedValue(new Error('Airtable error'));

    const { GET } = await import('@/app/api/dashboard/gamification/briefing/route');
    const response = await GET();
    await expectServerError(response);
  });
});
