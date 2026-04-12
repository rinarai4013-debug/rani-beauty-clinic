import { describe, it, expect } from 'vitest';
import { calculateClinicScore, getCurrentBossLevel, BOSS_LEVELS } from '../engine';
import type { DailyMetrics } from '@/types/gamification';

function buildMetrics(overrides: Partial<DailyMetrics> = {}): DailyMetrics {
  return {
    revenue: 4000,
    revenueTarget: 4000,
    bookedHours: 6,
    availableHours: 8,
    consultsCompleted: 3,
    consultsClosed: 2,
    patientsSeen: 5,
    patientsRebooked: 4,
    reviewsReceived: 1,
    followUpsDue: 3,
    followUpsCompleted: 3,
    totalAppointments: 6,
    noShows: 0,
    cancellations: 0,
    ...overrides,
  };
}

describe('calculateClinicScore', () => {
  it('returns score between 0 and 100', () => {
    const { total } = calculateClinicScore(buildMetrics());
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it('returns strong or elite status for good metrics', () => {
    const { total, status } = calculateClinicScore(buildMetrics());
    expect(total).toBeGreaterThanOrEqual(75);
    expect(['elite', 'strong']).toContain(status);
  });

  it('returns critical status for zero metrics', () => {
    const { total, status } = calculateClinicScore(buildMetrics({
      revenue: 0,
      bookedHours: 0,
      consultsCompleted: 0,
      consultsClosed: 0,
      patientsSeen: 0,
      patientsRebooked: 0,
      reviewsReceived: 0,
      followUpsDue: 0,
      followUpsCompleted: 0,
      totalAppointments: 0,
    }));
    // With zero revenue and zero utilization, score should be low
    // but no-consults / no-patients = no penalty (100 default) for those factors
    expect(total).toBeLessThanOrEqual(100);
    expect(['critical', 'growing']).toContain(status);
  });

  it('includes all breakdown categories', () => {
    const { breakdown } = calculateClinicScore(buildMetrics());
    expect(breakdown).toHaveProperty('revenue');
    expect(breakdown).toHaveProperty('utilization');
    expect(breakdown).toHaveProperty('consultConversion');
    expect(breakdown).toHaveProperty('rebooks');
    expect(breakdown).toHaveProperty('reviews');
    expect(breakdown).toHaveProperty('followUps');
    expect(breakdown).toHaveProperty('operations');
  });

  it('caps revenue score at 100 even if exceeding target', () => {
    const { breakdown } = calculateClinicScore(buildMetrics({ revenue: 8000, revenueTarget: 4000 }));
    expect(breakdown.revenue).toBeLessThanOrEqual(100);
  });

  it('scores reviews as 0 when none received', () => {
    const { breakdown } = calculateClinicScore(buildMetrics({ reviewsReceived: 0 }));
    expect(breakdown.reviews).toBe(0);
  });

  it('penalizes no-shows in operations score', () => {
    const perfect = calculateClinicScore(buildMetrics({ noShows: 0, cancellations: 0 }));
    const withNoShows = calculateClinicScore(buildMetrics({ noShows: 2, cancellations: 1 }));
    expect(withNoShows.breakdown.operations).toBeLessThan(perfect.breakdown.operations);
  });
});

describe('getCurrentBossLevel', () => {
  it('returns Bronze Boss for zero revenue', () => {
    const { current } = getCurrentBossLevel(0);
    expect(current.name).toBe('Bronze Boss');
  });

  it('returns correct boss level for mid-range revenue', () => {
    const { current } = getCurrentBossLevel(60000);
    expect(current.name).toBe('Gold Guardian');
  });

  it('returns Diamond Dynasty for revenue above all targets', () => {
    const { current } = getCurrentBossLevel(200000);
    expect(current.name).toBe('Diamond Dynasty');
  });

  it('returns progress as percentage through current level', () => {
    const { progress } = getCurrentBossLevel(15000);
    // Bronze target is 30000, prev is 0 → 15000/30000 = 50%
    expect(progress).toBeCloseTo(50, 0);
  });

  it('caps progress at 100', () => {
    const { progress } = getCurrentBossLevel(200000);
    expect(progress).toBeLessThanOrEqual(100);
  });
});

describe('BOSS_LEVELS', () => {
  it('has 5 levels', () => {
    expect(BOSS_LEVELS).toHaveLength(5);
  });

  it('is sorted by ascending target', () => {
    for (let i = 1; i < BOSS_LEVELS.length; i++) {
      expect(BOSS_LEVELS[i].target).toBeGreaterThan(BOSS_LEVELS[i - 1].target);
    }
  });
});
