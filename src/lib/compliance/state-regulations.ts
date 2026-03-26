/**
 * WA State Medical Aesthetics Regulations
 * Delegation agreements, supervision requirements,
 * scope of practice per provider type, license tracking with expiry alerts.
 */

import type {
  DelegationAgreement,
  ProviderLicense,
  ScopeOfPractice,
  ProviderType,
} from '@/types/compliance';

// ── In-memory stores ─────────────────────────────────────────────────

let delegationAgreements: DelegationAgreement[] = [];
let providerLicenses: ProviderLicense[] = [];

// ── WA State Scope of Practice Definitions ───────────────────────────

export const WA_SCOPE_OF_PRACTICE: ScopeOfPractice[] = [
  {
    providerType: 'physician',
    label: 'Physician (MD/DO)',
    allowedProcedures: [
      'Botox Injection', 'Dysport Injection', 'Dermal Filler Injection', 'Kybella Injection',
      'RF Microneedling', 'Laser Hair Removal', 'Chemical Peels', 'PRP Injection',
      'GLP-1 Injection', 'Peptide Injection', 'HRT Injection', 'NAD+ Injection',
      'Vitamin Injection', 'Sofwave', 'PicoWay Laser', 'IV Therapy',
      'Prescribe Controlled Substances', 'Medical Director Supervision',
    ],
    restrictedProcedures: [],
    requiresSupervision: false,
    prescriptiveAuthority: true,
    deaRegistrationRequired: true,
    notes: 'Full scope. Can supervise all other provider types. Medical director for clinic.',
  },
  {
    providerType: 'arnp',
    label: 'Advanced Registered Nurse Practitioner',
    allowedProcedures: [
      'Botox Injection', 'Dysport Injection', 'Dermal Filler Injection', 'Kybella Injection',
      'RF Microneedling', 'Chemical Peels', 'PRP Injection',
      'GLP-1 Injection', 'Peptide Injection', 'HRT Injection', 'NAD+ Injection',
      'Vitamin Injection', 'IV Therapy', 'Laser Hair Removal',
    ],
    restrictedProcedures: ['Medical Director Supervision'],
    requiresSupervision: false,
    prescriptiveAuthority: true,
    deaRegistrationRequired: true,
    notes: 'WA state: Independent practice authority. Collaborative agreement not required since 2020.',
  },
  {
    providerType: 'pa',
    label: 'Physician Assistant',
    allowedProcedures: [
      'Botox Injection', 'Dysport Injection', 'Dermal Filler Injection', 'Kybella Injection',
      'RF Microneedling', 'Chemical Peels', 'PRP Injection',
      'GLP-1 Injection', 'Vitamin Injection', 'IV Therapy',
    ],
    restrictedProcedures: ['Medical Director Supervision', 'Independent Practice'],
    requiresSupervision: true,
    supervisionType: 'general',
    prescriptiveAuthority: true,
    deaRegistrationRequired: true,
    notes: 'WA state: Requires delegation agreement with supervising physician. Supervision can be general (off-site).',
  },
  {
    providerType: 'rn',
    label: 'Registered Nurse',
    allowedProcedures: [
      'Botox Injection', 'Dysport Injection', 'Dermal Filler Injection',
      'Vitamin Injection', 'IV Therapy', 'Chemical Peels (superficial)',
      'RF Microneedling', 'Laser Hair Removal',
    ],
    restrictedProcedures: [
      'Kybella Injection', 'Prescribing', 'Independent Assessment',
      'GLP-1 Injection', 'HRT Injection',
    ],
    requiresSupervision: true,
    supervisionType: 'indirect',
    prescriptiveAuthority: false,
    deaRegistrationRequired: false,
    notes: 'WA state: Injectable procedures require physician/ARNP order and delegation. Must have advanced training for injectables.',
  },
  {
    providerType: 'lpn',
    label: 'Licensed Practical Nurse',
    allowedProcedures: [
      'Vitamin Injection (IM only)', 'Assist with procedures',
      'Patient intake and vitals', 'Post-procedure monitoring',
    ],
    restrictedProcedures: [
      'Botox Injection', 'Dermal Filler Injection', 'IV Therapy',
      'Laser procedures', 'Chemical Peels', 'Independent procedures',
    ],
    requiresSupervision: true,
    supervisionType: 'direct',
    prescriptiveAuthority: false,
    deaRegistrationRequired: false,
    notes: 'WA state: Limited scope. Cannot perform cosmetic injections independently. Must work under direct supervision of RN, ARNP, or physician.',
  },
  {
    providerType: 'ma',
    label: 'Medical Assistant',
    allowedProcedures: [
      'Patient intake and vitals', 'Assist provider during procedures',
      'Room setup and cleanup', 'Post-procedure instructions (scripted)',
      'Photo documentation',
    ],
    restrictedProcedures: [
      'Any injection', 'Laser operation', 'Chemical application',
      'Independent patient assessment', 'IV insertion',
    ],
    requiresSupervision: true,
    supervisionType: 'direct',
    prescriptiveAuthority: false,
    deaRegistrationRequired: false,
    notes: 'WA state: Delegated tasks only under direct supervision. Cannot perform any treatment independently.',
  },
  {
    providerType: 'esthetician',
    label: 'Licensed Esthetician',
    allowedProcedures: [
      'HydraFacial', 'Chemical Peels (superficial)', 'Microdermabrasion',
      'LED Light Therapy', 'Facial treatments', 'Skin analysis',
      'Product application', 'Extractions',
    ],
    restrictedProcedures: [
      'Any injection', 'Laser procedures', 'RF Microneedling',
      'Medium/deep chemical peels', 'PRP', 'Prescribing',
    ],
    requiresSupervision: false,
    prescriptiveAuthority: false,
    deaRegistrationRequired: false,
    notes: 'WA state: Licensed under DOL. Cannot perform medical procedures. Master estheticians have slightly broader scope.',
  },
  {
    providerType: 'laser_technician',
    label: 'Laser Technician',
    allowedProcedures: [
      'Laser Hair Removal', 'IPL treatments',
    ],
    restrictedProcedures: [
      'Ablative laser procedures', 'Injection', 'Prescribing',
      'Independent patient assessment',
    ],
    requiresSupervision: true,
    supervisionType: 'indirect',
    prescriptiveAuthority: false,
    deaRegistrationRequired: false,
    notes: 'WA state: Requires training certification and delegation from physician/ARNP. Must follow established protocols.',
  },
];

