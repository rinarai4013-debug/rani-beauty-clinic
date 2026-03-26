// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock SWR before importing the hooks
const mockMutate = vi.fn();
vi.mock('swr', () => {
  const actual = vi.importActual('swr');
  return {
    ...actual,
    default: vi.fn(),
  };
});

import useSWR from 'swr';
import {
  useDashboardData,
  useKPIs,
  useRevenueData,
  useLeadData,
  useScheduleData,
  useAlerts,
  useClinicScore,
  useGamification,
  useLeaderboard,
  useIntegrationStatus,
  useClientProfile,
  useClientChurn,
  useAtRiskClients,
  useNoShowRisk,
  useRevenueAnomalies,
  FetchError,
} from '../useDashboardData';

const mockedSWR = vi.mocked(useSWR);

function mockSWRReturn(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: mockMutate,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedSWR.mockReturnValue(mockSWRReturn() as any);
});

// ── FetchError ──

describe('FetchError', () => {
  it('creates an error with message, status, and info', () => {
    const err = new FetchError('Not found', 404, { detail: 'missing' });
    expect(err.message).toBe('Not found');
    expect(err.status).toBe(404);
    expect(err.info).toEqual({ detail: 'missing' });
  });

  it('has name FetchError', () => {
    const err = new FetchError('test', 500);
    expect(err.name).toBe('FetchError');
  });

  it('is an instance of Error', () => {
    const err = new FetchError('test', 500);
    expect(err).toBeInstanceOf(Error);
  });

  it('works without info parameter', () => {
    const err = new FetchError('Unauthorized', 401);
    expect(err.info).toBeUndefined();
  });
});

// ── useDashboardData base hook ──

describe('useDashboardData', () => {
  it('passes correct URL to SWR with /api/dashboard prefix', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useDashboardData('/kpis'));
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/kpis',
      expect.any(Function),
      expect.objectContaining({})
    );
  });

  it('passes null to SWR when endpoint is null (conditional fetching)', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useDashboardData(null));
    expect(mockedSWR).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.objectContaining({})
    );
  });

  it('returns isLoading true when SWR is loading', () => {
    mockedSWR.mockReturnValue(mockSWRReturn({ isLoading: true }) as any);
    const { result } = renderHook(() => useDashboardData('/test'));
    expect(result.current.isLoading).toBe(true);
  });

  it('returns data when SWR has data', () => {
    const testData = { revenue: 5000 };
    mockedSWR.mockReturnValue(mockSWRReturn({ data: testData }) as any);
    const { result } = renderHook(() => useDashboardData<{ revenue: number }>('/test'));
    expect(result.current.data).toEqual(testData);
  });

  it('returns error when SWR has error', () => {
    const testError = new FetchError('Server error', 500);
    mockedSWR.mockReturnValue(mockSWRReturn({ error: testError }) as any);
    const { result } = renderHook(() => useDashboardData('/test'));
    expect(result.current.error).toBe(testError);
  });

  it('isRefreshing is true when validating with existing data', () => {
    mockedSWR.mockReturnValue(
      mockSWRReturn({ data: { x: 1 }, isValidating: true, isLoading: false }) as any
    );
    const { result } = renderHook(() => useDashboardData('/test'));
    expect(result.current.isRefreshing).toBe(true);
  });

  it('isRefreshing is false when loading initially (no data yet)', () => {
    mockedSWR.mockReturnValue(
      mockSWRReturn({ data: undefined, isValidating: true, isLoading: true }) as any
    );
    const { result } = renderHook(() => useDashboardData('/test'));
    expect(result.current.isRefreshing).toBe(false);
  });

  it('isEmpty is true when data is empty array', () => {
    mockedSWR.mockReturnValue(mockSWRReturn({ data: [] }) as any);
    const { result } = renderHook(() => useDashboardData('/test'));
    expect(result.current.isEmpty).toBe(true);
  });

  it('isEmpty is true when data is empty object', () => {
    mockedSWR.mockReturnValue(mockSWRReturn({ data: {} }) as any);
    const { result } = renderHook(() => useDashboardData('/test'));
    expect(result.current.isEmpty).toBe(true);
  });

  it('isEmpty is true when data is null', () => {
    mockedSWR.mockReturnValue(mockSWRReturn({ data: null }) as any);
    const { result } = renderHook(() => useDashboardData('/test'));
    expect(result.current.isEmpty).toBe(true);
  });

  it('isEmpty is false when data has content', () => {
    mockedSWR.mockReturnValue(mockSWRReturn({ data: [1, 2, 3] }) as any);
    const { result } = renderHook(() => useDashboardData('/test'));
    expect(result.current.isEmpty).toBe(false);
  });

  it('provides a retry function that calls mutate', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    const { result } = renderHook(() => useDashboardData('/test'));
    result.current.retry();
    expect(mockMutate).toHaveBeenCalled();
  });

  it('provides a mutate function that calls SWR mutate', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    const { result } = renderHook(() => useDashboardData('/test'));
    result.current.mutate();
    expect(mockMutate).toHaveBeenCalled();
  });
});

