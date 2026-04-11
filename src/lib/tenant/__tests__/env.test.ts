// @vitest-environment node
/**
 * Unit tests for tenant env config helpers.
 *
 * Critical invariant: when NO env var is set, every getter must return
 * the same values that were previously hardcoded in middleware.ts and
 * resolver.ts. Tests, local dev, and existing prod deployments must
 * all stay green after the refactor without any env changes.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getPlatformDomains,
  getDefaultTenantId,
  getDefaultHostname,
  getCorsAllowedOrigins,
} from '../env';

const ENV_KEYS = [
  'PLATFORM_DOMAINS',
  'DEFAULT_TENANT_ID',
  'DEFAULT_HOSTNAME',
  'CORS_ALLOWED_ORIGINS',
  'NODE_ENV',
] as const;

describe('tenant/env helpers', () => {
  const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = savedEnv[k];
      }
    }
  });

  describe('getPlatformDomains', () => {
    it('returns the legacy hardcoded default when PLATFORM_DOMAINS is unset', () => {
      expect(getPlatformDomains()).toEqual(['ranios.com', 'ranios.dev', 'localhost']);
    });

    it('parses a comma-separated env override', () => {
      process.env.PLATFORM_DOMAINS = 'acme.com, beta.com ,gamma.test';
      expect(getPlatformDomains()).toEqual(['acme.com', 'beta.com', 'gamma.test']);
    });

    it('falls back to the default when override is empty string', () => {
      process.env.PLATFORM_DOMAINS = '';
      expect(getPlatformDomains()).toEqual(['ranios.com', 'ranios.dev', 'localhost']);
    });

    it('falls back to the default when override is only whitespace/commas', () => {
      process.env.PLATFORM_DOMAINS = ' , , ';
      expect(getPlatformDomains()).toEqual(['ranios.com', 'ranios.dev', 'localhost']);
    });

    it('accepts a single-entry override', () => {
      process.env.PLATFORM_DOMAINS = 'solo.local';
      expect(getPlatformDomains()).toEqual(['solo.local']);
    });
  });

  describe('getDefaultTenantId', () => {
    it('returns rani-beauty-clinic by default', () => {
      expect(getDefaultTenantId()).toBe('rani-beauty-clinic');
    });

    it('respects an env override', () => {
      process.env.DEFAULT_TENANT_ID = 'acme-medspa';
      expect(getDefaultTenantId()).toBe('acme-medspa');
    });

    it('trims whitespace', () => {
      process.env.DEFAULT_TENANT_ID = '  acme-medspa  ';
      expect(getDefaultTenantId()).toBe('acme-medspa');
    });

    it('falls back to default when override is empty/whitespace', () => {
      process.env.DEFAULT_TENANT_ID = '   ';
      expect(getDefaultTenantId()).toBe('rani-beauty-clinic');
    });
  });

  describe('getDefaultHostname', () => {
    it('returns localhost:3000 by default', () => {
      expect(getDefaultHostname()).toBe('localhost:3000');
    });

    it('respects an env override', () => {
      process.env.DEFAULT_HOSTNAME = 'ranibeautyclinic.com';
      expect(getDefaultHostname()).toBe('ranibeautyclinic.com');
    });

    it('falls back to default when override is empty', () => {
      process.env.DEFAULT_HOSTNAME = '';
      expect(getDefaultHostname()).toBe('localhost:3000');
    });
  });

  describe('getCorsAllowedOrigins', () => {
    it('returns the legacy hardcoded default when CORS_ALLOWED_ORIGINS is unset and not in dev', () => {
      process.env.NODE_ENV = 'production';
      expect(getCorsAllowedOrigins()).toEqual([
        'https://ranibeautyclinic.com',
        'https://www.ranibeautyclinic.com',
        'https://ranios.com',
        'https://ranios.dev',
      ]);
    });

    it('appends localhost origins when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      const origins = getCorsAllowedOrigins();
      expect(origins).toContain('https://ranibeautyclinic.com');
      expect(origins).toContain('http://localhost:3000');
      expect(origins).toContain('http://localhost:3001');
    });

    it('respects a CORS_ALLOWED_ORIGINS env override and still appends dev origins in dev', () => {
      process.env.NODE_ENV = 'development';
      process.env.CORS_ALLOWED_ORIGINS = 'https://acme.com,https://beta.acme.com';
      const origins = getCorsAllowedOrigins();
      expect(origins).toContain('https://acme.com');
      expect(origins).toContain('https://beta.acme.com');
      // Dev origins still appended
      expect(origins).toContain('http://localhost:3000');
      expect(origins).toContain('http://localhost:3001');
    });

    it('does not append dev origins in production even with override', () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ALLOWED_ORIGINS = 'https://acme.com';
      expect(getCorsAllowedOrigins()).toEqual(['https://acme.com']);
    });

    it('does not duplicate dev origins if they are already in the override', () => {
      process.env.NODE_ENV = 'development';
      process.env.CORS_ALLOWED_ORIGINS = 'https://acme.com,http://localhost:3000';
      const origins = getCorsAllowedOrigins();
      const count3000 = origins.filter((o) => o === 'http://localhost:3000').length;
      expect(count3000).toBe(1);
    });
  });
});
