import { describe, it, expect } from 'vitest';
import { BOOMRX_FORMULARY_ITEMS } from '../boomrx-formulary';

describe('BoomRx formulary integrity', () => {
  it('has no labels containing an embedded $', () => {
    const violations = BOOMRX_FORMULARY_ITEMS.filter((item) => item.label.includes('$'));
    expect(violations.map((v) => v.label.slice(0, 120))).toEqual([]);
  });

  it('every entry has a positive numeric unitCost and suggestedRetail', () => {
    for (const item of BOOMRX_FORMULARY_ITEMS) {
      expect(item.unitCost).toBeGreaterThan(0);
      expect(item.suggestedRetail).toBeGreaterThan(0);
    }
  });

  it('every entry has a non-empty trimmed label', () => {
    for (const item of BOOMRX_FORMULARY_ITEMS) {
      expect(item.label.trim().length).toBeGreaterThan(0);
    }
  });
});
