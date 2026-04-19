import { describe, expect, it } from 'vitest';

import { recommendBoomRxBySymptoms } from '@/lib/medical/symptom-product-matrix';

describe('symptom-product-matrix', () => {
  it('returns weighted GLP-1 recommendations for weight-loss symptoms', () => {
    const result = recommendBoomRxBySymptoms({
      symptoms: ['difficulty-losing-weight', 'food-noise-cravings'],
      goals: ['I want faster fat loss'],
      requestedTrack: 'glp1',
      limit: 6,
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.some((entry) => entry.item.category === 'glp1')).toBe(true);
    expect(result.projectedMonthlyGrossProfit).toBeGreaterThan(0);
  });

  it('returns hormone and sexual-health options for libido/hormone symptoms', () => {
    const result = recommendBoomRxBySymptoms({
      symptoms: ['low-libido-sexual-dysfunction', 'perimenopause-menopause'],
      goals: ['rebalance hormones'],
      requestedTrack: 'hormones',
      limit: 6,
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(
      result.recommendations.some(
        (entry) => entry.item.category === 'hormone' || entry.item.category === 'sexual-health'
      )
    ).toBe(true);
    expect(result.averageMarginPercent).toBeGreaterThan(20);
  });
});

