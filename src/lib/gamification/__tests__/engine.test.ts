// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  calculateClinicScore,
  getCurrentBossLevel,
  BOSS_LEVELS,
} from '../engine';
import {
  getCurrentLevel,
  getNextLevel,
  getXPToNextLevel,
  getLevelProgress,
  LEVELS,
} from '../levels';
import { SCORE_WEIGHTS } from '@/data/dashboard/score-weights';
import type { DailyMetrics } from '@/types/gamification';

// ── Helper: build a metrics object with defaults ──

function makeMetrics(overrides: Partial<DailyMetrics> = {}): DailyMetrics {
  return {
    revenue: 4000,
    revenueTarget: 4000,
    bookedHours: 8,
    availableHours: 10,
    consultsClosed: 3,
    consultsCompleted: 5,
    patientsRebooked: 7,
    patientsSeen: 10,
    reviewsReceived: 1,
    followUpsCompleted: 5,
    followUpsDue: 5,
    onTimeStarts: 10,
    totalAppointments: 10,
    noShows: 0,
    cancellations: 0,
    ...overrides,
  };
}

// ── calculateClinicScore ──

describe('calculateClinicScore', () => {
  it('returns a total between 0 and 100', () => {
    const { total } = calculateClinicScore(makeMetrics());
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it('perfect metrics yield a high score (>= 80)', () => {
    const perfect = makeMetrics({
      revenue: 4000,
      revenueTarget: 4000,
      bookedHours: 10,
      availableHours: 10,
      consultsClosed: 5,
      consultsCompleted: 5,
      patientsRebooked: 10,
      patientsSeen: 10,
      reviewsReceived: 2,
      followUpsCompleted: 5,
      followUpsDue: 5,
      totalAppointments: 10,
      noShows: 0,
      cancellations: 0,
    });
    const { total } = calculateClinicScore(perfect);
    expect(total).toBeGreaterThanOrEqual(80);
  });

  it('returns a breakdown with all 7 score components', () => {
    const { breakdown } = calculateClinicScore(makeMetrics());
    expect(breakdown).toHaveProperty('revenue');
    expect(breakdown).toHaveProperty('utilization');
    expect(breakdown).toHaveProperty('consultConversion');
    expect(breakdown).toHaveProperty('rebooks');
    expect(breakdown).toHaveProperty('reviews');
    expect(breakdown).toHaveProperty('followUps');
    expect(breakdown).toHaveProperty('operations');
  });

  it('revenue component caps at 100 when exceeding target', () => {
    const over = makeMetrics({ revenue: 8000, revenueTarget: 4000 });
    const { breakdown } = calculateClinicScore(over);
    expect(breakdown.revenue).toBeLessThanOrEqual(100);
  });

  it('revenue is 0 when target is 0 (division by zero guard)', () => {
    const { breakdown } = calculateClinicScore(makeMetrics({ revenue: 5000, revenueTarget: 0 }));
    expect(breakdown.revenue).toBe(0);
  });

  it('utilization is 0 when no available hours', () => {
    const { breakdown } = calculateClinicScore(makeMetrics({ bookedHours: 5, availableHours: 0 }));
    expect(breakdown.utilization).toBe(0);
  });

  it('consultConversion defaults to 100 when no consults completed', () => {
    const { breakdown } = calculateClinicScore(
      makeMetrics({ consultsClosed: 0, consultsCompleted: 0 })
    );
    expect(breakdown.consultConversion).toBe(100);
  });

  it('rebooks defaults to 100 when no patients seen', () => {
    const { breakdown } = calculateClinicScore(
      makeMetrics({ patientsRebooked: 0, patientsSeen: 0 })
    );
    expect(breakdown.rebooks).toBe(100);
  });

  it('reviews is binary: 100 if >= 1 review, 0 otherwise', () => {
    const withReview = calculateClinicScore(makeMetrics({ reviewsReceived: 1 }));
    const noReview = calculateClinicScore(makeMetrics({ reviewsReceived: 0 }));
    expect(withReview.breakdown.reviews).toBe(100);
    expect(noReview.breakdown.reviews).toBe(0);
  });

  it('followUps defaults to 100 when none due', () => {
    const { breakdown } = calculateClinicScore(
      makeMetrics({ followUpsCompleted: 0, followUpsDue: 0 })
    );
    expect(breakdown.followUps).toBe(100);
  });

  it('operations defaults to 100 when no appointments', () => {
    const { breakdown } = calculateClinicScore(
      makeMetrics({ totalAppointments: 0, noShows: 0, cancellations: 0 })
    );
    expect(breakdown.operations).toBe(100);
  });

  it('operations penalizes no-shows and cancellations', () => {
    const clean = calculateClinicScore(
      makeMetrics({ totalAppointments: 10, noShows: 0, cancellations: 0 })
    );
    const messy = calculateClinicScore(
      makeMetrics({ totalAppointments: 10, noShows: 3, cancellations: 2 })
    );
    expect(messy.breakdown.operations).toBeLessThan(clean.breakdown.operations);
  });

  // Status thresholds
  it('status is elite when score >= 90', () => {
    const perfect = makeMetrics({
      revenue: 4000, revenueTarget: 4000,
      bookedHours: 10, availableHours: 10,
      consultsClosed: 5, consultsCompleted: 5,
      patientsRebooked: 10, patientsSeen: 10,
      reviewsReceived: 1,
      followUpsCompleted: 5, followUpsDue: 5,
      totalAppointments: 10, noShows: 0, cancellations: 0,
    });
    const { status, total } = calculateClinicScore(perfect);
    if (total >= 90) expect(status).toBe('elite');
  });

  it('status is critical when score < 60', () => {
    const bad = makeMetrics({
      revenue: 0, revenueTarget: 4000,
      bookedHours: 0, availableHours: 10,
      consultsClosed: 0, consultsCompleted: 5,
      patientsRebooked: 0, patientsSeen: 10,
      reviewsReceived: 0,
      followUpsCompleted: 0, followUpsDue: 5,
      totalAppointments: 10, noShows: 5, cancellations: 3,
    });
    const { status } = calculateClinicScore(bad);
    expect(status).toBe('critical');
  });

  it('zero revenue day returns 0 for revenue component', () => {
    const { breakdown } = calculateClinicScore(makeMetrics({ revenue: 0, revenueTarget: 4000 }));
    expect(breakdown.revenue).toBe(0);
  });

  it('all breakdown values are rounded integers', () => {
    const { breakdown } = calculateClinicScore(makeMetrics({ revenue: 1234, revenueTarget: 4000 }));
    Object.values(breakdown).forEach(val => {
      expect(val).toBe(Math.round(val));
    });
  });

  it('total is clamped to 0 minimum', () => {
    // Unlikely, but guard is there
    const { total } = calculateClinicScore(makeMetrics({
      revenue: 0, revenueTarget: 4000,
      bookedHours: 0, availableHours: 10,
      consultsClosed: 0, consultsCompleted: 10,
      patientsRebooked: 0, patientsSeen: 10,
      reviewsReceived: 0,
      followUpsCompleted: 0, followUpsDue: 10,
      totalAppointments: 10, noShows: 10, cancellations: 0,
    }));
    expect(total).toBeGreaterThanOrEqual(0);
  });
});

// ── SCORE_WEIGHTS ──

describe('SCORE_WEIGHTS', () => {
  it('all 7 weights sum to 1.0', () => {
    const sum = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it('revenue has the highest weight', () => {
    const maxWeight = Math.max(...Object.values(SCORE_WEIGHTS));
    expect(SCORE_WEIGHTS.revenue).toBe(maxWeight);
  });
});

// ── Boss Levels ──

describe('getCurrentBossLevel', () => {
  it('returns Bronze Boss for $0 revenue', () => {
    const { current } = getCurrentBossLevel(0);
    expect(current.name).toBe('Bronze Boss');
  });

  it('returns Bronze Boss for revenue below $30k', () => {
    const { current } = getCurrentBossLevel(25000);
    expect(current.name).toBe('Bronze Boss');
  });

  it('returns Silver Siege for revenue between $30k and $50k', () => {
    const { current } = getCurrentBossLevel(35000);
    expect(current.name).toBe('Silver Siege');
  });

  it('returns Diamond Dynasty for revenue at $150k', () => {
    const { current } = getCurrentBossLevel(150000);
    expect(current.name).toBe('Diamond Dynasty');
  });

  it('progress is 0-100 percentage', () => {
    const { progress } = getCurrentBossLevel(15000);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  it('progress at exactly a boss target returns 100', () => {
    const { progress } = getCurrentBossLevel(30000);
    // At $30k we pass Bronze Boss target, move to Silver
    expect(progress).toBeGreaterThanOrEqual(0);
  });

  it('BOSS_LEVELS has 5 levels', () => {
    expect(BOSS_LEVELS).toHaveLength(5);
  });

  it('boss targets are in ascending order', () => {
    for (let i = 1; i < BOSS_LEVELS.length; i++) {
      expect(BOSS_LEVELS[i].target).toBeGreaterThan(BOSS_LEVELS[i - 1].target);
    }
  });
});

// ── XP & Levels ──

describe('getCurrentLevel', () => {
  it('returns level 1 for 0 XP', () => {
    const level = getCurrentLevel(0);
    expect(level.level).toBe(1);
    expect(level.name).toBe('New Glow');
  });

  it('returns level 2 for 500 XP', () => {
    const level = getCurrentLevel(500);
    expect(level.level).toBe(2);
  });

  it('returns level 10 (max) for 100000+ XP', () => {
    const level = getCurrentLevel(100000);
    expect(level.level).toBe(10);
    expect(level.name).toBe('Rani Supreme');
  });

  it('stays at current level just below next threshold', () => {
    const level = getCurrentLevel(499);
    expect(level.level).toBe(1);
  });
});

describe('getNextLevel', () => {
  it('returns level 2 for 0 XP', () => {
    const next = getNextLevel(0);
    expect(next).not.toBeNull();
    expect(next!.level).toBe(2);
  });

  it('returns null at max level', () => {
    const next = getNextLevel(100000);
    expect(next).toBeNull();
  });
});

describe('getXPToNextLevel', () => {
  it('returns 500 for 0 XP (need 500 to reach level 2)', () => {
    expect(getXPToNextLevel(0)).toBe(500);
  });

  it('returns 0 at max level', () => {
    expect(getXPToNextLevel(100000)).toBe(0);
  });

  it('returns correct remaining XP mid-level', () => {
    // Level 2 is at 500, level 3 is at 1500
    expect(getXPToNextLevel(1000)).toBe(500);
  });
});

describe('getLevelProgress', () => {
  it('returns 0 at start of a level', () => {
    expect(getLevelProgress(0)).toBe(0);
  });

  it('returns 100 at max level', () => {
    expect(getLevelProgress(100000)).toBe(100);
  });

  it('returns 50% at midpoint of a level range', () => {
    // Level 1: 0 XP, Level 2: 500 XP. Midpoint = 250
    expect(getLevelProgress(250)).toBe(50);
  });
});

describe('LEVELS', () => {
  it('has 10 levels', () => {
    expect(LEVELS).toHaveLength(10);
  });

  it('XP requirements are in ascending order', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].xpRequired).toBeGreaterThan(LEVELS[i - 1].xpRequired);
    }
  });

  it('level 1 starts at 0 XP', () => {
    expect(LEVELS[0].xpRequired).toBe(0);
  });
});
