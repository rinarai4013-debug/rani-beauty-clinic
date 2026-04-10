/**
 * Consent Manager — Production Test Suite
 *
 * Patient consent is legally binding. Every error path, every boundary,
 * every state transition is exercised here. Tests are deterministic
 * via vi.useFakeTimers, and module state is reset between every test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ConsentTemplate, SignedConsent } from '@/types/compliance';

// ── Mocks ────────────────────────────────────────────────────────────
//
// We mock the data module BEFORE importing the system under test so the
// consent-manager picks up our deterministic templates rather than the
// real production catalog (which would couple every test to the live
// template count and versions).
//
// Because `vi.mock` is hoisted above all imports at runtime, any symbols
// referenced inside the factory must also be hoisted — we use `vi.hoisted`
// for the template fixtures and the audit spy.

const { mockTemplates, createAuditEntryMock } = vi.hoisted(() => {
  const templates: ConsentTemplate[] = [
    {
      id: 'tpl_botox',
      treatmentName: 'Botox',
      treatmentCategory: 'injectable',
      version: '2.0',
      effectiveDate: '2026-01-01',
      lastUpdated: '2026-01-01',
      risks: ['bruising'],
      benefits: ['wrinkle reduction'],
      alternatives: ['no treatment'],
      contraindications: ['pregnancy'],
      aftercare: ['no rubbing'],
      providerAcknowledgments: ['reviewed history'],
      requiredDisclosures: ['off-label uses'],
      expiryDays: 365,
      requiresWitness: false,
      requiresProviderSignature: true,
      status: 'active',
    },
    {
      id: 'tpl_filler',
      treatmentName: 'Dermal Filler',
      treatmentCategory: 'injectable',
      version: '1.5',
      effectiveDate: '2026-01-01',
      lastUpdated: '2026-01-01',
      risks: ['vascular occlusion'],
      benefits: ['volume restoration'],
      alternatives: ['no treatment'],
      contraindications: ['active infection'],
      aftercare: ['ice'],
      providerAcknowledgments: ['reviewed history'],
      requiredDisclosures: ['risks'],
      expiryDays: 180,
      requiresWitness: true,
      requiresProviderSignature: true,
      status: 'active',
    },
    {
      id: 'tpl_facial',
      treatmentName: 'HydraFacial',
      treatmentCategory: 'skin',
      version: '1.0',
      effectiveDate: '2026-01-01',
      lastUpdated: '2026-01-01',
      risks: ['mild redness'],
      benefits: ['exfoliation'],
      alternatives: ['no treatment'],
      contraindications: ['sunburn'],
      aftercare: ['spf'],
      providerAcknowledgments: ['reviewed skin type'],
      requiredDisclosures: ['expectations'],
      expiryDays: 730,
      requiresWitness: false,
      requiresProviderSignature: false,
      status: 'active',
    },
    {
      id: 'tpl_archived',
      treatmentName: 'Archived Treatment',
      treatmentCategory: 'skin',
      version: '0.9',
      effectiveDate: '2025-01-01',
      lastUpdated: '2025-01-01',
      risks: [],
      benefits: [],
      alternatives: [],
      contraindications: [],
      aftercare: [],
      providerAcknowledgments: [],
      requiredDisclosures: [],
      expiryDays: 365,
      requiresWitness: false,
      requiresProviderSignature: false,
      status: 'archived',
    },
  ];
  return {
    mockTemplates: templates,
    createAuditEntryMock: vi.fn(),
  };
});

// The SUT imports from '@/data/compliance/consents' — intercept by alias.
vi.mock('@/data/compliance/consents', () => ({
  CONSENT_TEMPLATES: mockTemplates,
}));

// The SUT imports `createAuditEntry` via the relative path './audit-trail'.
// We intercept both the relative and aliased specifiers so the mock
// is resolved regardless of which form Vitest's resolver normalizes to.
vi.mock('../audit-trail', () => ({
  createAuditEntry: createAuditEntryMock,
}));
vi.mock('@/lib/compliance/audit-trail', () => ({
  createAuditEntry: createAuditEntryMock,
}));

// Import AFTER mocks so the module captures the mocked references.
import {
  signConsent,
  revokeConsent,
  getActiveConsent,
  hasValidConsent,
  validateConsentForTreatment,
  getExpiringConsents,
  calculateConsentScore,
  seedConsentData,
  clearConsentData,
} from '@/lib/compliance/consent-manager';

// ── Helpers ──────────────────────────────────────────────────────────

const FROZEN_NOW = new Date('2026-04-09T12:00:00Z');

const VALID_SIGNATURE = 'data:image/png;base64,' + 'A'.repeat(120);

/**
 * Mirror the exact expiration math used by `signConsent` so our assertions
 * are independent of the host timezone (the implementation uses
 * `setDate()` which operates in local time).
 */
