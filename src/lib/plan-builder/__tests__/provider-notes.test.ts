import { describe, expect, it } from 'vitest';

import type { BuilderClient, GeneratedPackage, PlanPhase } from '@/lib/plan-builder/types';
import { generateProviderNotes } from '@/lib/plan-builder/provider-notes';

const phases: [PlanPhase, PlanPhase, PlanPhase] = [
  {
    id: 1,
    label: 'Foundation',
    description: 'Start',
    services: [
      {
        id: 'hydra-1',
        serviceId: 'hydrafacial-signature',
        service: {
          name: 'HydraFacial Signature',
          price: 275,
          sessions: 1,
          duration: 60,
          category: 'facial',
        } as any,
        quantity: 1,
        notes: '',
        phase: 1,
      },
    ],
  },
  {
    id: 2,
    label: 'Optimization',
    description: 'Transform',
    services: [
      {
        id: 'sofwave-1',
        serviceId: 'sofwave-full-face',
        service: {
          name: 'Sofwave Full Face',
          price: 2750,
          sessions: 1,
          duration: 45,
          category: 'skin-tightening',
        } as any,
        quantity: 1,
        notes: '',
        phase: 2,
      },
    ],
  },
  {
    id: 3,
    label: 'Maintenance',
    description: 'Maintain',
    services: [
      {
        id: 'tret-1',
        serviceId: 'tretinoin',
        service: {
          name: 'Tretinoin',
          price: 99,
          sessions: 1,
          duration: 0,
          category: 'skincare',
        } as any,
        quantity: 1,
        notes: '',
        phase: 3,
      },
    ],
  },
];

const client: BuilderClient = {
  id: 'client-rina',
  name: 'Rina',
  email: 'rina@ranibeauty.com',
  phone: '425-539-4440',
  skinConcerns: ['aging-skin', 'wrinkles'],
  treatmentInterests: ['Sofwave', 'HydraFacial'],
};

const packages: GeneratedPackage[] = [
  {
    tier: 'Start',
    name: 'Start Strong',
    subtitle: 'Quick wins',
    price: 1499,
    originalPrice: 1700,
    discount: 12,
    sessions: 2,
    lineItems: [],
    monthlyPayment12: 125,
    monthlyPayment24: 70,
    highlighted: false,
    extras: [],
    bestFor: 'Getting started',
    resultIntensity: 'Moderate',
    concernsAddressed: ['aging-skin'],
    savingsVsStandalone: 201,
  },
  {
    tier: 'Transform',
    name: 'Transform Lift',
    subtitle: 'Best value',
    price: 6000,
    originalPrice: 6800,
    discount: 12,
    sessions: 3,
    lineItems: [],
    monthlyPayment12: 500,
    monthlyPayment24: 275,
    highlighted: true,
    extras: [],
    bestFor: 'Visible lifting',
    resultIntensity: 'High',
    concernsAddressed: ['aging-skin', 'wrinkles'],
    whyBest: 'Best overall balance',
    savingsVsStandalone: 800,
  },
];

describe('plan-builder/provider-notes', () => {
  it('builds a concern-aware consult strategy and package pitch', () => {
    const notes = generateProviderNotes(phases, client, packages);

    expect(notes.consultAngle).toContain('visible age-reversal timeline');
    expect(notes.consultAngle).toContain('multiple concerns');
    expect(notes.highConvertingPackage).toContain('Always recommend Transform first');
    expect(notes.highConvertingPackage).toContain('$6,000');
    expect(notes.entryOfferFallback).toContain('Start Strong');
    expect(notes.entryOfferFallback).toContain('$125/mo');
  });

  it('identifies quick-win and anchor services from the selected phases', () => {
    const notes = generateProviderNotes(phases, client, packages);

    expect(notes.quickWinService).toContain('HydraFacial Signature');
    expect(notes.anchorService).toContain('Sofwave Full Face');
  });

  it('generates likely objections for price, comfort, commitment, and proof', () => {
    const notes = generateProviderNotes(phases, client, packages);

    expect(notes.likelyObjections).toHaveLength(4);
    expect(notes.likelyObjections.map((item) => item.objection)).toEqual(
      expect.arrayContaining([
        "That's more than I expected",
        'What does Sofwave feel like?',
        "How do I know it'll work for me?",
      ])
    );
  });

  it('builds the upsell and maintenance pathways from the plan structure', () => {
    const notes = generateProviderNotes(phases, client, packages);

    expect(notes.upsellPath).toContain('Tretinoin home care is already included');
    expect(notes.upsellPath).toContain('wellness injection add-on');
    expect(notes.maintenancePathway).toContain('HydraFacial every 3 months');
  });

  it('falls back gracefully when no client is provided', () => {
    const notes = generateProviderNotes(phases, null, packages);

    expect(notes.consultAngle).toContain('Lead with personalized care');
  });
});
