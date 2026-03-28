/**
 * Mangomint Tag Definitions
 * Rani Beauty Clinic
 *
 * All tags used in Mangomint for patient segmentation,
 * automation triggers, and reporting.
 */

import type { MangomintTag, TagCategory } from '../../lib/medical/types';

// ============================================================
// SERVICE TAGS
// ============================================================

export const SERVICE_TAGS: MangomintTag[] = [
  {
    id: 'tag-glp1-patient',
    name: 'GLP1-PATIENT',
    category: 'service',
    description: 'Patient is enrolled in a GLP-1 weight loss program (Semaglutide or Tirzepatide).',
    autoApply: true,
    triggerCondition: 'Applied when patient is enrolled in any GLP-1 service.',
  },
  {
    id: 'tag-peptide-patient',
    name: 'PEPTIDE-PATIENT',
    category: 'service',
    description: 'Patient is receiving peptide therapy (NAD+, Sermorelin, BPC-157, etc.).',
    autoApply: true,
    triggerCondition: 'Applied when patient is enrolled in any peptide service.',
  },
  {
    id: 'tag-hormone-patient',
    name: 'HORMONE-PATIENT',
    category: 'service',
    description: 'Patient is receiving hormone optimization therapy (Testosterone, Thyroid, DHEA).',
    autoApply: true,
    triggerCondition: 'Applied when patient is enrolled in any hormone service.',
  },
  {
    id: 'tag-wellness-patient',
    name: 'WELLNESS-PATIENT',
    category: 'service',
    description: 'Patient receives wellness injections (B12, Biotin, Glutathione, etc.).',
    autoApply: true,
    triggerCondition: 'Applied when patient books any wellness injection service.',
  },
];

// ============================================================
// DOSE TAGS
// ============================================================

export const DOSE_TAGS: MangomintTag[] = [
  {
    id: 'tag-sema-d1',
    name: 'SEMA-D1',
    category: 'dose',
    description: 'Semaglutide Dose 1 (0.25mg weekly). Starting dose.',
    autoApply: true,
    triggerCondition: 'Applied at treatment start for semaglutide patients.',
  },
  {
    id: 'tag-sema-d2',
    name: 'SEMA-D2',
    category: 'dose',
    description: 'Semaglutide Dose 2 (0.5mg weekly). First titration.',
    autoApply: true,
    triggerCondition: 'Applied when patient titrates up from D1.',
  },
  {
    id: 'tag-sema-d3',
    name: 'SEMA-D3',
    category: 'dose',
    description: 'Semaglutide Dose 3 (1.0mg weekly). Second titration.',
    autoApply: true,
    triggerCondition: 'Applied when patient titrates up from D2.',
  },
  {
    id: 'tag-sema-d4',
    name: 'SEMA-D4',
    category: 'dose',
    description: 'Semaglutide Dose 4 (2.4mg weekly). Maintenance dose.',
    autoApply: true,
    triggerCondition: 'Applied when patient titrates up from D3.',
  },
  {
    id: 'tag-tirz-d1',
    name: 'TIRZ-D1',
    category: 'dose',
    description: 'Tirzepatide Dose 1 (2.5mg weekly). Starting dose.',
    autoApply: true,
    triggerCondition: 'Applied at treatment start for tirzepatide patients.',
  },
  {
    id: 'tag-tirz-d2',
    name: 'TIRZ-D2',
    category: 'dose',
    description: 'Tirzepatide Dose 2 (5.0mg weekly). First titration.',
    autoApply: true,
    triggerCondition: 'Applied when patient titrates up from D1.',
  },
  {
    id: 'tag-tirz-d3',
    name: 'TIRZ-D3',
    category: 'dose',
    description: 'Tirzepatide Dose 3 (10.0mg weekly). Second titration.',
    autoApply: true,
    triggerCondition: 'Applied when patient titrates up from D2.',
  },
  {
    id: 'tag-tirz-d4',
    name: 'TIRZ-D4',
    category: 'dose',
    description: 'Tirzepatide Dose 4 (15.0mg weekly). Maintenance dose.',
    autoApply: true,
    triggerCondition: 'Applied when patient titrates up from D3.',
  },
];

// ============================================================
// STATUS TAGS
// ============================================================