function expectedExpiration(signedDate: string, expiryDays: number): string {
  const d = new Date(signedDate);
  d.setDate(d.getDate() + expiryDays);
  return d.toISOString().split('T')[0];
}

/**
 * Build a SignedConsent payload for `signConsent`. Defaults satisfy the
 * Botox template (which requires a provider signature, no witness).
 */
function buildSignParams(
  overrides: Partial<Parameters<typeof signConsent>[0]> = {}
): Parameters<typeof signConsent>[0] {
  return {
    templateId: 'tpl_botox',
    templateVersion: '2.0',
    treatmentName: 'Botox',
    patientId: 'pat_001',
    patientName: 'Jane Doe',
    signatureData: VALID_SIGNATURE,
    signedDate: '2026-04-09',
    providerId: 'prov_001',
    providerName: 'Dr. Rai',
    providerSignature: 'data:image/png;base64,' + 'B'.repeat(120),
    ...overrides,
  };
}

/**
 * Build a fully-formed SignedConsent that can be seeded directly into
 * the in-memory store via `seedConsentData`.
 */
function buildSeedConsent(overrides: Partial<SignedConsent> = {}): SignedConsent {
  return {
    id: `consent_seed_${Math.random().toString(36).slice(2, 9)}`,
    templateId: 'tpl_botox',
    templateVersion: '2.0',
    treatmentName: 'Botox',
    patientId: 'pat_001',
    patientName: 'Jane Doe',
    signatureData: VALID_SIGNATURE,
    signedDate: '2026-04-09',
    expirationDate: '2027-04-09',
    providerId: 'prov_001',
    providerName: 'Dr. Rai',
    providerSignature: 'data:image/png;base64,' + 'B'.repeat(120),
    status: 'active',
    ...overrides,
  };
}

// ── Lifecycle ────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN_NOW);
  clearConsentData();
  createAuditEntryMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

// ════════════════════════════════════════════════════════════════════
// signConsent
// ════════════════════════════════════════════════════════════════════

