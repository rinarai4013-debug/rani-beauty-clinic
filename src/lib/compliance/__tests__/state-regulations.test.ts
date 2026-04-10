/**
 * WA State Medical Aesthetics Regulations — Production Test Suite
 *
 * Covers scope-of-practice validation for every provider type,
 * delegation agreement lifecycle, provider license tracking with
 * expiry alerts at the 90-day threshold, and the licensing
 * compliance score engine.
 *
 * This is compliance code — a scope-of-practice miss can put Rina's
 * and her mother's medical licenses at risk. Every provider type has
 * positive and negative coverage, every numeric threshold is tested
 * on BOTH sides, and date math runs against a frozen clock.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  DelegationAgreement,
  ProviderLicense,
  ProviderType,
} from '@/types/compliance';

// ── Defensively mock audit-trail — state-regulations.ts does not
// currently import it, but mirroring hipaa-audit.test.ts keeps us
// safe if a future edit wires auditing into delegation or license
// mutations. ─────────────────────────────────────────────────────────
const createAuditEntryMock = vi.fn();
vi.mock('@/lib/compliance/audit-trail', () => ({
  createAuditEntry: (...args: unknown[]) => createAuditEntryMock(...args),
}));

import {
  WA_SCOPE_OF_PRACTICE,
  validateProcedureScope,
  addDelegationAgreement,
  updateDelegationAgreement,
  getDelegationAgreements,
  getActiveDelegations,
  checkDelegationRequirement,
  addProviderLicense,
  updateProviderLicense,
  getProviderLicenses,
  getLicenseAlerts,
  getDaysUntilExpiry,
  calculateLicensingScore,
  normalizeProviderName,
  seedStateRegData,
  clearStateRegData,
} from '@/lib/compliance/state-regulations';

// ── Frozen Clock ─────────────────────────────────────────────────────

const FROZEN_NOW = new Date('2026-04-09T12:00:00Z');

/** Return an ISO string N days from FROZEN_NOW. */
function daysFromNow(days: number): string {
  return new Date(FROZEN_NOW.getTime() + days * 86_400_000).toISOString();
}

// ── Fixture Factories ────────────────────────────────────────────────

function makeDelegation(
  overrides: Partial<DelegationAgreement> = {}
): Omit<DelegationAgreement, 'id'> {
  return {
    supervisingPhysician: 'Dr. Raj Rai, MD',
    supervisingPhysicianLicense: 'MD60123456',
    delegateName: 'Rina Rai, RN',
    delegateType: 'rn',
    delegateLicense: 'RN60987654',
    delegatedProcedures: ['Botox Injection', 'Dermal Filler Injection'],
    restrictions: ['No Kybella', 'No independent assessment'],
    effectiveDate: daysFromNow(-30),
    expirationDate: daysFromNow(335),
    renewalDate: daysFromNow(305),
    status: 'active',
    lastReviewDate: daysFromNow(-30),
    documentUrl: 'https://docs.example.com/deleg-rina.pdf',
    ...overrides,
  };
}

function makeLicense(
  overrides: Partial<ProviderLicense> = {}
): Omit<ProviderLicense, 'id'> {
  return {
    providerName: 'Rina Rai',
    providerType: 'rn',
    licenseNumber: 'RN60987654',
    licenseType: 'Registered Nurse',
    issuingAuthority: 'WA State Department of Health',
    state: 'WA',
    issueDate: '2022-04-09',
    expirationDate: daysFromNow(365),
    status: 'active',
    ceCreditsRequired: 45,
    ceCreditsCompleted: 45,
    ceDeadline: daysFromNow(365),
    verificationUrl: 'https://fortress.wa.gov/doh/providercredentialsearch',
    documentUrl: 'https://docs.example.com/rina-rn.pdf',
    renewalAlertDays: 90,
    lastVerified: daysFromNow(-30),
    ...overrides,
  };
}

// ── Shared Setup ─────────────────────────────────────────────────────

