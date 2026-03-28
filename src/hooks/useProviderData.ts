'use client';

import { useDashboardData } from './useDashboardData';
import type {
  PerformanceMetrics,
  ProviderComparison,
  TrendAnalysis,
  CompensationSummary,
  PayrollPeriod,
  PayEquityAnalysis,
  CompensationModel,
  GoalProgress,
  LeaderboardEntry,
  Achievement,
  TimeOffRequest,
  TimeOffBalance,
  CoverageCheck,
  ShiftSwapRequest,
  CECreditSummary,
  CareerPath,
  PerformanceReview,
  TrainingProgress,
  SkillCertification,
  TrainingBudget,
} from '@/types/providers';

// ── PERFORMANCE HOOKS ──

export function useProviderPerformance(providerId: string | null, period: string = 'monthly') {
  return useDashboardData<PerformanceMetrics>(
    providerId ? `/providers/performance?id=${providerId}&period=${period}` : null,
    { refreshInterval: 60000 },
  );
}

export function useProviderComparison(period: string = 'monthly') {
  return useDashboardData<ProviderComparison>(
    `/providers/performance/comparison?period=${period}`,
    { refreshInterval: 120000 },
  );
}

export function useProviderTrends(providerId: string | null, metric: string = 'revenue') {
  return useDashboardData<TrendAnalysis>(
    providerId ? `/providers/performance/trends?id=${providerId}&metric=${metric}` : null,
    { refreshInterval: 300000 },
  );
}

export function useProviderRankings(period: string = 'monthly') {
  return useDashboardData<{ rankings: { metric: string; entries: { providerId: string; providerName: string; value: number; rank: number; percentile: number }[] }[] }>(
    `/providers/performance/rankings?period=${period}`,
    { refreshInterval: 120000 },
  );
}

// ── COMPENSATION HOOKS ──

export function useProviderCompensation(providerId: string | null, periodStart?: string, periodEnd?: string) {
  const params = new URLSearchParams();
  if (providerId) params.set('id', providerId);
  if (periodStart) params.set('start', periodStart);
  if (periodEnd) params.set('end', periodEnd);
  return useDashboardData<CompensationSummary>(
    providerId ? `/providers/compensation?${params}` : null,
    { refreshInterval: 120000 },
  );
}

export function usePayrollPreview(periodStart?: string, periodEnd?: string) {
  const params = new URLSearchParams();
  if (periodStart) params.set('start', periodStart);
  if (periodEnd) params.set('end', periodEnd);
  return useDashboardData<{ periods: PayrollPeriod[]; totalGross: number; totalNet: number }>(
    `/providers/compensation/payroll?${params}`,
    { refreshInterval: 300000 },
  );
}

export function usePayEquity() {
  return useDashboardData<PayEquityAnalysis>(
    '/providers/compensation/equity',
    { refreshInterval: 300000 },
  );
}

export function useCompensationModel(providerId: string | null, scenario?: string) {
  const params = new URLSearchParams();
  if (providerId) params.set('id', providerId);
  if (scenario) params.set('scenario', scenario);
  return useDashboardData<CompensationModel>(
    providerId ? `/providers/compensation/model?${params}` : null,
    { refreshInterval: 0 },
  );
}

// ── GOALS HOOKS ──

export function useProviderGoals(providerId: string | null) {
  return useDashboardData<GoalProgress>(
    providerId ? `/providers/goals?id=${providerId}` : null,
    { refreshInterval: 60000 },
  );
}

export function useGoalLeaderboard(metric: string = 'revenue') {
  return useDashboardData<LeaderboardEntry[]>(
    `/providers/goals/leaderboard?metric=${metric}`,
    { refreshInterval: 120000 },
  );
}

export function useAchievements(providerId?: string) {
  const params = providerId ? `?id=${providerId}` : '';
  return useDashboardData<Achievement[]>(
    `/providers/goals/achievements${params}`,
    { refreshInterval: 300000 },
  );
}

// ── SCHEDULING HOOKS ──

export function useProviderSchedule(providerId: string | null) {
  return useDashboardData<{ workingHours: { dayOfWeek: number; startTime: string; endTime: string; isWorkday: boolean }[]; weeklyHours: number }>(
    providerId ? `/providers/schedule?id=${providerId}` : null,
    { refreshInterval: 300000 },
  );
}

export function useTimeOffRequests(providerId?: string) {
  const params = providerId ? `?id=${providerId}` : '';
  return useDashboardData<TimeOffRequest[]>(
    `/providers/schedule/time-off${params}`,
    { refreshInterval: 60000 },
  );
}

export function useTimeOffBalances(providerId: string | null) {
  return useDashboardData<TimeOffBalance[]>(
    providerId ? `/providers/schedule/balances?id=${providerId}` : null,
    { refreshInterval: 300000 },
  );
}

export function useCoverage(weekStart?: string) {
  const params = weekStart ? `?week=${weekStart}` : '';
  return useDashboardData<CoverageCheck[]>(
    `/providers/schedule/coverage${params}`,
    { refreshInterval: 120000 },
  );
}

export function useShiftSwaps(providerId?: string) {
  const params = providerId ? `?id=${providerId}` : '';
  return useDashboardData<ShiftSwapRequest[]>(
    `/providers/schedule/swaps${params}`,
    { refreshInterval: 60000 },
  );
}

// ── DEVELOPMENT HOOKS ──

export function useCECredits(providerId: string | null) {
  return useDashboardData<CECreditSummary>(
    providerId ? `/providers/development/ce-credits?id=${providerId}` : null,
    { refreshInterval: 300000 },
  );
}

export function useCareerPath(providerId: string | null) {
  return useDashboardData<CareerPath>(
    providerId ? `/providers/development/career-path?id=${providerId}` : null,
    { refreshInterval: 300000 },
  );
}

export function usePerformanceReviews(providerId?: string) {
  const params = providerId ? `?id=${providerId}` : '';
  return useDashboardData<PerformanceReview[]>(
    `/providers/development/reviews${params}`,
    { refreshInterval: 300000 },
  );
}

export function useTrainingProgress(providerId: string | null) {
  return useDashboardData<{ completed: { id: string; title: string }[]; inProgress: { id: string; title: string }[]; available: { id: string; title: string }[]; completionRate: number }>(
    providerId ? `/providers/development/training?id=${providerId}` : null,
    { refreshInterval: 300000 },
  );
}

export function useSkillCertifications() {
  return useDashboardData<{ matrix: Record<string, Record<string, SkillCertification | null>>; coverageGaps: { service: string; certifiedCount: number }[] }>(
    '/providers/development/certifications',
    { refreshInterval: 300000 },
  );
}

export function useTrainingBudget(providerId: string | null) {
  return useDashboardData<TrainingBudget>(
    providerId ? `/providers/development/budget?id=${providerId}` : null,
    { refreshInterval: 300000 },
  );
}