export const STATUS_TAGS: MangomintTag[] = [
  {
    id: 'tag-follow-up-due',
    name: 'FOLLOW-UP-DUE',
    category: 'status',
    description: 'Patient has a follow-up check-in due (monthly or weekly).',
    autoApply: true,
    triggerCondition: 'Applied when check-in date arrives. Removed after check-in is completed.',
  },
  {
    id: 'tag-refill-due',
    name: 'REFILL-DUE',
    category: 'status',
    description: 'Patient has a medication refill due within the next 7 days.',
    autoApply: true,
    triggerCondition: 'Applied 7 days before refill due date. Removed after refill is processed.',
  },
  {
    id: 'tag-labs-due',
    name: 'LABS-DUE',
    category: 'status',
    description: 'Patient needs to complete or renew lab work.',
    autoApply: true,
    triggerCondition: 'Applied when initial labs are needed or quarterly labs are due.',
  },
  {
    id: 'tag-at-risk',
    name: 'AT-RISK',
    category: 'status',
    description: 'Patient is at risk of churning. Missed refill, no response, or declining engagement.',
    autoApply: true,
    triggerCondition: 'Applied when refill is 5+ days overdue or no contact for 30+ days.',
  },
  {
    id: 'tag-vip',
    name: 'VIP',
    category: 'status',
    description: 'VIP patient. Enrolled in VIP Transform program or high-value multi-service patient.',
    autoApply: false,
    triggerCondition: 'Manually applied for VIP Transform enrollees or patients spending $800+/mo.',
  },
  {
    id: 'tag-referral-source',
    name: 'REFERRAL-SOURCE',
    category: 'status',
    description: 'Patient has referred other patients to the clinic.',
    autoApply: false,
    triggerCondition: 'Applied when patient successfully refers a new patient.',
  },
  {
    id: 'tag-md-review-needed',
    name: 'MD-REVIEW-NEEDED',
    category: 'status',
    description: 'Patient has soft-flag contraindications requiring physician review.',
    autoApply: true,
    triggerCondition: 'Applied when intake contraindication screening flags soft conditions.',
  },
  {
    id: 'tag-gfe-pending',
    name: 'GFE-PENDING',
    category: 'status',
    description: 'Patient needs to complete Good Faith Exam via Qualiphy.',
    autoApply: true,
    triggerCondition: 'Applied when labs are received and GFE is the next step.',
  },
  {
    id: 'tag-gfe-expiring',
    name: 'GFE-EXPIRING',
    category: 'status',
    description: 'Patient GFE expires within 30 days. Renewal needed.',
    autoApply: true,
    triggerCondition: 'Applied 30 days before GFE expiration date.',
  },
  {
    id: 'tag-new-patient',
    name: 'NEW-PATIENT',
    category: 'status',
    description: 'Patient entered the pipeline within the last 14 days.',
    autoApply: true,
    triggerCondition: 'Applied on intake. Removed after 14 days or when patient reaches ACTIVE_PATIENT.',
  },
  {
    id: 'tag-payment-issue',
    name: 'PAYMENT-ISSUE',
    category: 'status',
    description: 'Patient has a failed payment that needs resolution.',
    autoApply: true,
    triggerCondition: 'Applied when a payment fails. Removed when resolved.',
  },
];

// ============================================================
// REVENUE TAGS
// ============================================================

export const REVENUE_TAGS: MangomintTag[] = [
  {
    id: 'tag-high-value',
    name: 'HIGH-VALUE',
    category: 'revenue',
    description: 'Patient spending $500+ per month across all services.',
    autoApply: true,
    triggerCondition: 'Applied when monthly spend exceeds $500. Reassessed monthly.',
  },
  {
    id: 'tag-cross-sell-ready',
    name: 'CROSS-SELL-READY',
    category: 'revenue',
    description: 'Patient is eligible for cross-sell based on tenure and satisfaction.',
    autoApply: true,
    triggerCondition: 'Applied when patient has been active 2+ months with satisfaction 7+.',
  },
  {
    id: 'tag-upgrade-candidate',
    name: 'UPGRADE-CANDIDATE',
    category: 'revenue',
    description: 'Patient on monthly plan who may benefit from VIP Transform upgrade.',
    autoApply: true,
    triggerCondition: 'Applied for GLP-1 monthly patients with 2+ months, satisfaction 8+.',
  },
];

// ============================================================
// ALL TAGS
// ============================================================

/** Complete list of all Mangomint tags */
export const ALL_TAGS: MangomintTag[] = [
  ...SERVICE_TAGS,
  ...DOSE_TAGS,
  ...STATUS_TAGS,
  ...REVENUE_TAGS,
];

/** Tags by category */
export const TAGS_BY_CATEGORY: Record<TagCategory, MangomintTag[]> = {
  service: SERVICE_TAGS,
  dose: DOSE_TAGS,
  status: STATUS_TAGS,
  revenue: REVENUE_TAGS,
};

// ============================================================
// TAG HELPERS
// ============================================================

/**
 * Finds a tag by name.
 */
export function getTagByName(name: string): MangomintTag | undefined {
  return ALL_TAGS.find((t) => t.name === name);
}

/**
 * Returns all auto-applied tags.
 */
export function getAutoApplyTags(): MangomintTag[] {
  return ALL_TAGS.filter((t) => t.autoApply);
}

/**
 * Returns tag names for a category.
 */
export function getTagNamesByCategory(category: TagCategory): string[] {
  return (TAGS_BY_CATEGORY[category] ?? []).map((t) => t.name);
}

/**
 * Returns a formatted tag reference sheet.
 */
export function formatTagReference(): string {
  const lines = ['Mangomint Tag Reference', '='.repeat(50), ''];

  for (const [category, tags] of Object.entries(TAGS_BY_CATEGORY)) {
    lines.push(`${category.toUpperCase()} TAGS:`);
    for (const tag of tags) {
      const auto = tag.autoApply ? '[Auto]' : '[Manual]';
      lines.push(`  ${tag.name.padEnd(22)} ${auto.padEnd(10)} ${tag.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