beforeEach(() => {
  clearStateRegData();
  createAuditEntryMock.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ═════════════════════════════════════════════════════════════════════
// WA_SCOPE_OF_PRACTICE — Data Integrity
// ═════════════════════════════════════════════════════════════════════

describe('WA_SCOPE_OF_PRACTICE — data integrity', () => {
  it('defines scope for all 8 WA provider types', () => {
    expect(WA_SCOPE_OF_PRACTICE).toHaveLength(8);
  });

  it('covers every ProviderType literal once', () => {
    const expected: ProviderType[] = [
      'physician',
      'arnp',
      'pa',
      'rn',
      'lpn',
      'ma',
      'esthetician',
      'laser_technician',
    ];
    const actual = WA_SCOPE_OF_PRACTICE.map((s) => s.providerType).sort();
    expect(actual).toEqual(expected.sort());
  });

  it.each([
    ['physician', false, true, true],
    ['arnp', false, true, true],
    ['pa', true, true, true],
    ['rn', true, false, false],
    ['lpn', true, false, false],
    ['ma', true, false, false],
    ['esthetician', false, false, false],
    ['laser_technician', true, false, false],
  ] as const)(
    '%s has correct supervision/Rx/DEA flags',
    (type, supervised, rx, dea) => {
      const scope = WA_SCOPE_OF_PRACTICE.find((s) => s.providerType === type)!;
      expect(scope.requiresSupervision).toBe(supervised);
      expect(scope.prescriptiveAuthority).toBe(rx);
      expect(scope.deaRegistrationRequired).toBe(dea);
    }
  );

  it.each([
    ['pa', 'general'],
    ['rn', 'indirect'],
    ['lpn', 'direct'],
    ['ma', 'direct'],
    ['laser_technician', 'indirect'],
  ] as const)('%s has %s supervision type', (type, supType) => {
    const scope = WA_SCOPE_OF_PRACTICE.find((s) => s.providerType === type)!;
    expect(scope.supervisionType).toBe(supType);
  });

  it('physician has empty restrictedProcedures (full scope)', () => {
    const phys = WA_SCOPE_OF_PRACTICE.find((s) => s.providerType === 'physician')!;
    expect(phys.restrictedProcedures).toEqual([]);
  });

  it('only physician is eligible for Medical Director Supervision', () => {
    for (const scope of WA_SCOPE_OF_PRACTICE) {
      if (scope.providerType === 'physician') {
        expect(scope.allowedProcedures).toContain('Medical Director Supervision');
      } else {
        expect(scope.allowedProcedures).not.toContain('Medical Director Supervision');
      }
    }
  });
});

// ═════════════════════════════════════════════════════════════════════
// validateProcedureScope — Provider × Procedure Matrix
// ═════════════════════════════════════════════════════════════════════

describe('validateProcedureScope — positive scope cases', () => {
  // Each row: [providerType, procedure, expectedSupervision]
  const allowedCases: Array<[ProviderType, string, boolean]> = [
    // Physician — full scope
    ['physician', 'Botox Injection', false],
    ['physician', 'Kybella Injection', false],
    ['physician', 'GLP-1 Injection', false],
    ['physician', 'HRT Injection', false],
    ['physician', 'Sofwave', false],
    ['physician', 'Medical Director Supervision', false],

    // ARNP — independent practice (WA 2020+)
    ['arnp', 'Botox Injection', false],
    ['arnp', 'GLP-1 Injection', false],
    ['arnp', 'HRT Injection', false],
    ['arnp', 'Kybella Injection', false],
    ['arnp', 'IV Therapy', false],

    // PA — supervised, general
    ['pa', 'Botox Injection', true],
    ['pa', 'Kybella Injection', true],
    ['pa', 'GLP-1 Injection', true],
    ['pa', 'IV Therapy', true],

    // RN — supervised, indirect; injectables allowed with training
    ['rn', 'Botox Injection', true],
    ['rn', 'Dermal Filler Injection', true],
    ['rn', 'Vitamin Injection', true],
    ['rn', 'IV Therapy', true],
    ['rn', 'Laser Hair Removal', true],
    ['rn', 'RF Microneedling', true],

    // LPN — limited; IM vitamin only, intake, assisting
    ['lpn', 'Vitamin Injection (IM only)', true],
    ['lpn', 'Patient intake and vitals', true],
    ['lpn', 'Post-procedure monitoring', true],

    // MA — no procedures, delegated tasks only
    ['ma', 'Patient intake and vitals', true],
    ['ma', 'Room setup and cleanup', true],
    ['ma', 'Photo documentation', true],

    // Esthetician — facial, superficial peels, no medical
    ['esthetician', 'HydraFacial', false],
    ['esthetician', 'Microdermabrasion', false],
    ['esthetician', 'LED Light Therapy', false],
    ['esthetician', 'Facial treatments', false],
    ['esthetician', 'Extractions', false],

    // Laser technician — LHR/IPL under delegation
    ['laser_technician', 'Laser Hair Removal', true],
    ['laser_technician', 'IPL treatments', true],
  ];

  it.each(allowedCases)(
    '%s CAN perform %s (supervision=%s)',
    (type, procedure, supervision) => {
      const result = validateProcedureScope(type, procedure);
      expect(result.allowed).toBe(true);
      expect(result.requiresSupervision).toBe(supervision);
      expect(result.reason).toMatch(/within scope/i);
    }
  );

  it('returns supervisionType for supervised providers', () => {
    expect(validateProcedureScope('rn', 'Botox Injection').supervisionType).toBe(
      'indirect'
    );
    expect(validateProcedureScope('pa', 'Botox Injection').supervisionType).toBe(
      'general'
    );
    expect(validateProcedureScope('ma', 'Patient intake and vitals').supervisionType).toBe(
      'direct'
    );
    expect(
      validateProcedureScope('laser_technician', 'Laser Hair Removal').supervisionType
    ).toBe('indirect');
  });

  it('does not return supervisionType for independent providers', () => {
    expect(
      validateProcedureScope('physician', 'Botox Injection').supervisionType
    ).toBeUndefined();
    expect(
      validateProcedureScope('arnp', 'Botox Injection').supervisionType
    ).toBeUndefined();
    expect(
      validateProcedureScope('esthetician', 'HydraFacial').supervisionType
    ).toBeUndefined();
  });

  it('matches procedures case-insensitively', () => {
    expect(validateProcedureScope('physician', 'botox injection').allowed).toBe(true);
    expect(validateProcedureScope('physician', 'BOTOX INJECTION').allowed).toBe(true);
    expect(validateProcedureScope('arnp', 'Iv Therapy').allowed).toBe(true);
  });
});

describe('validateProcedureScope — negative scope cases (restricted)', () => {
  // Restricted items trigger the "restricted" branch (strict equality).
  const restrictedCases: Array<[ProviderType, string]> = [
    // ARNP cannot serve as medical director
    ['arnp', 'Medical Director Supervision'],

    // PA cannot be medical director or practice independently
    ['pa', 'Medical Director Supervision'],
    ['pa', 'Independent Practice'],

    // RN cannot do Kybella or Rx or GLP-1 or HRT
    ['rn', 'Kybella Injection'],
    ['rn', 'Prescribing'],
    ['rn', 'Independent Assessment'],
    ['rn', 'GLP-1 Injection'],
    ['rn', 'HRT Injection'],

    // LPN restricted list
    ['lpn', 'Botox Injection'],
    ['lpn', 'Dermal Filler Injection'],
    ['lpn', 'IV Therapy'],
    ['lpn', 'Laser procedures'],
    ['lpn', 'Chemical Peels'],
    ['lpn', 'Independent procedures'],

    // MA restricted list
    ['ma', 'Any injection'],
    ['ma', 'Laser operation'],
    ['ma', 'Chemical application'],
    ['ma', 'Independent patient assessment'],
    ['ma', 'IV insertion'],

    // Esthetician restricted list
    ['esthetician', 'Any injection'],
    ['esthetician', 'Laser procedures'],
    ['esthetician', 'RF Microneedling'],
    ['esthetician', 'Medium/deep chemical peels'],
    ['esthetician', 'PRP'],
    ['esthetician', 'Prescribing'],

    // Laser tech restricted list
    ['laser_technician', 'Ablative laser procedures'],
    ['laser_technician', 'Injection'],
    ['laser_technician', 'Prescribing'],
    ['laser_technician', 'Independent patient assessment'],
  ];

  it.each(restrictedCases)('%s CANNOT perform %s (restricted)', (type, procedure) => {
    const result = validateProcedureScope(type, procedure);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/restricted/i);
    expect(result.requiresSupervision).toBe(false);
  });
});

describe('validateProcedureScope — negative scope cases (out of scope)', () => {
  // Procedures that are neither allowed nor explicitly restricted by name.
  const outOfScopeCases: Array<[ProviderType, string]> = [
    ['esthetician', 'Botox Injection'],
    ['esthetician', 'Dermal Filler Injection'],
    ['laser_technician', 'Botox Injection'],
    ['laser_technician', 'RF Microneedling'],
    ['ma', 'Sofwave'],
    ['lpn', 'Sofwave'],
    ['rn', 'Sofwave'],
    ['rn', 'PicoWay Laser'],
    ['pa', 'Sofwave'],
    ['pa', 'HRT Injection'],
  ];

  it.each(outOfScopeCases)('%s has %s out of scope', (type, procedure) => {
    const result = validateProcedureScope(type, procedure);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/not in the approved scope/i);
    expect(result.requiresSupervision).toBe(false);
  });

  it('returns "Unknown provider type" for invalid provider', () => {
    const result = validateProcedureScope('shaman' as ProviderType, 'Botox Injection');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Unknown provider type');
    expect(result.requiresSupervision).toBe(false);
  });
});