// ── Scope Validation ─────────────────────────────────────────────────

export function validateProcedureScope(
  providerType: ProviderType,
  procedure: string
): { allowed: boolean; reason: string; requiresSupervision: boolean; supervisionType?: string } {
  const scope = WA_SCOPE_OF_PRACTICE.find((s) => s.providerType === providerType);
  if (!scope) {
    return { allowed: false, reason: 'Unknown provider type', requiresSupervision: false };
  }

  const isRestricted = scope.restrictedProcedures.some(
    (p) => p.toLowerCase() === procedure.toLowerCase()
  );
  if (isRestricted) {
    return {
      allowed: false,
      reason: `${procedure} is restricted for ${scope.label} under WA state regulations`,
      requiresSupervision: false,
    };
  }

  const isAllowed = scope.allowedProcedures.some(
    (p) => p.toLowerCase().includes(procedure.toLowerCase()) ||
           procedure.toLowerCase().includes(p.toLowerCase())
  );
  if (!isAllowed) {
    return {
      allowed: false,
      reason: `${procedure} is not in the approved scope of practice for ${scope.label}`,
      requiresSupervision: false,
    };
  }

  return {
    allowed: true,
    reason: `${procedure} is within scope of practice for ${scope.label}`,
    requiresSupervision: scope.requiresSupervision,
    supervisionType: scope.supervisionType,
  };
}

// ── Delegation Agreements ────────────────────────────────────────────

