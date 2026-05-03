import type { PlanPhase, GeneratedPackage, SelectedService } from './types';

/**
 * Generate 3-tier treatment packages from plan builder selections.
 *
 * Start     = Phase 1 only (no discount) — "Your confident first step"
 * Transform = Phase 1 + 2 (10% discount, highlighted) — "Most popular — the sweet spot"
 * Elite     = All phases (15% discount) — "Fastest, most comprehensive result"
 */
export function generatePackages(phases: [PlanPhase, PlanPhase, PlanPhase]): GeneratedPackage[] {
  const phase1Services = phases[0].services;
  const phase2Services = phases[1].services;
  const phase3Services = phases[2].services;

  const allServices = [...phase1Services, ...phase2Services, ...phase3Services];

  if (allServices.length === 0) return [];

  const getSessionCount = (service: SelectedService) =>
    Math.max(1, Math.round(service.recommendedSessions ?? service.quantity * service.service.sessions));

  const buildLineItems = (services: SelectedService[]) =>
    services.map((s) => ({
      service: s.service.name,
      qty: getSessionCount(s),
      unitPrice: s.service.price,
      total: s.service.price * getSessionCount(s),
    }));

  const calcTotal = (services: SelectedService[]) =>
    services.reduce((sum, s) => sum + s.service.price * getSessionCount(s), 0);

  const calcSessions = (services: SelectedService[]) =>
    services.reduce((sum, s) => sum + getSessionCount(s), 0);

  const extractConcerns = (services: SelectedService[]): string[] => {
    const concerns = new Set<string>();
    for (const s of services) {
      if (s.service.concerns) {
        for (const c of s.service.concerns) {
          concerns.add(c);
        }
      }
    }
    return Array.from(concerns);
  };

  const packages: GeneratedPackage[] = [];

  // Start - Phase 1 only
  if (phase1Services.length > 0) {
    const total = calcTotal(phase1Services);
    packages.push({
      tier: 'Start',
      name: 'Start',
      subtitle: 'Your confident first step',
      price: total,
      originalPrice: total,
      discount: 0,
      sessions: calcSessions(phase1Services),
      lineItems: buildLineItems(phase1Services),
      monthlyPayment12: Math.ceil(total / 12),
      monthlyPayment24: Math.ceil(total / 24),
      highlighted: false,
      extras: ['Personalized treatment plan', 'Aftercare protocols'],
      bestFor: 'First-time clients or those wanting a low-commitment entry',
      resultIntensity: 'visible improvement',
      concernsAddressed: extractConcerns(phase1Services),
      savingsVsStandalone: 0,
    });
  }

  // Transform - Phase 1 + 2
  const transformServices = [...phase1Services, ...phase2Services];
  if (transformServices.length > 0 && phase2Services.length > 0) {
    const originalTotal = calcTotal(transformServices);
    const discountRate = 0.10;
    const discountedTotal = Math.round(originalTotal * (1 - discountRate));
    packages.push({
      tier: 'Transform',
      name: 'Transform',
      subtitle: 'Most popular \u2014 the sweet spot',
      price: discountedTotal,
      originalPrice: originalTotal,
      discount: 10,
      sessions: calcSessions(transformServices),
      lineItems: buildLineItems(transformServices),
      monthlyPayment12: Math.ceil(discountedTotal / 12),
      monthlyPayment24: Math.ceil(discountedTotal / 24),
      highlighted: true,
      extras: [
        'Personalized treatment plan',
        'Aftercare protocols',
        'Priority scheduling',
        'Progress tracking photos',
      ],
      bestFor: 'Most clients \u2014 best balance of results and investment',
      resultIntensity: 'significant transformation',
      whyBest: 'Combines foundation prep with active treatments for the most noticeable, lasting change',
      concernsAddressed: extractConcerns(transformServices),
      savingsVsStandalone: originalTotal - discountedTotal,
    });
  }

  // Elite - All phases
  if (allServices.length > 0 && phase3Services.length > 0) {
    const originalTotal = calcTotal(allServices);
    const discountRate = 0.15;
    const discountedTotal = Math.round(originalTotal * (1 - discountRate));
    packages.push({
      tier: 'Elite',
      name: 'Elite',
      subtitle: 'Fastest, most comprehensive result',
      price: discountedTotal,
      originalPrice: originalTotal,
      discount: 15,
      sessions: calcSessions(allServices),
      lineItems: buildLineItems(allServices),
      monthlyPayment12: Math.ceil(discountedTotal / 12),
      monthlyPayment24: Math.ceil(discountedTotal / 24),
      highlighted: false,
      extras: [
        'Personalized treatment plan',
        'Aftercare protocols',
        'VIP priority scheduling',
        'Progress tracking photos',
        'Complimentary skincare consultation',
        'Membership pricing on add-ons',
      ],
      bestFor: 'Clients who want maximum results in minimum time',
      resultIntensity: 'dramatic, comprehensive transformation',
      concernsAddressed: extractConcerns(allServices),
      savingsVsStandalone: originalTotal - discountedTotal,
    });
  }

  return packages;
}
