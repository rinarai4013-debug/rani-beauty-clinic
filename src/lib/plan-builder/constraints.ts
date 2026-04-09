import type { PlanPhase, SelectedService } from '@/lib/plan-builder/types';

// ─── Interfaces ───────────────────────────────────────────────────────

export interface PlanWarning {
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedServices: string[]; // service instance IDs
  suggestion: string;
  serviceName?: string;
  type?: string;
}

// ─── Constraint definitions ───────────────────────────────────────────

// Services that should not appear in the same phase due to healing conflicts
const SAME_PHASE_CONFLICTS: { a: Set<string>; b: Set<string>; message: string; suggestion: string }[] = [
  {
    a: new Set(['rf-microneedling']),
    b: new Set(['chemical-peel']),
    message: 'RF Microneedling and chemical peels in the same phase may compromise healing',
    suggestion: 'Consider spacing RF Microneedling and chemical peels in different phases for optimal healing',
  },
  {
    a: new Set(['skincare']), // tretinoin / retinoids
    b: new Set(['laser', 'scar-reduction']),
    message: 'Retinoids and laser treatments in the same phase can increase sensitivity and burn risk',
    suggestion: 'Discontinue retinoids before laser treatments — place them in separate phases',
  },
];

// Categories considered high-downtime
const HIGH_DOWNTIME_CATEGORIES = new Set([
  'rf-microneedling',
  'scar-reduction',
  'laser',
]);

// IDs that are retinoid-based (for retinoid + laser check)
const RETINOID_IDS = new Set(['tretinoin']);

// HydraFacial / facial prep services
const PREP_FACIAL_CATEGORIES = new Set(['facial']);

// Categories that benefit from a prep facial
const NEEDS_PREP_CATEGORIES = new Set([
  'rf-microneedling',
  'laser',
  'scar-reduction',
]);

// Aggressive treatments that have seasonal sensitivity
const SEASONAL_SENSITIVE_CATEGORIES = new Set([
  'laser',
  'scar-reduction',
]);

const SEASONAL_SENSITIVE_PEEL_IDS = new Set([
  'vi-peel',
]);

// ─── Validation logic ─────────────────────────────────────────────────

function getPhaseLabel(phaseId: 1 | 2 | 3): string {
  const labels: Record<1 | 2 | 3, string> = {
    1: 'Phase 1 (Foundation)',
    2: 'Phase 2 (Active Optimization)',
    3: 'Phase 3 (Maintenance)',
  };
  return labels[phaseId];
}

function checkSamePhaseConflicts(phases: [PlanPhase, PlanPhase, PlanPhase]): PlanWarning[] {
  const warnings: PlanWarning[] = [];

  for (const phase of phases) {
    if (phase.services.length < 2) continue;

    for (const conflict of SAME_PHASE_CONFLICTS) {
      const groupA: SelectedService[] = [];
      const groupB: SelectedService[] = [];

      for (const svc of phase.services) {
        // Check category match
        if (conflict.a.has(svc.service.category)) groupA.push(svc);
        if (conflict.b.has(svc.service.category)) groupB.push(svc);

        // Special case: retinoid IDs match the skincare category rule
        if (conflict.a.has('skincare') && RETINOID_IDS.has(svc.service.id)) {
          if (!groupA.includes(svc)) groupA.push(svc);
        }
      }

      if (groupA.length > 0 && groupB.length > 0) {
        warnings.push({
          severity: 'warning',
          message: `${getPhaseLabel(phase.id)}: ${conflict.message}`,
          affectedServices: [...groupA, ...groupB].map((s) => s.id),
          suggestion: conflict.suggestion,
        });
      }
    }
  }

  return warnings;
}

function checkDowntimeStacking(phases: [PlanPhase, PlanPhase, PlanPhase]): PlanWarning[] {
  const warnings: PlanWarning[] = [];

  // Primarily concerned about Phase 1 overload, but check all phases
  for (const phase of phases) {
    const highDowntimeServices = phase.services.filter((svc) =>
      HIGH_DOWNTIME_CATEGORIES.has(svc.service.category)
    );

    if (highDowntimeServices.length >= 2) {
      warnings.push({
        severity: 'warning',
        message: `${getPhaseLabel(phase.id)} has ${highDowntimeServices.length} treatments requiring significant downtime`,
        affectedServices: highDowntimeServices.map((s) => s.id),
        suggestion: 'Consider spreading high-downtime treatments across phases to allow proper healing between sessions',
      });
    }
  }

  return warnings;
}