describe('validateProcedureScope — matching semantics', () => {
  it('restricted check uses case-insensitive strict equality', () => {
    // Exact strict match → restricted.
    expect(validateProcedureScope('rn', 'Kybella Injection').allowed).toBe(false);
    expect(validateProcedureScope('rn', 'kybella injection').allowed).toBe(false);
  });

  it('allowed check uses case-insensitive strict equality', () => {
    // Fixed: allowed lookup is strict equality (case-insensitive). No
    // substring matching — a bare "Botox" does NOT match "Botox Injection",
    // and a longer phrase containing an allowed term does not match either.
    expect(validateProcedureScope('physician', 'Botox Injection').allowed).toBe(true);
    expect(validateProcedureScope('physician', 'botox injection').allowed).toBe(true);
    expect(validateProcedureScope('physician', 'Botox').allowed).toBe(false);
    expect(
      validateProcedureScope('physician', 'Deep Sofwave Session').allowed
    ).toBe(false);
  });

  // Fixed: both restricted and allowed use strict case-insensitive equality,
  // so an ambiguous "Chemical Peels" query can no longer slip past the
  // "Medium/deep chemical peels" restriction via a substring match against
  // "Chemical Peels (superficial)". The query simply falls out of scope,
  // forcing the caller to pass the exact procedure name.
  it('bare "Chemical Peels" query is out of scope for esthetician (ambiguous queries no longer auto-approve)', () => {
    const result = validateProcedureScope('esthetician', 'Chemical Peels');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/not in the approved scope/i);
  });

  // Fixed: a bare "Injection" query no longer substring-matches any
  // "... Injection" entry in allowedProcedures — it is strictly out of
  // scope for every provider type, including physician and ARNP.
  it('bare "Injection" query is out of scope for physician', () => {
    const result = validateProcedureScope('physician', 'Injection');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/not in the approved scope/i);
  });

  it('bare "Injection" query is out of scope for ARNP', () => {
    const result = validateProcedureScope('arnp', 'Injection');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/not in the approved scope/i);
  });
});

// ═════════════════════════════════════════════════════════════════════
// checkDelegationRequirement
// ═════════════════════════════════════════════════════════════════════

describe('checkDelegationRequirement', () => {
  it.each(['physician', 'arnp', 'esthetician'] as const)(
    '%s can practice independently',
    (type) => {
      const result = checkDelegationRequirement(type);
      expect(result.required).toBe(false);
      expect(result.description).toMatch(/independently/i);
    }
  );

  it.each(['pa', 'rn', 'lpn', 'ma', 'laser_technician'] as const)(
    '%s requires a delegation agreement',
    (type) => {
      const result = checkDelegationRequirement(type);
      expect(result.required).toBe(true);
      expect(result.description).toMatch(/delegation agreement/i);
    }
  );

  it('includes the supervision type in the description', () => {
    expect(checkDelegationRequirement('pa').description).toMatch(/general/);
    expect(checkDelegationRequirement('rn').description).toMatch(/indirect/);
    expect(checkDelegationRequirement('ma').description).toMatch(/direct/);
    expect(checkDelegationRequirement('laser_technician').description).toMatch(
      /indirect/
    );
  });

  it('returns required=false with Unknown provider type for invalid provider', () => {
    const result = checkDelegationRequirement('shaman' as ProviderType);
    expect(result.required).toBe(false);
    expect(result.description).toBe('Unknown provider type');
  });
});

// ═════════════════════════════════════════════════════════════════════
// Delegation Agreements CRUD
// ═════════════════════════════════════════════════════════════════════

