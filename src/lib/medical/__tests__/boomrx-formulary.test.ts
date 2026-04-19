import { describe, expect, it } from 'vitest';

import {
  BOOMRX_FORMULARY_ITEMS,
  getBoomRxFormularyStats,
  searchBoomRxFormulary,
} from '@/lib/medical/boomrx-formulary';

describe('boomrx-formulary', () => {
  it('loads and normalizes BoomRx formulary lines', () => {
    const stats = getBoomRxFormularyStats();

    expect(stats.pages).toBe(6);
    expect(stats.itemCount).toBeGreaterThan(250);
    expect(BOOMRX_FORMULARY_ITEMS.every((item) => item.suggestedRetail >= 25)).toBe(true);
  });

  it('classifies core categories and calculates positive margin', () => {
    const semaglutide = searchBoomRxFormulary('semaglutide', 1)[0];

    expect(semaglutide).toBeDefined();
    expect(semaglutide?.category).toBe('glp1');
    expect(semaglutide?.suggestedMarginPercent ?? 0).toBeGreaterThan(30);
  });
});

