// ─── Plan Templates ──────────────────────────────────────────────────────────
// Pre-built plan templates for common concern combos.
// Used as quick-start options in the plan builder dashboard.

import { getServiceById } from '@/data/services/unified-catalog';
import type { UnifiedService } from '@/data/services/unified-catalog';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  targetConcerns: string[];
  icon: string; // lucide icon name
  services: { serviceId: string; phase: 1 | 2 | 3; notes?: string }[];
}

// ─── Templates ───────────────────────────────────────────────────────────────

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'anti-aging-glow',
    name: 'Anti-Aging Glow',
    description:
      'A comprehensive anti-aging protocol that builds from foundational skin health to advanced collagen remodeling and long-term maintenance.',
    targetConcerns: ['aging-skin', 'wrinkles', 'fine-lines'],
    icon: 'Sparkles',
    services: [
      { serviceId: 'hydrafacial-signature', phase: 1, notes: 'Establish baseline skin health and deep hydration' },
      { serviceId: 'consultation', phase: 1, notes: 'Comprehensive skin assessment and personalized roadmap' },
      { serviceId: 'rf-micro-face', phase: 2, notes: 'Stimulate collagen production for firmness and texture' },
      { serviceId: 'sofwave-full-face', phase: 2, notes: 'Non-invasive deep tissue tightening for lasting lift' },
      { serviceId: 'vi-peel', phase: 3, notes: 'Refine texture and address remaining pigmentation' },
      { serviceId: 'tretinoin', phase: 3, notes: 'Long-term maintenance with prescription-strength retinoid' },
    ],
  },

  {
    id: 'clear-skin-journey',
    name: 'Clear Skin Journey',
    description:
      'Targeted acne and texture correction protocol progressing from surface clearing to deep skin remodeling and daily maintenance.',
    targetConcerns: ['acne', 'breakouts', 'texture'],
    icon: 'Shield',
    services: [
      { serviceId: 'hydrafacial-signature', phase: 1, notes: 'Deep cleansing, extraction, and hydration' },
      { serviceId: 'vi-peel', phase: 1, notes: 'VI Peel Purify to address active acne and congestion' },
      { serviceId: 'rf-micro-face', phase: 2, notes: 'Reduce acne scarring and improve texture' },
      { serviceId: 'biorepeel-face', phase: 2, notes: 'Zero-downtime peel for ongoing skin renewal' },
      { serviceId: 'skincare-kit', phase: 3, notes: 'Medical-grade daily regimen for long-term clarity' },
      { serviceId: 'tretinoin', phase: 3, notes: 'Prescription retinoid for acne prevention and cell turnover' },
    ],
  },

  {
    id: 'radiance-revival',
    name: 'Radiance Revival',
    description:
      'Brighten dull, sun-damaged skin and correct hyperpigmentation with a progressive protocol from surface renewal to laser precision.',
    targetConcerns: ['dull-skin', 'hyperpigmentation', 'sun-damage'],
    icon: 'Sun',
    services: [
      { serviceId: 'hydrafacial-signature', phase: 1, notes: 'Exfoliation, brightening serums, and antioxidant protection' },
      { serviceId: 'prx-t33', phase: 1, notes: 'Biorevitalization for deep hydration and glow without peeling' },
      { serviceId: 'laser-facial-ndyag', phase: 2, notes: 'Laser treatment targeting pigmentation and sun damage' },
      { serviceId: 'vi-peel', phase: 2, notes: 'VI Peel Precision Plus for stubborn hyperpigmentation' },
      { serviceId: 'tretinoin', phase: 3, notes: 'Accelerate cell turnover for even-toned skin' },
      { serviceId: 'glutathione-injection', phase: 3, notes: 'Master antioxidant injection for skin brightening from within' },
    ],
  },

  {
    id: 'body-transformation',
    name: 'Body Transformation',
    description:
      'Physician-supervised weight management with comprehensive labs, GLP-1 therapy, and wellness injection support.',
    targetConcerns: ['weight', 'body-contouring'],
    icon: 'Activity',
    services: [
      { serviceId: 'consultation', phase: 1, notes: 'Medical evaluation, BMI assessment, and program planning' },
      { serviceId: 'lab-wellness-screening', phase: 1, notes: 'Comprehensive blood panel for baseline health markers' },
      { serviceId: 'glp1-semaglutide-m1', phase: 2, notes: 'Begin GLP-1 therapy at starting dose with ongoing monitoring' },
      { serviceId: 'tri-immune-injection', phase: 3, notes: 'Immune and recovery support during weight loss' },
      { serviceId: 'b12-injection', phase: 3, notes: 'Energy support and metabolism boosting' },
    ],
  },

  {
    id: 'smooth-and-tight',
    name: 'Smooth & Tight',
    description:
      'Combat skin laxity with a progression from assessment to advanced tightening and injectable refinement.',
    targetConcerns: ['skin-laxity', 'sagging'],
    icon: 'TrendingUp',
    services: [
      { serviceId: 'consultation', phase: 1, notes: 'Assess skin laxity and develop a custom tightening plan' },
      { serviceId: 'hydrafacial-signature', phase: 1, notes: 'Prep skin with deep hydration and antioxidants' },
      { serviceId: 'sofwave-full-face-neck', phase: 2, notes: 'Non-invasive deep tissue tightening for face and neck' },
      { serviceId: 'rf-micro-face-neck', phase: 2, notes: 'RF microneedling for collagen stimulation and skin renewal' },
      { serviceId: 'dermal-fillers', phase: 3, notes: 'Restore lost volume in cheeks, jawline, or nasolabial folds' },
      { serviceId: 'botox', phase: 3, notes: 'Smooth dynamic wrinkles for a refined, lifted appearance' },
    ],
  },

  {
    id: 'acne-scar-revision',
    name: 'Acne Scarring Revision',
    description:
      'A targeted protocol for resurfacing acne scars and restoring smooth, even-toned skin through progressive collagen remodeling.',
    targetConcerns: ['acne-scars', 'texture'],
    icon: 'Eraser',
    services: [
      { serviceId: 'consultation', phase: 1, notes: 'Comprehensive scar assessment and personalized treatment roadmap' },
      { serviceId: 'hydrafacial-signature', phase: 1, notes: 'Deep cleansing and hydration to prepare skin for treatment' },
      { serviceId: 'rf-micro-face', phase: 2, notes: 'RF microneedling on scar-specific settings for collagen remodeling' },
      { serviceId: 'prx-t33', phase: 2, notes: 'Biorevitalization to boost collagen without peeling downtime' },
      { serviceId: 'vi-peel', phase: 3, notes: 'Medical-grade peel to refine texture and even skin tone' },
      { serviceId: 'tretinoin', phase: 3, notes: 'Prescription retinoid for ongoing cell turnover and scar fading' },
    ],
  },

  {
    id: 'bridal-glow',
    name: 'Bridal Glow',
    description:
      'An event-driven radiance protocol designed to deliver luminous, camera-ready skin from prep through your big day.',
    targetConcerns: ['dull-skin', 'aging-skin'],
    icon: 'Heart',
    services: [
      { serviceId: 'hydrafacial-signature', phase: 1, notes: 'Establish glowing baseline with deep hydration and extraction' },
      { serviceId: 'vi-peel', phase: 1, notes: 'Brighten and refine skin texture for an even canvas' },
      { serviceId: 'botox', phase: 2, notes: 'Smooth forehead and crow\'s feet for a refreshed look' },
      { serviceId: 'dermal-fillers', phase: 2, notes: 'Subtle volume restoration for youthful contours' },
      { serviceId: 'hydrafacial-keravive', phase: 3, notes: 'Scalp health treatment for lustrous, healthy hair' },
      { serviceId: 'glutathione-injection', phase: 3, notes: 'Master antioxidant injection for luminous skin from within' },
    ],
  },

  {
    id: 'post-summer-repair',
    name: 'Post-Summer Repair',
    description:
      'Reverse sun damage and hyperpigmentation with a progressive protocol from surface renewal to targeted laser correction.',
    targetConcerns: ['sun-damage', 'hyperpigmentation'],
    icon: 'CloudSun',
    services: [
      { serviceId: 'hydrafacial-signature', phase: 1, notes: 'Remove surface damage with deep exfoliation and antioxidant protection' },
      { serviceId: 'consultation', phase: 1, notes: 'Sun damage assessment and customized correction plan' },
      { serviceId: 'laser-facial-ndyag', phase: 2, notes: 'Targeted laser treatment for pigmentation and sun spots' },
      { serviceId: 'vi-peel', phase: 2, notes: 'VI Peel Precision Plus for stubborn sun-induced discoloration' },
      { serviceId: 'tretinoin', phase: 3, notes: 'Accelerate cell turnover and fade residual pigmentation' },
      { serviceId: 'glutathione-injection', phase: 3, notes: 'Antioxidant injection to brighten skin and prevent future damage' },
    ],
  },

  {
    id: 'laser-hair-starter',
    name: 'Laser Hair Removal Starter',
    description:
      'A complete laser hair removal program from initial consultation through full treatment course and maintenance sessions.',
    targetConcerns: ['unwanted-hair'],
    icon: 'Zap',
    services: [
      { serviceId: 'consultation', phase: 1, notes: 'Skin and hair type assessment, area selection, and treatment planning' },
      { serviceId: 'lhr-full-brazilian', phase: 1, notes: 'First session — choose your treatment area (Brazilian shown as example)' },
      { serviceId: 'lhr-full-brazilian', phase: 2, notes: 'Continue treatment sessions every 4-6 weeks for optimal results' },
      { serviceId: 'lhr-full-brazilian', phase: 3, notes: 'Maintenance sessions to address any regrowth' },
    ],
  },

  {
    id: 'mommy-refresh',
    name: 'Mommy Refresh',
    description:
      'Rejuvenate post-pregnancy skin with a gentle progression from hydration to advanced tightening and maintenance.',
    targetConcerns: ['skin-laxity', 'aging-skin', 'body-contouring'],
    icon: 'Baby',
    services: [
      { serviceId: 'hydrafacial-signature', phase: 1, notes: 'Restore hydration and glow after the demands of motherhood' },
      { serviceId: 'consultation', phase: 1, notes: 'Comprehensive assessment of skin laxity and treatment goals' },
      { serviceId: 'sofwave-full-face', phase: 2, notes: 'Non-invasive face lifting and tightening for facial rejuvenation' },
      { serviceId: 'rf-micro-abdomen-small', phase: 2, notes: 'RF microneedling for abdominal skin tightening and stretch marks' },
      { serviceId: 'botox', phase: 3, notes: 'Targeted wrinkle smoothing for a refreshed, rested appearance' },
      { serviceId: 'tretinoin', phase: 3, notes: 'Long-term maintenance with prescription-strength retinoid' },
    ],
  },

  {
    id: 'maintenance-beauty',
    name: 'Maintenance Beauty Plan',
    description:
      'A recurring beauty maintenance protocol for existing clients who want to sustain results and keep skin in peak condition.',
    targetConcerns: ['aging-skin'],
    icon: 'RefreshCw',
    services: [
      { serviceId: 'hydrafacial-signature', phase: 1, notes: 'Quarterly deep cleansing and hydration refresh' },
      { serviceId: 'botox', phase: 2, notes: 'Maintenance neuromodulator touch-up every 3-4 months' },
      { serviceId: 'vi-peel', phase: 2, notes: 'Seasonal peel to maintain texture and tone' },
      { serviceId: 'tretinoin', phase: 3, notes: 'Ongoing prescription retinoid for daily anti-aging' },
      { serviceId: 'b12-injection', phase: 3, notes: 'Monthly energy and wellness boost' },
    ],
  },

  {
    id: 'skin-tightening-focus',
    name: 'Skin Tightening Focus',
    description:
      'An intensive skin tightening protocol combining the most advanced non-invasive technologies for visible lifting and firming.',
    targetConcerns: ['skin-laxity', 'aging-skin'],
    icon: 'ArrowUpCircle',
    services: [
      { serviceId: 'consultation', phase: 1, notes: 'Detailed laxity mapping and personalized tightening strategy' },
      { serviceId: 'hydrafacial-signature', phase: 1, notes: 'Prep skin with hydration and antioxidants for optimal treatment response' },
      { serviceId: 'sofwave-full-face-neck', phase: 2, notes: 'Deep tissue tightening with SUPERB technology for face and neck' },
      { serviceId: 'rf-micro-face-neck', phase: 2, notes: 'RF microneedling for collagen and elastin stimulation' },
      { serviceId: 'prx-t33', phase: 3, notes: 'Biorevitalization for ongoing collagen support without downtime' },
      { serviceId: 'tretinoin', phase: 3, notes: 'Prescription retinoid for long-term skin renewal and firmness' },
    ],
  },
];