describe('addDelegationAgreement', () => {
  it('assigns a deleg_-prefixed id and stores the agreement', () => {
    const created = addDelegationAgreement(makeDelegation());
    expect(created.id).toMatch(/^deleg_\d+_[a-z0-9]+$/);
    expect(getDelegationAgreements()).toHaveLength(1);
  });

  it('preserves all input fields on the stored agreement', () => {
    const input = makeDelegation({
      delegateName: 'Mom Rai, RN',
      delegatedProcedures: ['Botox Injection', 'Sofwave'],
    });
    const created = addDelegationAgreement(input);
    expect(created.delegateName).toBe('Mom Rai, RN');
    expect(created.delegatedProcedures).toEqual(['Botox Injection', 'Sofwave']);
    expect(created.supervisingPhysician).toBe('Dr. Raj Rai, MD');
  });
});

describe('updateDelegationAgreement', () => {
  it('merges updates into an existing agreement', () => {
    const created = addDelegationAgreement(makeDelegation());
    const updated = updateDelegationAgreement(created.id, { status: 'revoked' });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('revoked');
    expect(updated!.delegateName).toBe('Rina Rai, RN'); // unchanged field
  });

  it('returns null for unknown id', () => {
    expect(updateDelegationAgreement('deleg_missing', { status: 'revoked' })).toBeNull();
  });

  it('persists the update in the backing store', () => {
    const created = addDelegationAgreement(makeDelegation());
    updateDelegationAgreement(created.id, {
      delegatedProcedures: ['Botox Injection only'],
    });
    const fetched = getDelegationAgreements().find((d) => d.id === created.id)!;
    expect(fetched.delegatedProcedures).toEqual(['Botox Injection only']);
  });
});

describe('getDelegationAgreements', () => {
  it('returns an empty array when no agreements exist', () => {
    expect(getDelegationAgreements()).toEqual([]);
  });

  it('sorts agreements by expirationDate ascending', () => {
    addDelegationAgreement(
      makeDelegation({ delegateName: 'Z', expirationDate: daysFromNow(300) })
    );
    addDelegationAgreement(
      makeDelegation({ delegateName: 'A', expirationDate: daysFromNow(30) })
    );
    addDelegationAgreement(
      makeDelegation({ delegateName: 'M', expirationDate: daysFromNow(100) })
    );
    const sorted = getDelegationAgreements().map((d) => d.delegateName);
    expect(sorted).toEqual(['A', 'M', 'Z']);
  });

  it('returns a defensive copy (sorting the result does not mutate store)', () => {
    addDelegationAgreement(
      makeDelegation({ delegateName: 'A', expirationDate: daysFromNow(30) })
    );
    addDelegationAgreement(
      makeDelegation({ delegateName: 'Z', expirationDate: daysFromNow(300) })
    );
    const first = getDelegationAgreements();
    first.reverse();
    const second = getDelegationAgreements();
    expect(second[0].delegateName).toBe('A');
  });
});

