import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/tenant/env', () => ({
  env: {
    AIRTABLE_BASE_ID: 'appRenton123',
    AIRTABLE_PAT: 'pat-renton-456',
  },
}));

import {
  DEFAULT_TENANT_CONFIG,
  DEFAULT_TENANT_ID,
  TIER_PRICING,
  TIER_FEATURES,
  TIER_USAGE_LIMITS,
  isValidSlug,
  isFeatureEnabled,
  getTierForFeature,
  canUpgrade,
} from '@/lib/tenant/config';

describe('tenant/config', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  it('builds the default tenant config from env-backed Airtable settings', () => {
    expect(DEFAULT_TENANT_ID).toBe('rani-beauty-clinic');
    expect(DEFAULT_TENANT_CONFIG.airtable).toEqual({
      baseId: 'appRenton123',
      pat: 'pat-renton-456',
    });
    expect(DEFAULT_TENANT_CONFIG.branding.clinicName).toBe('Rani Beauty Clinic');
    expect(DEFAULT_TENANT_CONFIG.features).toEqual(TIER_FEATURES.enterprise);
  });

  it('defines pricing and usage limits for each subscription tier', () => {
    expect(TIER_PRICING.starter.monthly).toBe(199);
    expect(TIER_PRICING.professional.monthly).toBe(499);
    expect(TIER_USAGE_LIMITS.enterprise.maxApiCalls).toBe(1_000_000);
  });

  it('validates slugs and blocks reserved names', () => {
    expect(isValidSlug('lux-medspa-1')).toBe(true);
    expect(isValidSlug('api')).toBe(false);
    expect(isValidSlug('BadSlug')).toBe(false);
    expect(isValidSlug('-leading')).toBe(false);
  });

  it('enables features only for active or trialing active tenants', () => {
    expect(isFeatureEnabled(DEFAULT_TENANT_CONFIG, 'phone')).toBe(true);
    expect(
      isFeatureEnabled(
        {
          ...DEFAULT_TENANT_CONFIG,
          active: false,
        },
        'phone'
      )
    ).toBe(false);
    expect(
      isFeatureEnabled(
        {
          ...DEFAULT_TENANT_CONFIG,
          subscription: {
            ...DEFAULT_TENANT_CONFIG.subscription,
            status: 'past_due',
          },
        },
        'phone'
      )
    ).toBe(false);
  });

  it('reports the minimum tier needed for a feature', () => {
    expect(getTierForFeature('schedule')).toBe('starter');
    expect(getTierForFeature('pricing')).toBe('professional');
    expect(getTierForFeature('phone')).toBe('enterprise');
  });

  it('returns the next upgrade tier or null at the top tier', () => {
    expect(canUpgrade('starter')).toBe('professional');
    expect(canUpgrade('professional')).toBe('enterprise');
    expect(canUpgrade('enterprise')).toBeNull();
  });
});
