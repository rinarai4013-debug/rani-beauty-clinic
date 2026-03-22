import type { PlanPhase, GeneratedPackage, SelectedService } from './types';

/**
 * Generate 3-tier treatment packages from plan builder selections.
 *
 * Essential = Phase 1 only (no discount)
 * Recommended = Phase 1 + 2 (10% discount, highlighted)
 * Platinum = All phases (15% discount + extras)
 */
export function generatePackages(phases: [PlanPhase, PlanPhase, PlanPhase]): GeneratedPackage[] {
  const phase1Services = phases[0].services;
  const phase2Services = phases[1].services;
  const phase3Services = phases[2].services;

  const allServices = [...phase1Services, ...phase2Services, ...phase3Services];

  if (allServices.length === 0) return [];

  const buildLineItems = (services: SelectedService[]) =>
    services.map((s) => ({
      service: s.service.name,
      qty: s.quantity * s.service.sessions,
      unitPrice: s.service.price,
      total: s.service.price * s.quantity * s.service.sessions,
    }));

  const calcTotal = (services: SelectedService[]) =>
    services.reduce((sum, s) => sum + s.service.price * s.quantity * s.service.sessions, 0);

  const calcSessions = (services: SelectedService[]) =>
    services.reduce((sum, s) => sum + s.quantity * s.service.sessions, 0);

  const packages: GeneratedPackage[] = [];

  // Essential — Phase 1 only
  if (phase1Services.length > 0) {
    const total = calcTotal(phase1Services);
    packages.push({
      tier: 'Essential',
      name: 'Foundation Package',
      price: total,
      originalPrice: total,
      discount: 0,
      sessions: calcSessions(phase1Services),
      lineItems: buildLineItems(phase1Services),
      monthlyPayment12: Math.ceil(total / 12),
      monthlyPayment24: Math.ceil(total / 24),
      highlighted: false,
      extras: ['Personalized treatment plan', 'Aftercare protocols'],
    });
  }

  // Recommended — Phase 1 + 2
  const recommendedServices = [...phase1Services, ...phase2Services];
  if (recommendedServices.length > 0 && phase2Services.length > 0) {
    const originalTotal = calcTotal(recommendedServices);
    const discountRate = 0.10;
    const discountedTotal = Math.round(originalTotal * (1 - discountRate));
    packages.push({
      tier: 'Recommended',
      name: 'Transformation Package',
      price: discountedTotal,
      originalPrice: originalTotal,
      discount: 10,
      sessions: calcSessions(recommendedServices),
      lineItems: buildLineItems(recommendedServices),
      monthlyPayment12: Math.ceil(discountedTotal / 12),
      monthlyPayment24: Math.ceil(discountedTotal / 24),
      highlighted: true,
      extras: [
        'Personalized treatment plan',
        'Aftercare protocols',
        'Priority scheduling',
        'Progress tracking photos',
      ],
    });
  }

  // Platinum — All phases
  if (allServices.length > 0 && phase3Services.length > 0) {
    const originalTotal = calcTotal(allServices);
    const discountRate = 0.15;
    const discountedTotal = Math.round(originalTotal * (1 - discountRate));
    packages.push({
      tier: 'Platinum',
      name: 'Complete Transformation',
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
    });
  }

  return packages;
}