describe('getActiveDelegations', () => {
  it('returns only active, unexpired delegations', () => {
    addDelegationAgreement(
      makeDelegation({ delegateName: 'Active', status: 'active' })
    );
    addDelegationAgreement(
      makeDelegation({ delegateName: 'Revoked', status: 'revoked' })
    );
    addDelegationAgreement(
      makeDelegation({ delegateName: 'Pending', status: 'pending' })
    );
    addDelegationAgreement(
      makeDelegation({
        delegateName: 'ExpiredStatus',
        status: 'expired',
      })
    );
    const active = getActiveDelegations();
    expect(active.map((d) => d.delegateName)).toEqual(['Active']);
  });

  it('excludes an agreement whose expirationDate is in the past even if status=active', () => {
    addDelegationAgreement(
      makeDelegation({
        delegateName: 'StaleActive',
        status: 'active',
        expirationDate: daysFromNow(-1),
      })
    );
    expect(getActiveDelegations()).toEqual([]);
  });

  it('excludes an agreement whose expirationDate is exactly now (strict >)', () => {
    addDelegationAgreement(
      makeDelegation({
        delegateName: 'EdgeNow',
        status: 'active',
        expirationDate: FROZEN_NOW.toISOString(),
      })
    );
    expect(getActiveDelegations()).toEqual([]);
  });

  it('includes an agreement whose expirationDate is 1 second in the future', () => {
    addDelegationAgreement(
      makeDelegation({
        delegateName: 'Fresh',
        status: 'active',
        expirationDate: new Date(FROZEN_NOW.getTime() + 1000).toISOString(),
      })
    );
    expect(getActiveDelegations()).toHaveLength(1);
  });

  it('filters by delegateName when supplied', () => {
    addDelegationAgreement(makeDelegation({ delegateName: 'Rina Rai, RN' }));
    addDelegationAgreement(makeDelegation({ delegateName: 'Mom Rai, RN' }));
    const rina = getActiveDelegations('Rina Rai, RN');
    expect(rina).toHaveLength(1);
    expect(rina[0].delegateName).toBe('Rina Rai, RN');
  });

  it('returns an empty array when the named delegate has no active agreements', () => {
    addDelegationAgreement(makeDelegation({ delegateName: 'Rina Rai, RN' }));
    expect(getActiveDelegations('Unknown Provider')).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════
// Provider Licenses CRUD
// ═════════════════════════════════════════════════════════════════════

describe('addProviderLicense', () => {
  it('assigns a lic_-prefixed id and stores the license', () => {
    const created = addProviderLicense(makeLicense());
    expect(created.id).toMatch(/^lic_\d+_[a-z0-9]+$/);
    expect(getProviderLicenses()).toHaveLength(1);
  });

  it('preserves WA license number formats', () => {
    const md = addProviderLicense(
      makeLicense({
        providerName: 'Dr. Raj Rai',
        providerType: 'physician',
        licenseNumber: 'MD60123456',
        licenseType: 'Physician',
      })
    );
    expect(md.licenseNumber).toBe('MD60123456');
  });
});

describe('updateProviderLicense', () => {
  it('merges updates into an existing license', () => {
    const created = addProviderLicense(makeLicense());
    const updated = updateProviderLicense(created.id, { ceCreditsCompleted: 60 });
    expect(updated!.ceCreditsCompleted).toBe(60);
    expect(updated!.providerName).toBe('Rina Rai');
  });

  it('returns null for unknown id', () => {
    expect(updateProviderLicense('lic_missing', { status: 'suspended' })).toBeNull();
  });
});

describe('getProviderLicenses', () => {
  it('returns an empty array when no licenses exist', () => {
    expect(getProviderLicenses()).toEqual([]);
  });

  it('sorts by expirationDate ascending', () => {
    addProviderLicense(
      makeLicense({ providerName: 'Z', expirationDate: daysFromNow(400) })
    );
    addProviderLicense(
      makeLicense({ providerName: 'A', expirationDate: daysFromNow(10) })
    );
    addProviderLicense(
      makeLicense({ providerName: 'M', expirationDate: daysFromNow(200) })
    );
    const names = getProviderLicenses().map((l) => l.providerName);
    expect(names).toEqual(['A', 'M', 'Z']);
  });
});

// ═════════════════════════════════════════════════════════════════════
// License Alerts — 90-day threshold, CE deficiency, expiry
// ═════════════════════════════════════════════════════════════════════

describe('getLicenseAlerts — expired bucket', () => {
  it('includes active licenses with expirationDate strictly before now', () => {
    addProviderLicense(makeLicense({ expirationDate: daysFromNow(-1) }));
    const alerts = getLicenseAlerts();
    expect(alerts.expired).toHaveLength(1);
    expect(alerts.expiringSoon).toHaveLength(0);
  });

  it('includes an active license whose expiration equals now (<=)', () => {
    addProviderLicense(
      makeLicense({ expirationDate: FROZEN_NOW.toISOString() })
    );
    const alerts = getLicenseAlerts();
    expect(alerts.expired).toHaveLength(1);
  });

  // Fixed: the expired bucket no longer gates on status === 'active'. A
  // license manually flipped to 'expired' (or 'suspended' / 'revoked') must
  // still surface on the compliance alert board as long as its expiration
  // date is past — otherwise operators who use the status field as their
  // primary workflow would see a clean board while non-current licenses
  // remain in the store.
  it('includes a status="expired" license in the expired bucket', () => {
    addProviderLicense(
      makeLicense({
        status: 'expired',
        expirationDate: daysFromNow(-30),
      })
    );
    const alerts = getLicenseAlerts();
    expect(alerts.expired).toHaveLength(1);
  });

  // Fixed: a suspended license with a past expiration date shows up in the
  // expired bucket. It does NOT appear in ceDeficient because inactive
  // providers are not practicing and therefore are not subject to the CE
  // requirement — that gate is intentionally preserved.
  it('includes a suspended license in expired; excludes it from ceDeficient', () => {
    addProviderLicense(
      makeLicense({
        status: 'suspended',
        expirationDate: daysFromNow(-30),
        ceCreditsCompleted: 0,
        ceCreditsRequired: 45,
      })
    );
    const alerts = getLicenseAlerts();
    expect(alerts.expired).toHaveLength(1);
    expect(alerts.expiringSoon).toHaveLength(0);
    expect(alerts.ceDeficient).toHaveLength(0);
  });

  // Fixed: a suspended license that is not yet at its expiration date still
  // surfaces in expiringSoon if the date falls within the 90-day window.
  it('includes a suspended license nearing expiration in expiringSoon', () => {
    addProviderLicense(
      makeLicense({
        status: 'suspended',
        expirationDate: daysFromNow(30),
      })
    );
    const alerts = getLicenseAlerts();
    expect(alerts.expired).toHaveLength(0);
    expect(alerts.expiringSoon).toHaveLength(1);
  });
});

describe('getLicenseAlerts — expiringSoon bucket (90-day threshold)', () => {
  it('includes a license expiring in exactly 1 day (inside window)', () => {
    addProviderLicense(makeLicense({ expirationDate: daysFromNow(1) }));
    expect(getLicenseAlerts().expiringSoon).toHaveLength(1);
  });

  it('includes a license expiring in 89 days (inside window)', () => {
    addProviderLicense(makeLicense({ expirationDate: daysFromNow(89) }));
    expect(getLicenseAlerts().expiringSoon).toHaveLength(1);
  });

  it('includes a license expiring at exactly 90 days (boundary, <=)', () => {
    // Build the exact ISO of now+90 days (matches the function's
    // setDate(+90) pathway which keeps time-of-day constant).
    const exact = new Date(FROZEN_NOW);
    exact.setDate(exact.getDate() + 90);
    addProviderLicense(
      makeLicense({ expirationDate: exact.toISOString() })
    );
    expect(getLicenseAlerts().expiringSoon).toHaveLength(1);
  });

  it('excludes a license expiring in 91 days (outside window)', () => {
    addProviderLicense(makeLicense({ expirationDate: daysFromNow(91) }));
    expect(getLicenseAlerts().expiringSoon).toHaveLength(0);
  });

  it('excludes a license expiring today (already in expired bucket)', () => {
    addProviderLicense(
      makeLicense({ expirationDate: FROZEN_NOW.toISOString() })
    );
    const alerts = getLicenseAlerts();
    expect(alerts.expired).toHaveLength(1);
    expect(alerts.expiringSoon).toHaveLength(0);
  });
});

describe('getLicenseAlerts — ceDeficient bucket', () => {
  it('flags an active license whose completed CE < required CE', () => {
    addProviderLicense(
      makeLicense({ ceCreditsRequired: 45, ceCreditsCompleted: 44 })
    );
    expect(getLicenseAlerts().ceDeficient).toHaveLength(1);
  });

  it('does not flag when completed equals required (boundary)', () => {
    addProviderLicense(
      makeLicense({ ceCreditsRequired: 45, ceCreditsCompleted: 45 })
    );
    expect(getLicenseAlerts().ceDeficient).toHaveLength(0);
  });

  it('does not flag when completed exceeds required', () => {
    addProviderLicense(
      makeLicense({ ceCreditsRequired: 45, ceCreditsCompleted: 100 })
    );
    expect(getLicenseAlerts().ceDeficient).toHaveLength(0);
  });

  it('flags at zero completed when requirement is positive', () => {
    addProviderLicense(
      makeLicense({ ceCreditsRequired: 45, ceCreditsCompleted: 0 })
    );
    expect(getLicenseAlerts().ceDeficient).toHaveLength(1);
  });
});

// ═════════════════════════════════════════════════════════════════════
// getDaysUntilExpiry
// ═════════════════════════════════════════════════════════════════════

describe('getDaysUntilExpiry', () => {
  it('returns positive days for a future expiry', () => {
    const lic = makeLicense({ expirationDate: daysFromNow(30) }) as ProviderLicense;
    expect(getDaysUntilExpiry(lic)).toBe(30);
  });

  it('returns 1 for an expiry 1 day in the future', () => {
    const lic = makeLicense({ expirationDate: daysFromNow(1) }) as ProviderLicense;
    expect(getDaysUntilExpiry(lic)).toBe(1);
  });

  it('returns 0 for an expiry at exactly now', () => {
    const lic = makeLicense({
      expirationDate: FROZEN_NOW.toISOString(),
    }) as ProviderLicense;
    expect(getDaysUntilExpiry(lic)).toBe(0);
  });

  it('returns a negative value for an expiry in the past', () => {
    const lic = makeLicense({ expirationDate: daysFromNow(-10) }) as ProviderLicense;
    expect(getDaysUntilExpiry(lic)).toBe(-10);
  });

  it('uses Math.ceil for sub-day fractional deltas (future)', () => {
    // 12 hours in the future → ceil(0.5) = 1
    const future = new Date(FROZEN_NOW.getTime() + 12 * 3600 * 1000).toISOString();
    const lic = makeLicense({ expirationDate: future }) as ProviderLicense;
    expect(getDaysUntilExpiry(lic)).toBe(1);
  });

  it('uses Math.ceil for sub-day fractional deltas (past)', () => {
    // 12 hours in the past → Math.ceil(-0.5) === -0, which equals 0 numerically.
    const past = new Date(FROZEN_NOW.getTime() - 12 * 3600 * 1000).toISOString();
    const lic = makeLicense({ expirationDate: past }) as ProviderLicense;
    const days = getDaysUntilExpiry(lic);
    expect(days === 0).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════
// calculateLicensingScore — weighted 40/30/30 breakdown
// ═════════════════════════════════════════════════════════════════════

describe('calculateLicensingScore — perfect state', () => {
  it('returns 100 with zero issues when store is empty', () => {
    const result = calculateLicensingScore();
    expect(result.score).toBe(100);
    expect(result.issues).toBe(0);
    expect(result.details).toHaveLength(3);
    expect(result.details.map((d) => d.area)).toEqual([
      'License Currency',
      'CE Compliance',
      'Delegation Agreements',
    ]);
    expect(result.details.every((d) => d.issues.length === 0)).toBe(true);
  });

  it('returns 100 with healthy physician + CE-current license and no supervised providers', () => {
    addProviderLicense(
      makeLicense({
        providerName: 'Dr. Raj Rai',
        providerType: 'physician',
        expirationDate: daysFromNow(365),
        ceCreditsRequired: 50,
        ceCreditsCompleted: 60,
      })
    );
    const result = calculateLicensingScore();
    expect(result.score).toBe(100);
    expect(result.issues).toBe(0);
  });
});

describe('calculateLicensingScore — License Currency area (40 pts)', () => {
  it('subtracts 20 for a single expired license', () => {
    addProviderLicense(
      makeLicense({
        providerType: 'physician', // independent, no delegation penalty
        expirationDate: daysFromNow(-1),
      })
    );
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'License Currency')!;
    expect(area.score).toBe(20);
    expect(area.issues[0]).toMatch(/1 expired license/);
  });

  it('subtracts 5 for a single license expiring within 90 days', () => {
    addProviderLicense(
      makeLicense({
        providerType: 'physician',
        expirationDate: daysFromNow(45),
      })
    );
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'License Currency')!;
    expect(area.score).toBe(35);
    expect(area.issues[0]).toMatch(/expiring within 90 days/);
  });

  it('floors License Currency at zero rather than going negative', () => {
    for (let i = 0; i < 5; i++) {
      addProviderLicense(
        makeLicense({
          providerName: `Phys ${i}`,
          providerType: 'physician',
          expirationDate: daysFromNow(-1),
        })
      );
    }
    // 5 * 20 = 100 deducted from 40 → floor 0
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'License Currency')!;
    expect(area.score).toBe(0);
  });

  it('combines expired + expiring-soon penalties', () => {
    addProviderLicense(
      makeLicense({
        providerName: 'Exp1',
        providerType: 'physician',
        expirationDate: daysFromNow(-1),
      })
    );
    addProviderLicense(
      makeLicense({
        providerName: 'Soon1',
        providerType: 'physician',
        expirationDate: daysFromNow(45),
      })
    );
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'License Currency')!;
    // 40 - 20 - 5 = 15
    expect(area.score).toBe(15);
    expect(area.issues).toHaveLength(2);
  });
});

describe('calculateLicensingScore — CE Compliance area (30 pts)', () => {
  it('subtracts 10 per CE-deficient provider', () => {
    addProviderLicense(
      makeLicense({
        providerName: 'Deficient',
        providerType: 'physician',
        ceCreditsRequired: 50,
        ceCreditsCompleted: 40,
      })
    );
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'CE Compliance')!;
    expect(area.score).toBe(20);
    expect(area.issues[0]).toMatch(/1 provider\(s\) behind on CE/);
  });

  it('floors CE Compliance at zero', () => {
    for (let i = 0; i < 4; i++) {
      addProviderLicense(
        makeLicense({
          providerName: `D${i}`,
          providerType: 'physician',
          ceCreditsRequired: 50,
          ceCreditsCompleted: 0,
        })
      );
    }
    // 4 * 10 = 40 deducted from 30 → floor 0
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'CE Compliance')!;
    expect(area.score).toBe(0);
  });
});

describe('calculateLicensingScore — Delegation Agreements area (30 pts)', () => {
  it('subtracts 15 per expired active delegation', () => {
    addDelegationAgreement(
      makeDelegation({
        status: 'active',
        expirationDate: daysFromNow(-1),
      })
    );
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'Delegation Agreements')!;
    expect(area.score).toBe(15);
    expect(area.issues[0]).toMatch(/expired delegation/);
  });

  it('subtracts 10 per supervised provider lacking an active delegation', () => {
    addProviderLicense(
      makeLicense({
        providerName: 'Unprotected RN',
        providerType: 'rn',
      })
    );
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'Delegation Agreements')!;
    // 30 - 10 = 20
    expect(area.score).toBe(20);
    expect(area.issues[0]).toMatch(/Unprotected RN.*lacks active delegation/);
  });

  it('does not penalize independent-scope providers for missing delegation', () => {
    addProviderLicense(
      makeLicense({
        providerName: 'Dr. Raj Rai',
        providerType: 'physician',
      })
    );
    addProviderLicense(
      makeLicense({
        providerName: 'Independent ARNP',
        providerType: 'arnp',
      })
    );
    addProviderLicense(
      makeLicense({
        providerName: 'Esty',
        providerType: 'esthetician',
      })
    );
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'Delegation Agreements')!;
    expect(area.score).toBe(30);
    expect(area.issues).toHaveLength(0);
  });

  it('does NOT penalize a supervised provider covered by a matching active delegation', () => {
    addProviderLicense(
      makeLicense({
        providerName: 'Rina Rai, RN',
        providerType: 'rn',
      })
    );
    addDelegationAgreement(
      makeDelegation({
        delegateName: 'Rina Rai, RN',
        status: 'active',
        expirationDate: daysFromNow(180),
      })
    );
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'Delegation Agreements')!;
    expect(area.score).toBe(30);
    expect(area.issues).toHaveLength(0);
  });

  it('penalizes a supervised provider when their delegation is expired (double-hit)', () => {
    addProviderLicense(
      makeLicense({
        providerName: 'Rina Rai, RN',
        providerType: 'rn',
      })
    );
    addDelegationAgreement(
      makeDelegation({
        delegateName: 'Rina Rai, RN',
        status: 'active',
        expirationDate: daysFromNow(-5),
      })
    );
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'Delegation Agreements')!;
    // -15 (expired deleg) -10 (provider lacks active deleg) = 5
    expect(area.score).toBe(5);
    expect(area.issues).toHaveLength(2);
  });

  it('floors Delegation Agreements at zero', () => {
    for (let i = 0; i < 4; i++) {
      addDelegationAgreement(
        makeDelegation({
          delegateName: `D${i}`,
          status: 'active',
          expirationDate: daysFromNow(-1),
        })
      );
    }
    // 4 * 15 = 60 deducted from 30 → floor 0
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'Delegation Agreements')!;
    expect(area.score).toBe(0);
  });

  // Fixed: delegation-to-license name matching now normalizes both sides
  // (whitespace collapse, trailing credential suffix strip, lowercase) so
  // "Rina Rai" on a license and "Rina Rai, RN" on a delegation are treated
  // as the same provider. A signed, active delegation is no longer
  // falsely flagged as missing coverage.
  it('matches delegation to license across credential suffix mismatch ("Rina Rai" vs "Rina Rai, RN")', () => {
    addProviderLicense(
      makeLicense({
        providerName: 'Rina Rai',
        providerType: 'rn',
      })
    );
    addDelegationAgreement(
      makeDelegation({
        delegateName: 'Rina Rai, RN',
        status: 'active',
        expirationDate: daysFromNow(180),
      })
    );
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'Delegation Agreements')!;
    expect(area.score).toBe(30);
    expect(area.issues).toHaveLength(0);
  });

  it('matches delegation to license across extra whitespace and case differences', () => {
    addProviderLicense(
      makeLicense({
        providerName: '  rina   rai  ',
        providerType: 'rn',
      })
    );
    addDelegationAgreement(
      makeDelegation({
        delegateName: 'Rina Rai, RN',
        status: 'active',
        expirationDate: daysFromNow(180),
      })
    );
    const result = calculateLicensingScore();
    const area = result.details.find((d) => d.area === 'Delegation Agreements')!;
    expect(area.score).toBe(30);
    expect(area.issues).toHaveLength(0);
  });
});