export function addDelegationAgreement(
  params: Omit<DelegationAgreement, 'id'>
): DelegationAgreement {
  const agreement: DelegationAgreement = {
    id: `deleg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  delegationAgreements = [...delegationAgreements, agreement];
  return agreement;
}

export function updateDelegationAgreement(
  id: string,
  updates: Partial<DelegationAgreement>
): DelegationAgreement | null {
  const index = delegationAgreements.findIndex((d) => d.id === id);
  if (index === -1) return null;
  delegationAgreements[index] = { ...delegationAgreements[index], ...updates };
  return delegationAgreements[index];
}

export function getDelegationAgreements(): DelegationAgreement[] {
  return [...delegationAgreements].sort(
    (a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
  );
}

export function getActiveDelegations(delegateName?: string): DelegationAgreement[] {
  const now = new Date();
  let result = delegationAgreements.filter(
    (d) => d.status === 'active' && new Date(d.expirationDate) > now
  );
  if (delegateName) {
    result = result.filter((d) => d.delegateName === delegateName);
  }
  return result;
}

export function checkDelegationRequirement(providerType: ProviderType): {
  required: boolean;
  description: string;
} {
  const scope = WA_SCOPE_OF_PRACTICE.find((s) => s.providerType === providerType);
  if (!scope) return { required: false, description: 'Unknown provider type' };

  if (!scope.requiresSupervision) {
    return { required: false, description: `${scope.label} can practice independently in WA state` };
  }

  return {
    required: true,
    description: `${scope.label} requires ${scope.supervisionType} supervision and a delegation agreement with a supervising physician`,
  };
}

// ── Provider Licenses ────────────────────────────────────────────────

export function addProviderLicense(params: Omit<ProviderLicense, 'id'>): ProviderLicense {
  const license: ProviderLicense = {
    id: `lic_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  providerLicenses = [...providerLicenses, license];
  return license;
}

export function updateProviderLicense(
  id: string,
  updates: Partial<ProviderLicense>
): ProviderLicense | null {
  const index = providerLicenses.findIndex((l) => l.id === id);
  if (index === -1) return null;
  providerLicenses[index] = { ...providerLicenses[index], ...updates };
  return providerLicenses[index];
}

export function getProviderLicenses(): ProviderLicense[] {
  return [...providerLicenses].sort(
    (a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
  );
}

export function getLicenseAlerts(): {
  expired: ProviderLicense[];
  expiringSoon: ProviderLicense[];
  ceDeficient: ProviderLicense[];
} {
  const now = new Date();
  const alertDays = 90;
  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + alertDays);

  return {
    expired: providerLicenses.filter(
      (l) => l.status === 'active' && new Date(l.expirationDate) <= now
    ),
    expiringSoon: providerLicenses.filter(
      (l) => l.status === 'active' && new Date(l.expirationDate) > now && new Date(l.expirationDate) <= alertDate
    ),
    ceDeficient: providerLicenses.filter(
      (l) => l.status === 'active' && l.ceCreditsCompleted < l.ceCreditsRequired
    ),
  };
}

export function getDaysUntilExpiry(license: ProviderLicense): number {
  const now = new Date();
  const expiry = new Date(license.expirationDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Licensing Compliance Score ───────────────────────────────────────

export function calculateLicensingScore(): {
  score: number;
  issues: number;
  details: { area: string; score: number; maxScore: number; issues: string[] }[];
} {
  const areas: { area: string; score: number; maxScore: number; issues: string[] }[] = [];
  const alerts = getLicenseAlerts();

  // License currency (40 points)
  let licenseScore = 40;
  const licenseIssues: string[] = [];
  if (alerts.expired.length > 0) {
    licenseScore -= alerts.expired.length * 20;
    licenseIssues.push(`${alerts.expired.length} expired license(s) - CRITICAL`);
  }
  if (alerts.expiringSoon.length > 0) {
    licenseScore -= alerts.expiringSoon.length * 5;
    licenseIssues.push(`${alerts.expiringSoon.length} license(s) expiring within 90 days`);
  }
  areas.push({ area: 'License Currency', score: Math.max(0, licenseScore), maxScore: 40, issues: licenseIssues });

  // CE compliance (30 points)
  let ceScore = 30;
  const ceIssues: string[] = [];
  if (alerts.ceDeficient.length > 0) {
    ceScore -= alerts.ceDeficient.length * 10;
    ceIssues.push(`${alerts.ceDeficient.length} provider(s) behind on CE credits`);
  }
  areas.push({ area: 'CE Compliance', score: Math.max(0, ceScore), maxScore: 30, issues: ceIssues });

  // Delegation agreements (30 points)
  let delegScore = 30;
  const delegIssues: string[] = [];
  const now = new Date();
  const expiredDelegations = delegationAgreements.filter(
    (d) => d.status === 'active' && new Date(d.expirationDate) <= now
  );
  if (expiredDelegations.length > 0) {
    delegScore -= expiredDelegations.length * 15;
    delegIssues.push(`${expiredDelegations.length} expired delegation agreement(s)`);
  }

  // Check that all supervised providers have active delegations
  const supervisedProviders = providerLicenses.filter((l) => {
    const scope = WA_SCOPE_OF_PRACTICE.find((s) => s.providerType === l.providerType);
    return scope?.requiresSupervision;
  });
  for (const provider of supervisedProviders) {
    const hasDelegation = delegationAgreements.some(
      (d) => d.delegateName === provider.providerName && d.status === 'active' && new Date(d.expirationDate) > now
    );
    if (!hasDelegation) {
      delegScore -= 10;
      delegIssues.push(`${provider.providerName} (${provider.providerType}) lacks active delegation agreement`);
    }
  }
  areas.push({ area: 'Delegation Agreements', score: Math.max(0, delegScore), maxScore: 30, issues: delegIssues });

  const totalScore = areas.reduce((sum, a) => sum + a.score, 0);
  const totalIssues = areas.reduce((sum, a) => sum + a.issues.length, 0);

  return { score: totalScore, issues: totalIssues, details: areas };
}

// ── Seed / Reset ─────────────────────────────────────────────────────

export function seedStateRegData(data: {
  delegationAgreements?: DelegationAgreement[];
  providerLicenses?: ProviderLicense[];
}): void {
  if (data.delegationAgreements) delegationAgreements = [...delegationAgreements, ...data.delegationAgreements];
  if (data.providerLicenses) providerLicenses = [...providerLicenses, ...data.providerLicenses];
}

export function clearStateRegData(): void {
  delegationAgreements = [];
  providerLicenses = [];
}