function checkRedundantServices(phases: [PlanPhase, PlanPhase, PlanPhase]): PlanWarning[] {
  const warnings: PlanWarning[] = [];

  for (const phase of phases) {
    if (phase.services.length < 2) continue;

    // Group by parentSlug
    const slugGroups = new Map<string, SelectedService[]>();
    for (const svc of phase.services) {
      if (svc.service.parentSlug) {
        const group = slugGroups.get(svc.service.parentSlug) || [];
        group.push(svc);
        slugGroups.set(svc.service.parentSlug, group);
      }
    }

    for (const [slug, services] of slugGroups) {
      if (services.length >= 2) {
        warnings.push({
          severity: 'warning',
          message: `${getPhaseLabel(phase.id)}: Multiple ${services[0].service.name.split(' - ')[0] || slug} variants in the same phase`,
          affectedServices: services.map((s) => s.id),
          suggestion: `Consider choosing one ${slug.replace(/-/g, ' ')} variant per phase — you can add the other in a different phase if needed`,
        });
      }
    }
  }

  return warnings;
}

function checkSeasonalWarnings(phases: [PlanPhase, PlanPhase, PlanPhase]): PlanWarning[] {
  const warnings: PlanWarning[] = [];

  const allServices = phases.flatMap((p) => p.services);
  const seasonalSensitive = allServices.filter(
    (svc) =>
      SEASONAL_SENSITIVE_CATEGORIES.has(svc.service.category) ||
      SEASONAL_SENSITIVE_PEEL_IDS.has(svc.service.id)
  );

  if (seasonalSensitive.length > 0) {
    warnings.push({
      severity: 'info',
      message: 'Plan includes treatments with sun sensitivity considerations',
      affectedServices: seasonalSensitive.map((s) => s.id),
      suggestion: 'For best results, schedule laser treatments and deep peels during fall/winter when sun exposure is minimal',
    });
  }

  return warnings;
}

function checkMissingFoundation(phases: [PlanPhase, PlanPhase, PlanPhase]): PlanWarning[] {
  const warnings: PlanWarning[] = [];

  const allServices = phases.flatMap((p) => p.services);
  const hasAdvanced = allServices.some((svc) => NEEDS_PREP_CATEGORIES.has(svc.service.category));
  const hasPrepFacial = phases[0].services.some((svc) => PREP_FACIAL_CATEGORIES.has(svc.service.category));

  if (hasAdvanced && !hasPrepFacial) {
    const advancedIds = allServices
      .filter((svc) => NEEDS_PREP_CATEGORIES.has(svc.service.category))
      .map((s) => s.id);

    warnings.push({
      severity: 'info',
      message: 'Advanced treatments included without a prep facial in Phase 1',
      affectedServices: advancedIds,
      suggestion: 'Consider adding a HydraFacial to Phase 1 to prep skin before advanced treatments like RF microneedling and laser',
    });
  }

  return warnings;
}

function checkEmptyPhaseOrdering(phases: [PlanPhase, PlanPhase, PlanPhase]): PlanWarning[] {
  const warnings: PlanWarning[] = [];

  const phase1Empty = phases[0].services.length === 0;
  const phase2HasServices = phases[1].services.length > 0;
  const phase3HasServices = phases[2].services.length > 0;

  if (phase1Empty && (phase2HasServices || phase3HasServices)) {
    const laterIds = [...phases[1].services, ...phases[2].services].map((s) => s.id);
    warnings.push({
      severity: 'warning',
      message: 'Phase 1 (Foundation) is empty but later phases have services',
      affectedServices: laterIds,
      suggestion: 'Phase 1 (Foundation) should have services before Phase 2 — consider moving a foundational treatment to Phase 1',
    });
  }

  if (phases[1].services.length === 0 && phase3HasServices) {
    warnings.push({
      severity: 'warning',
      message: 'Phase 2 (Active Optimization) is empty but Phase 3 has services',
      affectedServices: phases[2].services.map((s) => s.id),
      suggestion: 'Consider filling Phase 2 with core treatments before moving to maintenance in Phase 3',
    });
  }

  return warnings;
}

// ─── Main validator ───────────────────────────────────────────────────

/**
 * Validate a 3-phase treatment plan for scheduling conflicts, safety issues,
 * and optimization opportunities.
 *
 * Returns an array of warnings sorted by severity (errors first, then warnings, then info).
 */
export function validatePlan(phases: [PlanPhase, PlanPhase, PlanPhase]): PlanWarning[] {
  const warnings: PlanWarning[] = [
    ...checkSamePhaseConflicts(phases),
    ...checkDowntimeStacking(phases),
    ...checkRedundantServices(phases),
    ...checkSeasonalWarnings(phases),
    ...checkMissingFoundation(phases),
    ...checkEmptyPhaseOrdering(phases),
  ];

  // Sort by severity: error → warning → info
  const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2 };
  warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return warnings;
}