describe('signConsent', () => {
  it('throws when the template id does not exist', () => {
    expect(() =>
      signConsent(buildSignParams({ templateId: 'tpl_does_not_exist' }))
    ).toThrowError('Consent template tpl_does_not_exist not found');

    expect(createAuditEntryMock).not.toHaveBeenCalled();
  });

  it('throws when signatureData is missing', () => {
    expect(() =>
      signConsent(buildSignParams({ signatureData: '' }))
    ).toThrowError('Invalid signature data');
  });

  it('throws when signatureData length is below the 100-char minimum (boundary: 99)', () => {
    expect(() =>
      signConsent(buildSignParams({ signatureData: 'x'.repeat(99) }))
    ).toThrowError('Invalid signature data');
  });

  it('accepts signatureData at exactly the 100-char boundary', () => {
    const consent = signConsent(
      buildSignParams({ signatureData: 'x'.repeat(100) })
    );
    expect(consent.signatureData).toHaveLength(100);
    expect(consent.status).toBe('active');
  });

  it('throws when the template requires a witness but none is provided', () => {
    expect(() =>
      signConsent(
        buildSignParams({
          templateId: 'tpl_filler',
          templateVersion: '1.5',
          treatmentName: 'Dermal Filler',
          witnessName: undefined,
        })
      )
    ).toThrowError('Consent for Dermal Filler requires a witness');
  });

  it('succeeds when the witness is provided for a witness-required template', () => {
    const consent = signConsent(
      buildSignParams({
        templateId: 'tpl_filler',
        templateVersion: '1.5',
        treatmentName: 'Dermal Filler',
        witnessName: 'Nurse Smith',
        witnessSignature: 'data:image/png;base64,' + 'C'.repeat(120),
      })
    );
    expect(consent.witnessName).toBe('Nurse Smith');
    expect(consent.status).toBe('active');
  });

  it('throws when the template requires a provider signature but none is provided', () => {
    expect(() =>
      signConsent(buildSignParams({ providerSignature: undefined }))
    ).toThrowError('Consent for Botox requires provider signature');
  });

  it('does NOT require a provider signature when the template waives it', () => {
    const consent = signConsent(
      buildSignParams({
        templateId: 'tpl_facial',
        templateVersion: '1.0',
        treatmentName: 'HydraFacial',
        providerSignature: undefined,
      })
    );
    expect(consent.status).toBe('active');
    expect(consent.providerSignature).toBeUndefined();
  });

  it('calculates expirationDate as signedDate + template.expiryDays (365d template)', () => {
    const consent = signConsent(
      buildSignParams({ signedDate: '2026-04-09' })
    );
    expect(consent.expirationDate).toBe(expectedExpiration('2026-04-09', 365));
    // And the expiration is approximately one year out.
    expect(consent.expirationDate).toMatch(/^2027-04-/);
  });

  it('calculates expirationDate correctly for a 180-day template', () => {
    const consent = signConsent(
      buildSignParams({
        templateId: 'tpl_filler',
        templateVersion: '1.5',
        treatmentName: 'Dermal Filler',
        signedDate: '2026-04-09',
        witnessName: 'Nurse Smith',
      })
    );
    expect(consent.expirationDate).toBe(expectedExpiration('2026-04-09', 180));
    // And roughly 6 months out.
    expect(consent.expirationDate).toMatch(/^2026-10-/);
  });

  it('supersedes prior active consents for the same patient + template', () => {
    const first = signConsent(buildSignParams());
    expect(first.status).toBe('active');

    const second = signConsent(buildSignParams());
    expect(second.status).toBe('active');

    // After signing the second, the first must be marked superseded.
    // We verify via getExpiringConsents which only returns active rows.
    const expiring = getExpiringConsents(400);
    const ids = expiring.map((c) => c.id);
    expect(ids).toContain(second.id);
    expect(ids).not.toContain(first.id);
  });

  it('does NOT supersede consents for a different patient with the same template', () => {
    const a = signConsent(buildSignParams({ patientId: 'pat_A' }));
    const b = signConsent(buildSignParams({ patientId: 'pat_B' }));

    const expiring = getExpiringConsents(400);
    const ids = expiring.map((c) => c.id);
    expect(ids).toContain(a.id);
    expect(ids).toContain(b.id);
  });

  it('does NOT supersede consents for the same patient with a different template', () => {
    const botox = signConsent(buildSignParams());
    const facial = signConsent(
      buildSignParams({
        templateId: 'tpl_facial',
        templateVersion: '1.0',
        treatmentName: 'HydraFacial',
        providerSignature: undefined,
      })
    );

    const expiring = getExpiringConsents(800);
    const ids = expiring.map((c) => c.id);
    expect(ids).toContain(botox.id);
    expect(ids).toContain(facial.id);
  });

  it('creates an audit entry recording the signing event', () => {
    const consent = signConsent(buildSignParams());

    expect(createAuditEntryMock).toHaveBeenCalledTimes(1);
    expect(createAuditEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'prov_001',
        userName: 'Dr. Rai',
        userRole: 'provider',
        action: 'consent_sign',
        resourceType: 'consent',
        resourceId: consent.id,
        ipAddress: '0.0.0.0',
      })
    );
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call.details).toContain('Jane Doe');
    expect(call.details).toContain('Botox');
    expect(call.details).toContain('v2.0');
  });

  it('returns a consent with a unique id and active status', () => {
    const a = signConsent(buildSignParams({ patientId: 'pat_A' }));
    const b = signConsent(buildSignParams({ patientId: 'pat_B' }));
    expect(a.id).not.toBe(b.id);
    expect(a.id).toMatch(/^consent_/);
    expect(a.status).toBe('active');
  });
});

