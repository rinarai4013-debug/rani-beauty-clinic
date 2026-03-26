/**
 * Consent Manager
 * Treatment-specific informed consent templates, version tracking,
 * signature verification, expiry rules.
 */

import type { ConsentTemplate, SignedConsent } from '@/types/compliance';
import { CONSENT_TEMPLATES } from '@/data/compliance/consents';
import { createAuditEntry } from './audit-trail';

// ── In-memory stores ─────────────────────────────────────────────────

let signedConsents: SignedConsent[] = [];

// ── Template Management ──────────────────────────────────────────────

export function getConsentTemplates(category?: ConsentTemplate['treatmentCategory']): ConsentTemplate[] {
  let templates = [...CONSENT_TEMPLATES];
  if (category) {
    templates = templates.filter((t) => t.treatmentCategory === category);
  }
  return templates.filter((t) => t.status === 'active');
}

export function getConsentTemplate(id: string): ConsentTemplate | undefined {
  return CONSENT_TEMPLATES.find((t) => t.id === id);
}

export function getConsentTemplateByTreatment(treatmentName: string): ConsentTemplate | undefined {
  return CONSENT_TEMPLATES.find(
    (t) => t.treatmentName.toLowerCase() === treatmentName.toLowerCase() && t.status === 'active'
  );
}

// ── Consent Signing ──────────────────────────────────────────────────