// ── Pre-configured hooks ──

describe('pre-configured hooks', () => {
  it('useKPIs fetches /kpis with default range "today"', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useKPIs());
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/kpis?range=today',
      expect.any(Function),
      expect.objectContaining({ refreshInterval: 30000 })
    );
  });

  it('useKPIs accepts custom range parameter', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useKPIs('mtd'));
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/kpis?range=mtd',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('useRevenueData fetches /revenue with 60s refresh', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useRevenueData());
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/revenue?range=mtd',
      expect.any(Function),
      expect.objectContaining({ refreshInterval: 60000 })
    );
  });

  it('useLeadData fetches /leads', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useLeadData());
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/leads',
      expect.any(Function),
      expect.objectContaining({ refreshInterval: 60000 })
    );
  });

  it('useScheduleData fetches /schedule with 30s refresh', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useScheduleData());
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/schedule',
      expect.any(Function),
      expect.objectContaining({ refreshInterval: 30000 })
    );
  });

  it('useAlerts fetches /alerts with 30s refresh', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useAlerts());
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/alerts',
      expect.any(Function),
      expect.objectContaining({ refreshInterval: 30000 })
    );
  });

  it('useClinicScore fetches /gamification/score', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useClinicScore());
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/gamification/score',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('useGamification fetches /gamification/achievements', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useGamification());
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/gamification/achievements',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('useLeaderboard fetches with 120s refresh', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useLeaderboard());
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/gamification/leaderboard',
      expect.any(Function),
      expect.objectContaining({ refreshInterval: 120000 })
    );
  });

  it('useIntegrationStatus fetches with 5min refresh', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useIntegrationStatus());
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/integrations/sync-all',
      expect.any(Function),
      expect.objectContaining({ refreshInterval: 300000 })
    );
  });

  it('useClientProfile passes null when id is null (conditional)', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useClientProfile(null));
    expect(mockedSWR).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('useClientProfile fetches with full=true for valid id', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useClientProfile('rec123'));
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/clients/rec123?full=true',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('useClientChurn passes null when id is null', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useClientChurn(null));
    expect(mockedSWR).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('useAtRiskClients fetches /clients/at-risk', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useAtRiskClients());
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/clients/at-risk',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('useNoShowRisk includes date parameter', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useNoShowRisk('2026-03-25'));
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/schedule/no-show-risk?date=2026-03-25',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('useRevenueAnomalies fetches /revenue/anomalies with 2min refresh', () => {
    mockedSWR.mockReturnValue(mockSWRReturn() as any);
    renderHook(() => useRevenueAnomalies());
    expect(mockedSWR).toHaveBeenCalledWith(
      '/api/dashboard/revenue/anomalies',
      expect.any(Function),
      expect.objectContaining({ refreshInterval: 120000 })
    );
  });
});
