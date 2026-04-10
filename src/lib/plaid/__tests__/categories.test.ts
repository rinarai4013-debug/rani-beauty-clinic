import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CATEGORY_MAPPINGS,
  categorizeTransaction,
  CATEGORY_LABELS,
} from '@/lib/plaid/categories';

describe('plaid/categories', () => {
  it('includes the default category mapping rules', () => {
    expect(DEFAULT_CATEGORY_MAPPINGS.length).toBeGreaterThan(5);
  });

  it('categorizes Meta and Google ad spend as ad-spend', () => {
    expect(
      categorizeTransaction('META ADS 0426', null, null)
    ).toBe('ad-spend');
    expect(
      categorizeTransaction('GOOGLE ADS', null, null)
    ).toBe('ad-spend');
  });

  it('categorizes software vendors including Twilio as software', () => {
    expect(
      categorizeTransaction('TWILIO MESSAGE BILLING', null, null)
    ).toBe('software');
  });

  it('categorizes payroll using Plaid primary categories', () => {
    expect(
      categorizeTransaction('Weekly payroll', null, {
        primary: 'PAYROLL',
        detailed: 'PAYROLL_WAGES',
      })
    ).toBe('payroll');
  });

  it('categorizes insurance merchants as insurance', () => {
    expect(
      categorizeTransaction('HISCOX BUSINESS POLICY', null, null)
    ).toBe('insurance');
  });

  it('falls back to other when no mapping matches', () => {
    expect(
      categorizeTransaction('LOCAL FLOWER SHOP', null, null)
    ).toBe('other');
  });

  it('exposes human-readable labels for every Rani category', () => {
    expect(CATEGORY_LABELS['ad-spend']).toBe('Ad Spend (Meta + Google)');
    expect(CATEGORY_LABELS.software).toBe('Software & Tools');
    expect(CATEGORY_LABELS.other).toBe('Other');
  });
});