export function signConsent(params: Omit<SignedConsent, 'id' | 'expirationDate' | 'status'>): SignedConsent {
  const template = getConsentTemplate(params.templateId);
  if (!template) {
    throw new Error(`Consent template ${params.templateId} not found`);
  }

  // Calculate expiration based on template rules
  const signedDate = new Date(params.signedDate);
  const expirationDate = new Date(signedDate);
  expirationDate.setDate(expirationDate.getDate() + template.expiryDays);

  // Validate signature
  if (!params.signatureData || params.signatureData.length < 100) {
    throw new Error('Invalid signature data');
  }

  // Validate witness if required
  if (template.requiresWitness && !params.witnessName) {
    throw new Error(`Consent for ${template.treatmentName} requires a witness`);
  }

  // Validate provider signature if required
  if (template.requiresProviderSignature && !params.providerSignature) {
    throw new Error(`Consent for ${template.treatmentName} requires provider signature`);
  }

  // Supersede any existing active consent for same patient + template
  signedConsents = signedConsents.map((c) => {
    if (
      c.patientId === params.patientId &&
      c.templateId === params.templateId &&
      c.status === 'active'
    ) {
      return { ...c, status: 'superseded' as const };
    }
    return c;
  });

  const consent: SignedConsent = {
    id: `consent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    expirationDate: expirationDate.toISOString().split('T')[0],
    status: 'active',
    ...params,
  };
  signedConsents = [...signedConsents, consent];

  createAuditEntry({
    userId: params.providerId,
    userName: params.providerName,
    userRole: 'provider',
    action: 'consent_sign',
    resourceType: 'consent',
    resourceId: consent.id,
    details: `Patient ${params.patientName} signed consent for ${params.treatmentName} (template v${params.templateVersion})`,
    ipAddress: '0.0.0.0',
  });

  return consent;
}

export function revokeConsent(
  id: string,
  reason: string,
  revokedBy: string
): SignedConsent | null {
  const index = signedConsents.findIndex((c) => c.id === id);
  if (index === -1) return null;

  signedConsents[index] = {
    ...signedConsents[index],
    status: 'revoked',
    revokedDate: new Date().toISOString().split('T')[0],
    revokedReason: reason,
  };

  createAuditEntry({
    userId: revokedBy,
    userName: revokedBy,
    userRole: 'provider',
    action: 'consent_revoke',
    resourceType: 'consent',
    resourceId: id,
    details: `Consent revoked for ${signedConsents[index].treatmentName}: ${reason}`,
    ipAddress: '0.0.0.0',
  });

  return signedConsents[index];
}

// ── Consent Queries ──────────────────────────────────────────────────

export function getSignedConsents(filters?: {
  patientId?: string;
  templateId?: string;
  status?: SignedConsent['status'];
}): SignedConsent[] {
  let result = [...signedConsents];
  if (filters?.patientId) result = result.filter((c) => c.patientId === filters.patientId);
  if (filters?.templateId) result = result.filter((c) => c.templateId === filters.templateId);
  if (filters?.status) result = result.filter((c) => c.status === filters.status);
  return result.sort(
    (a, b) => new Date(b.signedDate).getTime() - new Date(a.signedDate).getTime()
  );
}

export function getActiveConsent(
  patientId: string,
  treatmentName: string
): SignedConsent | undefined {
  const now = new Date();
  return signedConsents.find(
    (c) =>
      c.patientId === patientId &&
      c.treatmentName.toLowerCase() === treatmentName.toLowerCase() &&
      c.status === 'active' &&
      new Date(c.expirationDate) > now
  );
}

export function hasValidConsent(patientId: string, treatmentName: string): boolean {
  return !!getActiveConsent(patientId, treatmentName);
}

// ── Consent Validation ───────────────────────────────────────────────

export interface ConsentValidation {
  valid: boolean;
  issues: string[];
  consent?: SignedConsent;
}

export function validateConsentForTreatment(
  patientId: string,
  treatmentName: string
): ConsentValidation {
  const issues: string[] = [];

  // Check if template exists
  const template = getConsentTemplateByTreatment(treatmentName);
  if (!template) {
    return {
      valid: false,
      issues: [`No consent template found for ${treatmentName}`],
    };
  }

  // Check for active consent
  const consent = getActiveConsent(patientId, treatmentName);
  if (!consent) {
    // Check if there's an expired one
    const expiredConsent = signedConsents.find(
      (c) =>
        c.patientId === patientId &&
        c.treatmentName.toLowerCase() === treatmentName.toLowerCase() &&
        c.status === 'active' &&
        new Date(c.expirationDate) <= new Date()
    );
    if (expiredConsent) {
      issues.push(`Consent expired on ${expiredConsent.expirationDate}. New consent required.`);
    } else {
      issues.push(`No signed consent found for ${treatmentName}. Consent must be obtained before treatment.`);
    }
    return { valid: false, issues };
  }

  // Verify version matches current template
  if (consent.templateVersion !== template.version) {
    issues.push(
      `Consent was signed for version ${consent.templateVersion}, current template is version ${template.version}. Consider re-consent.`
    );
  }

  // Check expiration proximity
  const daysUntilExpiry = Math.ceil(
    (new Date(consent.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntilExpiry <= 7) {
    issues.push(`Consent expires in ${daysUntilExpiry} day(s). Consider renewal.`);
  }

  return {
    valid: issues.length === 0 || !issues.some((i) => i.includes('required') || i.includes('expired')),
    issues,
    consent,
  };
}

// ── Expiration Tracking ──────────────────────────────────────────────

export function getExpiringConsents(days: number = 30): SignedConsent[] {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return signedConsents.filter(
    (c) =>
      c.status === 'active' &&
      new Date(c.expirationDate) > now &&
      new Date(c.expirationDate) <= futureDate
  );
}

export function getExpiredConsents(): SignedConsent[] {
  const now = new Date();
  return signedConsents.filter(
    (c) => c.status === 'active' && new Date(c.expirationDate) <= now
  );
}

// ── Consent Compliance Score ─────────────────────────────────────────

export function calculateConsentScore(): {
  score: number;
  issues: number;
  details: { area: string; score: number; maxScore: number; issues: string[] }[];
} {
  const areas: { area: string; score: number; maxScore: number; issues: string[] }[] = [];

  // Active templates (30 points)
  let templateScore = 30;
  const templateIssues: string[] = [];
  const activeTemplates = CONSENT_TEMPLATES.filter((t) => t.status === 'active');
  if (activeTemplates.length < 20) {
    templateScore -= 10;
    templateIssues.push(`Only ${activeTemplates.length} active consent templates (recommended: 25+)`);
  }
  areas.push({ area: 'Template Coverage', score: templateScore, maxScore: 30, issues: templateIssues });

  // Expired consents (35 points)
  let expiredScore = 35;
  const expiredIssues: string[] = [];
  const expired = getExpiredConsents();
  if (expired.length > 0) {
    expiredScore -= Math.min(expired.length * 5, 35);
    expiredIssues.push(`${expired.length} expired consent(s) still marked as active`);
  }
  areas.push({ area: 'Consent Currency', score: Math.max(0, expiredScore), maxScore: 35, issues: expiredIssues });

  // Expiring soon (15 points)
  let expiringScore = 15;
  const expiringIssues: string[] = [];
  const expiringSoon = getExpiringConsents(14);
  if (expiringSoon.length > 0) {
    expiringScore -= Math.min(expiringSoon.length * 3, 15);
    expiringIssues.push(`${expiringSoon.length} consent(s) expiring within 14 days`);
  }
  areas.push({ area: 'Upcoming Expirations', score: Math.max(0, expiringScore), maxScore: 15, issues: expiringIssues });

  // Signature completeness (20 points)
  let sigScore = 20;
  const sigIssues: string[] = [];
  const activeConsents = signedConsents.filter((c) => c.status === 'active');
  const missingProviderSig = activeConsents.filter((c) => {
    const template = getConsentTemplate(c.templateId);
    return template?.requiresProviderSignature && !c.providerSignature;
  });
  if (missingProviderSig.length > 0) {
    sigScore -= missingProviderSig.length * 5;
    sigIssues.push(`${missingProviderSig.length} consent(s) missing required provider signature`);
  }
  areas.push({ area: 'Signature Completeness', score: Math.max(0, sigScore), maxScore: 20, issues: sigIssues });

  const totalScore = areas.reduce((sum, a) => sum + a.score, 0);
  const totalIssues = areas.reduce((sum, a) => sum + a.issues.length, 0);

  return { score: totalScore, issues: totalIssues, details: areas };
}

// ── Seed / Reset ─────────────────────────────────────────────────────

export function seedConsentData(data: { signedConsents?: SignedConsent[] }): void {
  if (data.signedConsents) signedConsents = [...signedConsents, ...data.signedConsents];
}

export function clearConsentData(): void {
  signedConsents = [];
}
