/**
 * Integration tests for GET /api/dashboard/alerts
 * Operational alert system fed by n8n, entry forms, and cron jobs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  Tables: { alerts: vi.fn(() => ({})) },
  fetchAll: (...args: unknown[]) => mockFetchAll(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
  },
  TTL: { REALTIME: 30_000 },
}));

function airtableAlert(id: string, severity: string, message: string, status = 'Active') {
  return {
    id,
    fields: {
      Type: 'operational',
      Severity: severity,
      Message: message,
      'Action Recommended': 'Investigate',
      Status: status,
      'Created Date': '2026-04-12',
      'Acknowledged By': '',
      'Acknowledged Date': '',
    },
  };
}

describe('GET /api/dashboard/alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
    mockGetSession.mockResolvedValue({ username: 'rina', role: 'ceo' });
    mockHasPermission.mockReturnValue(true);
    mockFetchAll.mockResolvedValue([]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/alerts/route');
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('returns 403 when lacking view_executive permission', async () => {
    mockHasPermission.mockReturnValueOnce(false);
    const { GET } = await import('@/app/api/dashboard/alerts/route');
    const response = await GET();
    expect(response.status).toBe(403);
  });

  it('returns cached alerts without hitting Airtable', async () => {
    const cached = { success: true, data: { total: 0, bySeverity: {}, alerts: [] } };
    mockCacheGet.mockReturnValueOnce(cached);
    const { GET } = await import('@/app/api/dashboard/alerts/route');
    const response = await GET();
    const body = await response.json();

    expect(body).toEqual(cached);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });

  it('normalizes severity labels (urgent → critical, warning → high)', async () => {
    mockFetchAll.mockResolvedValueOnce([
      airtableAlert('a1', 'Urgent', 'Critical alert'),
      airtableAlert('a2', 'Warning', 'High alert'),
      airtableAlert('a3', 'Medium', 'Medium alert'),
      airtableAlert('a4', 'Unknown', 'Low alert'),
    ]);

    const { GET } = await import('@/app/api/dashboard/alerts/route');
    const response = await GET();
    const body = await response.json();

    expect(body.data.alerts[0].severity).toBe('critical');
    expect(body.data.alerts[1].severity).toBe('high');
    expect(body.data.alerts[2].severity).toBe('medium');
    expect(body.data.alerts[3].severity).toBe('low');
  });

  it('computes bySeverity breakdown', async () => {
    mockFetchAll.mockResolvedValueOnce([
      airtableAlert('a1', 'Critical', 'Down'),
      airtableAlert('a2', 'Critical', 'Down 2'),
      airtableAlert('a3', 'High', 'Watch'),
      airtableAlert('a4', 'Medium', 'Note'),
    ]);

    const { GET } = await import('@/app/api/dashboard/alerts/route');
    const response = await GET();
    const body = await response.json();

    expect(body.data.bySeverity.critical).toBe(2);
    expect(body.data.bySeverity.high).toBe(1);
    expect(body.data.bySeverity.medium).toBe(1);
    expect(body.data.bySeverity.low).toBe(0);
    expect(body.data.total).toBe(4);
  });

  it('caches result with REALTIME TTL', async () => {
    mockFetchAll.mockResolvedValueOnce([]);
    const { GET } = await import('@/app/api/dashboard/alerts/route');
    await GET();
    expect(mockCacheSet).toHaveBeenCalledWith('active-alerts', expect.any(Object), 30_000);
  });

  it('returns 500 when Airtable fetch fails', async () => {
    mockFetchAll.mockRejectedValueOnce(new Error('Airtable unavailable'));
    const { GET } = await import('@/app/api/dashboard/alerts/route');
    const response = await GET();
    expect(response.status).toBe(500);
  });
});