describe('calculateLicensingScore — aggregate totals', () => {
  it('sums area scores into the top-level score', () => {
    addProviderLicense(
      makeLicense({
        providerName: 'Dr. Raj Rai',
        providerType: 'physician',
        expirationDate: daysFromNow(45), // -5
      })
    );
    addProviderLicense(
      makeLicense({
        providerName: 'CE Short',
        providerType: 'physician',
        ceCreditsRequired: 50,
        ceCreditsCompleted: 10, // -10
      })
    );
    addProviderLicense(
      makeLicense({
        providerName: 'Rina Rai, RN',
        providerType: 'rn', // -10, no deleg
      })
    );
    const result = calculateLicensingScore();
    // Currency: 40 - 5 (CE Short expiry? no, she is 365 days out)
    //   Actually only "Dr. Raj Rai" is expiring soon (-5). Wait: CE Short also has exp=365. OK.
    //   License Currency = 40 - 5 = 35
    // CE: 30 - 10 = 20
    // Deleg: 30 - 10 = 20
    // Total = 75
    expect(result.score).toBe(75);
    expect(result.issues).toBe(3);
  });

  it('issues field counts area-level issue entries, not individual problems', () => {
    addProviderLicense(
      makeLicense({
        providerName: 'Dr. Raj Rai',
        providerType: 'physician',
        expirationDate: daysFromNow(-1),
      })
    );
    addProviderLicense(
      makeLicense({
        providerName: 'Soon',
        providerType: 'physician',
        expirationDate: daysFromNow(30),
      })
    );
    // License Currency will have 2 issue entries (expired + expiring)
    const result = calculateLicensingScore();
    expect(result.issues).toBe(2);
  });
});

