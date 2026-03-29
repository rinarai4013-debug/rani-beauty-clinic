// ─── Provider-Facing Notes Generator ────────────────────────────────────────
// Internal clinician notes for treatment plan consultation strategy.

import type { PlanPhase, GeneratedPackage, BuilderClient } from './types';

export interface ProviderNotes {
  consultAngle: string;
  likelyObjections: { objection: string; response: string }[];
  highConvertingPackage: string;
  entryOfferFallback: string;
  upsellPath: string;
  maintenancePathway: string;
  quickWinService: string;
  anchorService: string;
}

// ─── Concern-Based Consultation Angles ──────────────────────────────

const CONCERN_ANGLES: Record<string, string> = {
  'aging-skin': 'Lead with visible age-reversal timeline — show how Phase 1 establishes baseline, Phase 2 activates collagen, and Phase 3 locks in results.',
  'acne': 'Start with skin health score improvement — emphasize the clear-skin journey from congestion to clarity with measurable results at each phase.',
  'hyperpigmentation': 'Open with the brightening transformation arc — dark spots fade noticeably within weeks of Phase 1, building confidence for deeper treatments.',
  'skin-laxity': 'Anchor on the lifting effect — demonstrate the non-surgical facelift progression with Sofwave + RF microneedling combination results.',
  'dull-skin': 'Lead with the instant glow factor — HydraFacial gives same-day visible results that build momentum for the full plan.',
  'sun-damage': 'Frame as post-summer skin rescue — position the laser + peel combination as the proven protocol for reversing UV-related damage.',
  'unwanted-hair': 'Emphasize the freedom narrative — fewer razor bumps, ingrowns, and daily hassle. Each session brings permanent reduction.',
  'body-contouring': 'Lead with the physician-supervised approach — position as a medically-managed program, not a quick fix, for sustainable transformation.',
  'acne-scars': 'Open with scar revision technology — RF microneedling remodels scar tissue from the inside out, with progressive improvement over each session.',
  'texture': 'Frame around skin refinement — the combination approach addresses texture at multiple depths for comprehensive smoothing.',
  'wrinkles': 'Start with preventive aging strategy — Botox prevents deepening while collagen treatments restore what\'s already lost.',
  'fine-lines': 'Lead with the subtle refresh — clients see natural-looking improvement without looking "done," which builds trust for deeper treatments.',
};

const DEFAULT_ANGLE = 'Lead with personalized care — show you understand their unique concerns and have built a step-by-step plan tailored to their goals.';

// ─── Quick Win & Anchor Identification ──────────────────────────────

const QUICK_WIN_SERVICES = [
  'hydrafacial-signature',
  'hydrafacial-express',
  'vi-peel',
  'prx-t33',
  'botox',
  'glutathione-injection',
  'b12-injection',
];

const ANCHOR_SERVICES = [
  'sofwave-full-face-neck',
  'sofwave-full-face',
  'rf-micro-face-neck',
  'rf-micro-face',
  'rf-micro-abdomen-large',
  'rf-micro-abdomen-small',
  'laser-facial-ndyag',
  'scar-combination',
  'dermal-fillers',
  'glp1-semaglutide-m1',
];

// ─── Objection Generation ───────────────────────────────────────────