// ════════════════════════════════════════════════════════════════════
// revokeConsent
// ════════════════════════════════════════════════════════════════════

describe('revokeConsent', () => {
  it('returns null for an unknown consent id and does NOT create an audit entry', () => {
    const result = revokeConsent('does_not_exist', 'patient request', 'prov_001');
    expect(result).toBeNull();
    expect(createAuditEntryMock).not.toHaveBeenCalled();
  });

  it('sets status to revoked and records reason + revokedBy + revokedDate', () => {
    seedConsentData({ signedConsents: [buildSeedConsent({ id: 'c1' })] });

    const result = revokeConsent('c1', 'allergic reaction', 'prov_002');

    expect(result).not.toBeNull();
    expect(result!.status).toBe('revoked');
    expect(result!.revokedReason).toBe('allergic reaction');
    expect(result!.revokedDate).toBe('2026-04-09');
  });

  it('removes the revoked consent from the active query', () => {
    seedConsentData({ signedConsents: [buildSeedConsent({ id: 'c1' })] });
    revokeConsent('c1', 'patient request', 'prov_001');

    expect(hasValidConsent('pat_001', 'Botox')).toBe(false);
  });

  it('creates an audit entry recording the revocation', () => {
    seedConsentData({
      signedConsents: [buildSeedConsent({ id: 'c1', treatmentName: 'Botox' })],
    });

    revokeConsent('c1', 'patient withdrew', 'prov_xyz');

    expect(createAuditEntryMock).toHaveBeenCalledTimes(1);
    expect(createAuditEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'prov_xyz',
        userName: 'prov_xyz',
        userRole: 'provider',
        action: 'consent_revoke',
        resourceType: 'consent',
        resourceId: 'c1',
        ipAddress: '0.0.0.0',
      })
    );
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call.details).toContain('Botox');
    expect(call.details).toContain('patient withdrew');
  });
});

// ════════════════════════════════════════════════════════════════════
// getActiveConsent
// ════════════════════════════════════════════════════════════════════