// ═════════════════════════════════════════════════════════════════════
// normalizeProviderName — helper for cross-source name matching
// ═════════════════════════════════════════════════════════════════════

describe('normalizeProviderName', () => {
  it('lowercases the name', () => {
    expect(normalizeProviderName('Rina Rai')).toBe('rina rai');
    expect(normalizeProviderName('RINA RAI')).toBe('rina rai');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeProviderName('  Rina Rai  ')).toBe('rina rai');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeProviderName('Rina    Rai')).toBe('rina rai');
    expect(normalizeProviderName('Rina\tRai')).toBe('rina rai');
  });

  it.each([
    [', RN'],
    [', MD'],
    [', DO'],
    [', NP'],
    [', ARNP'],
    [', PA'],
    [', PA-C'],
    [', LPN'],
    [', MA'],
  ])('strips trailing credential suffix "%s"', (suffix) => {
    expect(normalizeProviderName(`Rina Rai${suffix}`)).toBe('rina rai');
  });

  it('strips credential suffix with periods (e.g. ", M.D.")', () => {
    expect(normalizeProviderName('Raj Rai, M.D.')).toBe('raj rai');
    expect(normalizeProviderName('Rina Rai, R.N.')).toBe('rina rai');
  });

  it('strips credential suffix case-insensitively', () => {
    expect(normalizeProviderName('Rina Rai, rn')).toBe('rina rai');
    expect(normalizeProviderName('Rina Rai, Rn')).toBe('rina rai');
  });

  it('does not strip non-credential comma suffixes', () => {
    // "Jr" is not in the credential list and must be preserved.
    expect(normalizeProviderName('Raj Rai, Jr')).toBe('raj rai, jr');
  });

  it('leaves a bare name unchanged apart from case', () => {
    expect(normalizeProviderName('Rina Rai')).toBe('rina rai');
  });

  it('treats equivalent inputs as equal after normalization', () => {
    expect(normalizeProviderName('Rina Rai')).toBe(
      normalizeProviderName('  RINA   RAI, RN  ')
    );
  });
});