function generateObjections(
  phases: [PlanPhase, PlanPhase, PlanPhase],
  packages: GeneratedPackage[]
): { objection: string; response: string }[] {
  const objections: { objection: string; response: string }[] = [];
  const transformPkg = packages.find((p) => p.tier === 'Transform' || p.highlighted);
  const startPkg = packages.find((p) => p.tier === 'Start' || p.tier === 'Essential');

  const allServices = [...phases[0].services, ...phases[1].services, ...phases[2].services];
  const hasRFMicro = allServices.some((s) => s.serviceId.includes('rf-micro'));
  const hasLaser = allServices.some((s) => s.serviceId.includes('laser') || s.serviceId.includes('lhr'));
  const hasSofwave = allServices.some((s) => s.serviceId.includes('sofwave'));
  const phase1Count = phases[0].services.length;
  const totalSessions = allServices.reduce((sum, s) => sum + s.quantity * s.service.sessions, 0);

  // Price objection
  if (transformPkg) {
    const monthly = transformPkg.monthlyPayment12;
    objections.push({
      objection: "That's more than I expected",
      response: `Let's look at the Transform package — at ${formatMoney(monthly)}/month via Cherry, it's less than a daily coffee habit. And unlike coffee, these results compound over time. We can also start with the ${startPkg?.name || 'Start'} package and upgrade when you see your Phase 1 results.`,
    });
  } else {
    const totalValue = allServices.reduce((sum, s) => sum + s.service.price * s.quantity * s.service.sessions, 0);
    objections.push({
      objection: "That's more than I expected",
      response: `I understand — the full investment is ${formatMoney(totalValue)}, but we offer Cherry and PatientFi financing to break it into comfortable monthly payments. Plus, your consultation deposit applies to your first treatment.`,
    });
  }

  // Pain objection
  if (hasRFMicro) {
    objections.push({
      objection: 'Does RF microneedling hurt?',
      response: 'We use topical numbing cream applied 30 minutes before treatment — most clients rate the sensation a 3/10. The HydraFacial in Phase 1 is completely comfortable, so you\'ll ease into the process.',
    });
  } else if (hasLaser) {
    objections.push({
      objection: 'Is the laser treatment painful?',
      response: 'Most clients describe it as a warm snapping sensation. We use cooling technology and can adjust settings for your comfort level. Phase 1 treatments are gentle, building your confidence before the laser sessions.',
    });
  } else if (hasSofwave) {
    objections.push({
      objection: 'What does Sofwave feel like?',
      response: 'Sofwave uses ultrasound energy — you\'ll feel warmth and occasional brief sensations. Most clients tolerate it very well, and there\'s no downtime. You can return to normal activities immediately.',
    });
  } else {
    objections.push({
      objection: 'Will any of these treatments be uncomfortable?',
      response: 'Your comfort is our priority. We use numbing and cooling techniques as needed. Phase 1 starts with our most gentle treatments so you experience the process before moving to more advanced options.',
    });
  }

  // Time/commitment objection
  objections.push({
    objection: `That's a lot of appointments — ${totalSessions} sessions seems like a big commitment`,
    response: `Phase 1 is just ${phase1Count} visit${phase1Count !== 1 ? 's' : ''} — that's your quick-win starting point. We space everything to fit your schedule, and most sessions are ${allServices[0]?.service.duration || 30}-90 minutes. You'll see results early, which makes each subsequent visit motivating.`,
  });

  // Results objection
  objections.push({
    objection: "How do I know it'll work for me?",
    response: 'Your Phase 1 results are visible in the first visit — that\'s your proof point before committing deeper. We also take before photos at every stage so you can track your transformation objectively. Our protocols are clinically proven, and we adjust based on how your skin responds.',
  });

  return objections;
}

// ─── Main Generator ─────────────────────────────────────────────────

