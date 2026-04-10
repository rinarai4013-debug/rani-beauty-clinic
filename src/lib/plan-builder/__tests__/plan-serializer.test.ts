import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import type { BuilderState, GeneratedPackage } from '@/lib/plan-builder/types';
import {
  serializeToPlanData,
  convertToTreatmentPackages,
  serializeForAirtable,
} from '@/lib/plan-builder/plan-serializer';

const hydrafacial = {
  id: 'hydrafacial-signature',
  name: 'HydraFacial Signature',
  price: 275,
  sessions: 1,
  duration: 60,
  category: 'facial',
} as any;

const sofwave = {
  id: 'sofwave-full-face',
  name: 'Sofwave Full Face',
  price: 2750,
  sessions: 1,
  duration: 45,
  category: 'skin-tightening',
} as any;

const tretinoin = {
  id: 'tretinoin',
  name: 'Tretinoin',
  price: 99,
  sessions: 1,
  duration: 0,
  category: 'skincare',
} as any;

const state: BuilderState = {
  client: {
    id: 'client-rina',
    name: 'Rina Rai',
    email: 'rina@ranibeauty.com',
    phone: '425-539-4440',
    skinConcerns: ['aging-skin', 'skin-laxity'],
    treatmentInterests: ['Sofwave', 'HydraFacial'],
    intakeId: 'intake-123',
  },
  planName: 'Lift & Glow',
  phases: [
    {
      id: 1,
      label: 'Foundation',
      description: 'Baseline',
      services: [
        {
          id: 'phase-1-hydra',
          serviceId: 'hydrafacial-signature',
          service: hydrafacial,
          quantity: 1,
          notes: 'Prep skin',
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
          id: 'phase-2-sofwave',
          serviceId: 'sofwave-full-face',
          service: sofwave,
          quantity: 1,
          notes: 'Core lift',
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
          id: 'phase-3-tret',
          serviceId: 'tretinoin',
          service: tretinoin,
          quantity: 1,
          notes: 'Home care',
          phase: 3,
        },
      ],
    },
  ],
  searchQuery: '',
  activeCategory: 'all',
  packages: [],
  isDirty: true,
  savedPlanId: 'plan-456',
};

const packages: GeneratedPackage[] = [
  {
    tier: 'Start',
    name: 'Start Strong',
    subtitle: 'Quick wins',
    price: 1499,
    originalPrice: 1725,
    discount: 13,
    sessions: 2,
    lineItems: [
      { service: 'HydraFacial Signature', qty: 1, unitPrice: 275, total: 275 },
    ],
    monthlyPayment12: 125,
    monthlyPayment24: 70,
    highlighted: false,
    extras: [],
    bestFor: 'Getting started',
    resultIntensity: 'Moderate',
    concernsAddressed: ['aging-skin'],
    savingsVsStandalone: 226,
  },
  {
    tier: 'Transform',
    name: 'Transform Lift',
    subtitle: 'Best value',
    price: 3200,
    originalPrice: 3600,
    discount: 11,
    sessions: 3,
    lineItems: [
      { service: 'Sofwave Full Face', qty: 1, unitPrice: 2750, total: 2750 },
      { service: 'Tretinoin', qty: 1, unitPrice: 99, total: 99 },
    ],
    monthlyPayment12: 267,
    monthlyPayment24: 145,
    highlighted: true,
    extras: ['Priority booking'],
    bestFor: 'Visible lifting',
    resultIntensity: 'High',
    concernsAddressed: ['aging-skin', 'skin-laxity'],
    whyBest: 'Best balance of lift and maintenance',
    savingsVsStandalone: 400,
  },
];

describe('plan-builder/plan-serializer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('serializes builder state into client-facing plan data', () => {
    const result = serializeToPlanData(state);

    expect(result).toEqual(
      expect.objectContaining({
        id: 'plan-456',
        clientName: 'Rina Rai',
        firstName: 'Rina',
        treatmentValue: '$3,124',
        intelligenceReady: true,
      })
    );
    expect(result.programPlan).toContain('## Phase 1: Foundation');
    expect(result.programPlan).toContain('## Phase 2: Optimization');
    expect(result.costBreakdown).toContain('Total Investment: $3,124');
    expect(result.timeline).toContain('Week 1: HydraFacial Signature');
    expect(result.timeline).toContain('Week 3: Sofwave Full Face');
    expect(result.timeline).toContain('Week 5: Tretinoin');
  });

  it('converts generated packages to parser-compatible treatment packages', () => {
    expect(convertToTreatmentPackages(packages)).toEqual([
      expect.objectContaining({
        tier: 'Start',
        name: 'Start Strong',
        savings: 'Save 13%',
        monthlyPayment: 125,
        highlight: false,
      }),
      expect.objectContaining({
        tier: 'Transform',
        name: 'Transform Lift',
        savings: 'Save 11%',
        monthlyPayment: 267,
        highlight: true,
      }),
    ]);
  });

  it('serializes the draft plan for Airtable storage using the highlighted package', () => {
    const result = serializeForAirtable(state, packages);

    expect(result).toEqual(
      expect.objectContaining({
        Client: ['client-rina'],
        'Client Name': 'Rina Rai',
        'Plan Name': 'Lift & Glow',
        'Plan Tier': 'Transform',
        'Plan Value': 3200,
        Status: 'Draft',
        'Created Date': '2026-04-10',
        'Intake Record ID': 'intake-123',
      })
    );

    expect(JSON.parse(result['Services Included'] as string)).toEqual(
      expect.objectContaining({
        phases: expect.any(Array),
        packages: expect.arrayContaining([
          expect.objectContaining({
            tier: 'Transform',
            price: 3200,
          }),
        ]),
      })
    );
  });
});