// ─── Lookup Helpers ──────────────────────────────────────────────────────────

/**
 * Get a plan template by its ID.
 */
export function getTemplate(id: string): PlanTemplate | null {
  return PLAN_TEMPLATES.find((t) => t.id === id) ?? null;
}

/**
 * Get all templates that match at least one of the provided concerns.
 * Results are sorted by the number of matching concerns (most relevant first).
 */
export function getTemplatesForConcerns(concerns: string[]): PlanTemplate[] {
  if (!concerns.length) return [];

  const lowerConcerns = concerns.map((c) => c.toLowerCase());

  return PLAN_TEMPLATES.filter((t) =>
    t.targetConcerns.some((tc) => lowerConcerns.includes(tc.toLowerCase()))
  ).sort((a, b) => {
    const aMatches = a.targetConcerns.filter((tc) =>
      lowerConcerns.includes(tc.toLowerCase())
    ).length;
    const bMatches = b.targetConcerns.filter((tc) =>
      lowerConcerns.includes(tc.toLowerCase())
    ).length;
    return bMatches - aMatches;
  });
}

/**
 * Resolve a template's service references to full UnifiedService objects.
 * Returns services paired with their phase and notes. Skips any services
 * whose ID is not found in the catalog.
 */
export function resolveTemplateServices(
  template: PlanTemplate
): { service: UnifiedService; phase: 1 | 2 | 3; notes?: string }[] {
  return template.services
    .map((entry) => {
      const service = getServiceById(entry.serviceId);
      if (!service) return null;
      return { service, phase: entry.phase, notes: entry.notes };
    })
    .filter(Boolean) as { service: UnifiedService; phase: 1 | 2 | 3; notes?: string }[];
}