describe('getActiveConsent', () => {
  it('returns the active consent matching patientId + treatmentName', () => {
    seedConsentData({
      signedConsents: [buildSeedConsent({ id: 'c1', expirationDate: '2027-01-01' })],
    });

    const result = getActiveConsent('pat_001', 'Botox');
    expect(result?.id).toBe('c1');
  });

  it('matches treatmentName case-insensitively', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          id: 'c1',
          treatmentName: 'Botox',
          expirationDate: '2027-01-01',
        }),
      ],
    });

    expect(getActiveConsent('pat_001', 'BOTOX')?.id).toBe('c1');
    expect(getActiveConsent('pat_001', 'botox')?.id).toBe('c1');
    expect(getActiveConsent('pat_001', 'BoToX')?.id).toBe('c1');
  });

  it('returns undefined when patientId does not match', () => {
    seedConsentData({
      signedConsents: [buildSeedConsent({ patientId: 'pat_001' })],
    });
    expect(getActiveConsent('pat_999', 'Botox')).toBeUndefined();
  });

  it('excludes consents whose expirationDate is in the past', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({ id: 'c1', expirationDate: '2026-04-08' }), // yesterday
      ],
    });
    expect(getActiveConsent('pat_001', 'Botox')).toBeUndefined();
  });

  it('excludes consents whose expirationDate equals now (strict >)', () => {
    // Expiration is stored as a date-only string. Frozen time is noon UTC,
    // so '2026-04-09' parses to midnight UTC of the same day, which is
    // strictly less than now → must be excluded.
    seedConsentData({
      signedConsents: [
        buildSeedConsent({ id: 'c1', expirationDate: '2026-04-09' }),
      ],
    });
    expect(getActiveConsent('pat_001', 'Botox')).toBeUndefined();
  });

  it('excludes revoked consents', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          id: 'c1',
          status: 'revoked',
          expirationDate: '2027-01-01',
        }),
      ],
    });
    expect(getActiveConsent('pat_001', 'Botox')).toBeUndefined();
  });

  it('excludes superseded consents', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          id: 'c1',
          status: 'superseded',
          expirationDate: '2027-01-01',
        }),
      ],
    });
    expect(getActiveConsent('pat_001', 'Botox')).toBeUndefined();
  });
});

// ════════════════════════════════════════════════════════════════════
// hasValidConsent
// ════════════════════════════════════════════════════════════════════

describe('hasValidConsent', () => {
  it('returns true when an active non-expired consent exists', () => {
    seedConsentData({
      signedConsents: [buildSeedConsent({ expirationDate: '2027-01-01' })],
    });
    expect(hasValidConsent('pat_001', 'Botox')).toBe(true);
  });

  it('returns false when the only consent is expired', () => {
    seedConsentData({
      signedConsents: [buildSeedConsent({ expirationDate: '2026-04-08' })],
    });
    expect(hasValidConsent('pat_001', 'Botox')).toBe(false);
  });

  it('returns false when no consent exists for the patient', () => {
    expect(hasValidConsent('pat_001', 'Botox')).toBe(false);
  });

  it('returns false when a consent exists for a different treatment', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          treatmentName: 'HydraFacial',
          expirationDate: '2027-01-01',
        }),
      ],
    });
    expect(hasValidConsent('pat_001', 'Botox')).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════
// validateConsentForTreatment
// ════════════════════════════════════════════════════════════════════