// ═════════════════════════════════════════════════════════════════════
// seedStateRegData / clearStateRegData
// ═════════════════════════════════════════════════════════════════════

describe('seedStateRegData', () => {
  it('appends delegation agreements to the store', () => {
    seedStateRegData({
      delegationAgreements: [
        { ...(makeDelegation() as DelegationAgreement), id: 'deleg_seed_1' },
      ],
    });
    expect(getDelegationAgreements()).toHaveLength(1);
    expect(getDelegationAgreements()[0].id).toBe('deleg_seed_1');
  });

  it('appends provider licenses to the store', () => {
    seedStateRegData({
      providerLicenses: [
        { ...(makeLicense() as ProviderLicense), id: 'lic_seed_1' },
      ],
    });
    expect(getProviderLicenses()).toHaveLength(1);
    expect(getProviderLicenses()[0].id).toBe('lic_seed_1');
  });

  it('accepts both stores in a single call', () => {
    seedStateRegData({
      delegationAgreements: [
        { ...(makeDelegation() as DelegationAgreement), id: 'deleg_seed_1' },
      ],
      providerLicenses: [
        { ...(makeLicense() as ProviderLicense), id: 'lic_seed_1' },
      ],
    });
    expect(getDelegationAgreements()).toHaveLength(1);
    expect(getProviderLicenses()).toHaveLength(1);
  });

  it('is additive — seeding twice accumulates (does not replace)', () => {
    seedStateRegData({
      delegationAgreements: [
        { ...(makeDelegation() as DelegationAgreement), id: 'deleg_seed_1' },
      ],
    });
    seedStateRegData({
      delegationAgreements: [
        { ...(makeDelegation() as DelegationAgreement), id: 'deleg_seed_2' },
      ],
    });
    expect(getDelegationAgreements()).toHaveLength(2);
  });

  it('is a no-op when given an empty object', () => {
    seedStateRegData({});
    expect(getDelegationAgreements()).toHaveLength(0);
    expect(getProviderLicenses()).toHaveLength(0);
  });
});

describe('clearStateRegData', () => {
  it('empties both stores', () => {
    addDelegationAgreement(makeDelegation());
    addProviderLicense(makeLicense());
    clearStateRegData();
    expect(getDelegationAgreements()).toEqual([]);
    expect(getProviderLicenses()).toEqual([]);
  });

  it('restores the score to 100 after clearing penalized state', () => {
    addProviderLicense(
      makeLicense({
        providerType: 'physician',
        expirationDate: daysFromNow(-1),
      })
    );
    expect(calculateLicensingScore().score).toBeLessThan(100);
    clearStateRegData();
    expect(calculateLicensingScore().score).toBe(100);
  });
});