export function generateProviderNotes(
  phases: [PlanPhase, PlanPhase, PlanPhase],
  client: BuilderClient | null,
  packages: GeneratedPackage[]
): ProviderNotes {
  const allServices = [...phases[0].services, ...phases[1].services, ...phases[2].services];
  const concerns = client?.skinConcerns || [];

  // Consultation angle
  let consultAngle = DEFAULT_ANGLE;
  for (const concern of concerns) {
    const lower = concern.toLowerCase();
    if (CONCERN_ANGLES[lower]) {
      consultAngle = CONCERN_ANGLES[lower];
      break;
    }
  }
  if (concerns.length > 1) {
    consultAngle += ` Since they have multiple concerns (${concerns.slice(0, 3).join(', ')}), prioritize what bothers them most and show how the phases address each concern sequentially.`;
  }

  // High converting package pitch
  const transformPkg = packages.find((p) => p.tier === 'Transform' || p.highlighted);
  const highConvertingPackage = transformPkg
    ? `Always recommend Transform first — "${transformPkg.name}" at ${formatMoney(transformPkg.price)} offers the best balance of results and value. ${transformPkg.savingsVsStandalone ? `They save ${formatMoney(transformPkg.savingsVsStandalone)} vs. standalone pricing.` : `That's ${transformPkg.discount}% off standalone.`} Position it as: "This is what I'd choose for my own family."`
    : 'Recommend the middle-tier package — it offers the best results-to-value ratio. Frame it as the "sweet spot" between getting started and going all-in.';

  // Entry offer fallback
  const startPkg = packages.find((p) => p.tier === 'Start' || p.tier === 'Essential');
  const entryOfferFallback = startPkg
    ? `If they resist Transform, pivot to "${startPkg.name}" at ${formatMoney(startPkg.price)} (${formatMoney(startPkg.monthlyPayment12)}/mo). Say: "Let's start here — you'll see results from Phase 1, and we can always expand your plan." Keep the door open for upgrading after their first treatment.`
    : 'If the full plan feels like too much, offer to start with Phase 1 services only. The consultation deposit applies to treatment, so there\'s no risk in starting. Once they experience results firsthand, upgrading becomes natural.';

  // Upsell path
  const phase3Services = phases[2].services.map((s) => s.service.name);
  const hasTretinoin = phase3Services.some((n) => n.toLowerCase().includes('tretinoin'));
  const hasWellness = allServices.some((s) => s.service.category === 'wellness');
  let upsellPath = 'Once they commit to Transform, ';
  if (hasTretinoin) {
    upsellPath += 'the Tretinoin home care is already included — emphasize it as their "secret weapon" between visits. ';
  } else {
    upsellPath += 'offer Tretinoin Rx add-on ($99/mo) as their daily home care accelerator. ';
  }
  if (!hasWellness) {
    upsellPath += 'Suggest a wellness injection add-on (Glutathione $49 or B12 $25) at each visit for enhanced results from the inside out.';
  } else {
    upsellPath += 'They already have wellness injections — suggest HydraFacial add-ons (Dermaplaning $49 or Red Light $49) for enhanced Phase 1 results.';
  }

  // Maintenance pathway
  const maintenancePathway = `After the plan completes, transition to quarterly maintenance: HydraFacial every 3 months ($225), ${allServices.some((s) => s.serviceId === 'botox') ? 'Botox touch-up every 3-4 months, ' : ''}and ongoing Tretinoin Rx. Position the membership program for consistent savings and priority booking. This becomes a recurring $${allServices.some((s) => s.serviceId === 'botox') ? '200-400' : '100-250'}/month relationship.`;

  // Quick win service
  let quickWinService = 'HydraFacial Signature — immediate visible glow after one session';
  for (const svc of phases[0].services) {
    if (QUICK_WIN_SERVICES.includes(svc.serviceId)) {
      quickWinService = `${svc.service.name} — ${getQuickWinReason(svc.serviceId)}`;
      break;
    }
  }

  // Anchor service
  let anchorService = 'The Phase 2 core treatment — this is where the transformative results happen';
  for (const svc of phases[1].services) {
    if (ANCHOR_SERVICES.includes(svc.serviceId)) {
      anchorService = `${svc.service.name} — ${getAnchorReason(svc.serviceId)}`;
      break;
    }
  }

  return {
    consultAngle,
    likelyObjections: generateObjections(phases, packages),
    highConvertingPackage,
    entryOfferFallback,
    upsellPath,
    maintenancePathway,
    quickWinService,
    anchorService,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getQuickWinReason(serviceId: string): string {
  const reasons: Record<string, string> = {
    'hydrafacial-signature': 'immediate visible glow and skin clarity after one 60-minute session',
    'hydrafacial-express': 'quick-refresh visible improvement in under an hour',
    'vi-peel': 'noticeable brightening and texture improvement within 5-7 days',
    'prx-t33': 'instant biorevitalization glow with zero downtime',
    'botox': 'visible wrinkle smoothing within 7-14 days',
    'glutathione-injection': 'skin brightening boost noticeable within days',
    'b12-injection': 'immediate energy boost — clients feel the difference same day',
  };
  return reasons[serviceId] || 'delivers fast visible results to build client confidence';
}

function getAnchorReason(serviceId: string): string {
  const reasons: Record<string, string> = {
    'sofwave-full-face-neck': 'the heavy lifter — deep tissue tightening that produces transformative lifting over 3-6 months',
    'sofwave-full-face': 'non-invasive deep tissue tightening with results that develop progressively for months',
    'rf-micro-face-neck': 'collagen remodeling powerhouse — each session builds on the last for cumulative improvement',
    'rf-micro-face': 'the core collagen stimulator — drives the visible texture and firmness transformation',
    'rf-micro-abdomen-large': 'body contouring anchor — addresses skin laxity at the deepest level',
    'rf-micro-abdomen-small': 'targeted body tightening — focused treatment for measurable improvement',
    'laser-facial-ndyag': 'multi-target laser treatment addressing pigment, texture, and vascular concerns simultaneously',
    'scar-combination': 'multi-modality scar remodeling — the combination approach delivers results no single treatment can match',
    'dermal-fillers': 'strategic volume restoration — the structural foundation that makes everything else look better',
    'glp1-semaglutide-m1': 'the metabolic foundation — GLP-1 therapy drives the weight loss that makes all other results more visible',
  };
  return reasons[serviceId] || 'the primary treatment driving the core transformation in this plan';
}