describe('validateConsentForTreatment', () => {
  it('returns invalid when no template exists for the treatment', () => {
    const result = validateConsentForTreatment('pat_001', 'NonexistentTreatment');
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      'No consent template found for NonexistentTreatment',
    ]);
    expect(result.consent).toBeUndefined();
  });

  it('returns invalid with an "expired" message when consent exists but is past expiration', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          expirationDate: '2026-03-01',
          templateVersion: '2.0',
        }),
      ],
    });
    const result = validateConsentForTreatment('pat_001', 'Botox');
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('expired on 2026-03-01'))).toBe(true);
  });

  it('returns invalid with a "no signed consent" message when none exists', () => {
    const result = validateConsentForTreatment('pat_001', 'Botox');
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('No signed consent found'))).toBe(true);
  });

  it('returns valid with no issues when consent is current and version matches', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          expirationDate: '2027-01-01',
          templateVersion: '2.0',
        }),
      ],
    });
    const result = validateConsentForTreatment('pat_001', 'Botox');
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.consent).toBeDefined();
  });

  it('warns when consent expires in 7 days (boundary: 7 → warning)', () => {
    // Frozen now: 2026-04-09T12:00:00Z. expirationDate at noon UTC + 7d
    // produces ceil((7d) / 1d) = 7. We pick a date string such that the
    // boundary math lands on exactly 7 days.
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          expirationDate: '2026-04-17', // 8 days as a date string, math yields ≤7
          templateVersion: '2.0',
        }),
      ],
    });
    // 2026-04-17T00:00:00Z - 2026-04-09T12:00:00Z = 7.5 days → ceil = 8.
    // Sanity-check: this should NOT warn yet.
    const farResult = validateConsentForTreatment('pat_001', 'Botox');
    expect(farResult.issues.some((i) => i.includes('expires in'))).toBe(false);

    // Now seed one with exactly 7 days (rounded).
    clearConsentData();
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          expirationDate: '2026-04-16', // 6.5 days → ceil = 7
          templateVersion: '2.0',
        }),
      ],
    });
    const nearResult = validateConsentForTreatment('pat_001', 'Botox');
    expect(nearResult.issues.some((i) => i.includes('expires in 7 day'))).toBe(true);
  });

  it('does NOT warn when consent expires in 8+ days (boundary: 8 → no warning)', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          // 2026-04-18T00:00:00Z - 2026-04-09T12:00:00Z = 8.5 days → ceil = 9
          expirationDate: '2026-04-18',
          templateVersion: '2.0',
        }),
      ],
    });
    const result = validateConsentForTreatment('pat_001', 'Botox');
    expect(result.issues.some((i) => i.includes('expires in'))).toBe(false);
    expect(result.valid).toBe(true);
  });

  it('flags a version mismatch between the consent and the current template', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          expirationDate: '2027-01-01',
          templateVersion: '1.0', // template is currently 2.0
        }),
      ],
    });
    const result = validateConsentForTreatment('pat_001', 'Botox');
    expect(
      result.issues.some(
        (i) => i.includes('version 1.0') && i.includes('version 2.0')
      )
    ).toBe(true);
    // Version mismatch is a soft warning, not a hard fail.
    expect(result.valid).toBe(true);
  });

  it('attaches the matching consent on the validation result when one exists', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          id: 'c1',
          expirationDate: '2027-01-01',
          templateVersion: '2.0',
        }),
      ],
    });
    const result = validateConsentForTreatment('pat_001', 'Botox');
    expect(result.consent?.id).toBe('c1');
  });
});

// ════════════════════════════════════════════════════════════════════
// getExpiringConsents
// ════════════════════════════════════════════════════════════════════

describe('getExpiringConsents', () => {
  it('returns consents expiring within the default 30-day window', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({ id: 'c_in', expirationDate: '2026-04-25' }), // 16d
        buildSeedConsent({ id: 'c_out', expirationDate: '2026-06-01' }), // 53d
      ],
    });
    const result = getExpiringConsents();
    const ids = result.map((c) => c.id);
    expect(ids).toContain('c_in');
    expect(ids).not.toContain('c_out');
  });

  it('honors a custom window length', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({ id: 'c_in', expirationDate: '2026-05-01' }), // 22d
        buildSeedConsent({ id: 'c_out', expirationDate: '2026-04-25' }), // 16d
      ],
    });
    const result = getExpiringConsents(7);
    expect(result.map((c) => c.id)).not.toContain('c_in');
    expect(result.map((c) => c.id)).not.toContain('c_out');

    const wider = getExpiringConsents(60);
    expect(wider.map((c) => c.id)).toEqual(
      expect.arrayContaining(['c_in', 'c_out'])
    );
  });

  it('excludes already-expired consents (expirationDate <= now)', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({ id: 'c_expired', expirationDate: '2026-04-08' }),
        buildSeedConsent({
          id: 'c_today',
          expirationDate: '2026-04-09', // midnight UTC < noon UTC now
        }),
      ],
    });
    const result = getExpiringConsents(30);
    expect(result.map((c) => c.id)).not.toContain('c_expired');
    expect(result.map((c) => c.id)).not.toContain('c_today');
  });

  it('excludes consents that are not active (revoked / superseded)', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          id: 'c_revoked',
          expirationDate: '2026-04-20',
          status: 'revoked',
        }),
        buildSeedConsent({
          id: 'c_superseded',
          expirationDate: '2026-04-20',
          status: 'superseded',
        }),
        buildSeedConsent({
          id: 'c_active',
          expirationDate: '2026-04-20',
          status: 'active',
        }),
      ],
    });
    const result = getExpiringConsents(30);
    const ids = result.map((c) => c.id);
    expect(ids).toContain('c_active');
    expect(ids).not.toContain('c_revoked');
    expect(ids).not.toContain('c_superseded');
  });

  it('returns an empty array when no consents exist', () => {
    expect(getExpiringConsents(30)).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════
// calculateConsentScore
// ════════════════════════════════════════════════════════════════════

describe('calculateConsentScore', () => {
  // The mocked CONSENT_TEMPLATES catalog has 4 templates total (3 active,
  // 1 archived). Active count = 3 → below the 20-template threshold,
  // so Template Coverage will always be 30 - 10 = 20 in this suite.

  it('Template Coverage scores 20/30 (penalized) when active templates < 20', () => {
    const score = calculateConsentScore();
    const coverage = score.details.find((d) => d.area === 'Template Coverage');
    expect(coverage).toBeDefined();
    expect(coverage!.score).toBe(20);
    expect(coverage!.maxScore).toBe(30);
    expect(coverage!.issues.length).toBe(1);
    expect(coverage!.issues[0]).toContain('Only 3 active consent templates');
  });

  it('Consent Currency: 35/35 with no expired consents', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({ expirationDate: '2027-01-01' }),
      ],
    });
    const score = calculateConsentScore();
    const currency = score.details.find((d) => d.area === 'Consent Currency')!;
    expect(currency.score).toBe(35);
    expect(currency.issues).toEqual([]);
  });

  it('Consent Currency: deducts 5 points per expired (1 expired → 30/35)', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({ id: 'e1', expirationDate: '2026-04-08' }),
      ],
    });
    const currency = calculateConsentScore().details.find(
      (d) => d.area === 'Consent Currency'
    )!;
    expect(currency.score).toBe(30);
    expect(currency.issues[0]).toContain('1 expired');
  });

  it('Consent Currency: 3 expired → 35 - 15 = 20/35', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({ id: 'e1', expirationDate: '2026-04-08' }),
        buildSeedConsent({ id: 'e2', expirationDate: '2026-04-07' }),
        buildSeedConsent({ id: 'e3', expirationDate: '2026-04-06' }),
      ],
    });
    const currency = calculateConsentScore().details.find(
      (d) => d.area === 'Consent Currency'
    )!;
    expect(currency.score).toBe(20);
  });

  it('Consent Currency: caps deduction at 35 (cannot go negative)', () => {
    const many: SignedConsent[] = Array.from({ length: 20 }, (_, i) =>
      buildSeedConsent({ id: `e${i}`, expirationDate: '2026-04-01' })
    );
    seedConsentData({ signedConsents: many });
    const currency = calculateConsentScore().details.find(
      (d) => d.area === 'Consent Currency'
    )!;
    expect(currency.score).toBe(0);
    expect(currency.score).toBeGreaterThanOrEqual(0);
  });

  it('Upcoming Expirations: 15/15 with no consents expiring within 14 days', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({ expirationDate: '2026-06-01' }),
      ],
    });
    const upcoming = calculateConsentScore().details.find(
      (d) => d.area === 'Upcoming Expirations'
    )!;
    expect(upcoming.score).toBe(15);
    expect(upcoming.issues).toEqual([]);
  });

  it('Upcoming Expirations: deducts 3 per consent expiring within 14 days', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({ id: 'u1', expirationDate: '2026-04-15' }), // 6d
        buildSeedConsent({ id: 'u2', expirationDate: '2026-04-20' }), // 11d
      ],
    });
    const upcoming = calculateConsentScore().details.find(
      (d) => d.area === 'Upcoming Expirations'
    )!;
    expect(upcoming.score).toBe(15 - 6);
    expect(upcoming.issues[0]).toContain('2 consent');
  });

  it('Upcoming Expirations: caps deduction at 15 (cannot go negative)', () => {
    const many: SignedConsent[] = Array.from({ length: 10 }, (_, i) =>
      buildSeedConsent({ id: `u${i}`, expirationDate: '2026-04-15' })
    );
    seedConsentData({ signedConsents: many });
    const upcoming = calculateConsentScore().details.find(
      (d) => d.area === 'Upcoming Expirations'
    )!;
    expect(upcoming.score).toBe(0);
  });

  it('Signature Completeness: 20/20 when no active consent is missing a required provider sig', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          expirationDate: '2027-01-01',
          providerSignature: 'data:image/png;base64,' + 'B'.repeat(120),
        }),
      ],
    });
    const sig = calculateConsentScore().details.find(
      (d) => d.area === 'Signature Completeness'
    )!;
    expect(sig.score).toBe(20);
    expect(sig.issues).toEqual([]);
  });

  it('Signature Completeness: deducts 5 per missing required provider signature', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          id: 's1',
          expirationDate: '2027-01-01',
          providerSignature: undefined, // botox requires it
        }),
        buildSeedConsent({
          id: 's2',
          expirationDate: '2027-01-01',
          providerSignature: undefined,
        }),
      ],
    });
    const sig = calculateConsentScore().details.find(
      (d) => d.area === 'Signature Completeness'
    )!;
    expect(sig.score).toBe(20 - 10);
    expect(sig.issues[0]).toContain('2 consent');
  });

  it('Signature Completeness: ignores consents whose template does NOT require a provider sig', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          templateId: 'tpl_facial', // does not require provider sig
          templateVersion: '1.0',
          treatmentName: 'HydraFacial',
          expirationDate: '2027-01-01',
          providerSignature: undefined,
        }),
      ],
    });
    const sig = calculateConsentScore().details.find(
      (d) => d.area === 'Signature Completeness'
    )!;
    expect(sig.score).toBe(20);
  });

  it('Signature Completeness: ignores non-active consents (revoked / superseded)', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({
          id: 's1',
          status: 'revoked',
          providerSignature: undefined,
        }),
        buildSeedConsent({
          id: 's2',
          status: 'superseded',
          providerSignature: undefined,
        }),
      ],
    });
    const sig = calculateConsentScore().details.find(
      (d) => d.area === 'Signature Completeness'
    )!;
    expect(sig.score).toBe(20);
  });

  it('Signature Completeness: caps at 0 (cannot go negative) when many sigs are missing', () => {
    const many: SignedConsent[] = Array.from({ length: 10 }, (_, i) =>
      buildSeedConsent({
        id: `m${i}`,
        expirationDate: '2027-01-01',
        providerSignature: undefined,
      })
    );
    seedConsentData({ signedConsents: many });
    const sig = calculateConsentScore().details.find(
      (d) => d.area === 'Signature Completeness'
    )!;
    expect(sig.score).toBe(0);
  });

  it('aggregates the four areas into a total score and total issue count', () => {
    seedConsentData({
      signedConsents: [
        buildSeedConsent({ expirationDate: '2027-01-01' }),
      ],
    });
    const result = calculateConsentScore();

    // Coverage 20 + Currency 35 + Expiring 15 + Sig 20 = 90
    expect(result.score).toBe(90);
    expect(result.details).toHaveLength(4);
    expect(result.details.map((d) => d.area)).toEqual([
      'Template Coverage',
      'Consent Currency',
      'Upcoming Expirations',
      'Signature Completeness',
    ]);
    // Only Template Coverage has an issue in this scenario.
    expect(result.issues).toBe(1);
  });

  it('returns a perfect-shape result even when no consents are seeded', () => {
    const result = calculateConsentScore();
    expect(result.score).toBe(20 + 35 + 15 + 20); // 90
    expect(result.details).toHaveLength(4);
    expect(result.issues).toBe(1); // template coverage penalty
  });
});
