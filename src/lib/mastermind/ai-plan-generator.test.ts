import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockAuraScanResult, mockMastermindPlan } from '@/lib/mastermind/mock-data';

import {
  calculateMonthlyPayment,
  generateAIPlan,
} from '@/lib/mastermind/ai-plan-generator';

const mockMessagesCreate = vi.fn();
const mockGenerateMastermindPlan = vi.fn();

vi.mock('@/lib/ai/client', () => ({
  getAnthropicClient: () => ({
    messages: {
      create: mockMessagesCreate,
    },
  }),
}));

vi.mock('@/lib/mastermind/plan-generator', () => ({
  generateMastermindPlan: (...args: unknown[]) => mockGenerateMastermindPlan(...args),
}));

beforeEach(() => {
  mockMessagesCreate.mockReset();
  mockGenerateMastermindPlan.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
});

describe('mastermind/ai-plan-generator', () => {
  const scan = mockAuraScanResult();
  const catalog = [
    {
      id: 'hydrafacial-signature',
      name: 'Signature HydraFacial',
      category: 'facial',
      price: 225,
      duration: 60,
      sessions: 1,
      description: 'Hydration-first treatment',
      concerns: ['dull-skin'],
      bodyAreas: ['face'],
      financingEligible: false,
      parentSlug: 'hydrafacial',
    },
    {
      id: 'botox',
      name: 'Botox',
      category: 'injectables',
      price: 350,
      duration: 30,
      sessions: 1,
      description: 'Wrinkle reduction',
      concerns: ['aging-skin'],
      bodyAreas: ['face'],
      financingEligible: true,
      parentSlug: 'botox',
    },
    {
      id: 'sofwave-full-face',
      name: 'Sofwave Full Face',
      category: 'skin-tightening',
      price: 2250,
      duration: 60,
      sessions: 1,
      description: 'Non-invasive tightening',
      concerns: ['skin-laxity'],
      bodyAreas: ['face'],
      financingEligible: true,
      parentSlug: 'sofwave',
    },
  ];

  it('calculateMonthlyPayment returns a clean amortized amount', () => {
    expect(calculateMonthlyPayment(1000, 0.1499, 12)).toBe(90);
    expect(calculateMonthlyPayment(1000, 0.1499, 24)).toBe(48);
    expect(calculateMonthlyPayment(0, 0.1499, 12)).toBe(0);
    expect(calculateMonthlyPayment(500, -0.1, 12)).toBe(42);
  });

  it('generateAIPlan parses structured AI output and sanitizes financing', async () => {
    const raw = {
      recommendations: {
        primary: [
          {
            id: 'tx_botox',
            treatmentName: 'Botox',
            category: 'injectables',
            targetConcerns: ['wrinkles'],
            targetZones: ['forehead'],
            sessionsRequired: 1,
            intervalBetweenSessions: '2 weeks',
            expectedImprovement: 'Strong wrinkle softening',
            timeToResults: '3 days',
            longevity: '3 months',
            perSession: 350,
            totalEstimate: 350,
            priority: 'recommended',
            urgency: 'immediate',
            downtime: 'Minimal',
            riskLevel: 'low',
            contraindications: [],
            synergiesWith: [],
            aiConfidence: 98,
            aiReasoning: 'Fast visible result',
            clinicalRationale: 'Muscle relaxation',
          },
        ],
        complementary: [],
        maintenance: [],
      },
      sequencing: [
        {
          phase: 1,
          phaseName: 'Glow Activation',
          duration: '1 month',
          treatments: [{ treatmentId: 'tx_botox', week: 1, sessionNumber: 1 }],
          expectedMilestone: 'Visible improvement',
        },
      ],
      packages: [
        {
          tier: 'Start',
          name: 'Starter',
          subtitle: 'Starter plan',
          price: 200,
          originalPrice: 300,
          discount: 5,
          sessions: 1,
          lineItems: [{ service: 'Botox', qty: 1, unitPrice: 200, total: 200 }],
          monthlyPayment12: 200,
          monthlyPayment24: 200,
          highlighted: false,
          extras: ['HydraFacial'],
          bestFor: 'First-time',
          resultIntensity: 'Mild',
          concernsAddressed: ['wrinkles'],
          savingsVsStandalone: 100,
        },
        {
          tier: 'Transform',
          name: 'Transform',
          subtitle: 'Core stack',
          price: 1200,
          originalPrice: 1600,
          discount: 10,
          sessions: 3,
          lineItems: [
            { service: 'Botox', qty: 1, unitPrice: 350, total: 350 },
            { service: 'Sofwave Full Face', qty: 1, unitPrice: 850, total: 850 },
          ],
          monthlyPayment12: 1200,
          monthlyPayment24: 1200,
          highlighted: true,
          extras: ['Hydrating routine'],
          bestFor: 'Visible lift',
          resultIntensity: 'High',
          concernsAddressed: ['wrinkles', 'laxity'],
          whyBest: 'Good upfront value',
          savingsVsStandalone: 0,
        },
        {
          tier: 'Elite',
          name: 'Elite',
          subtitle: 'Deep package',
          price: 3200,
          originalPrice: 3600,
          discount: 12,
          sessions: 6,
          lineItems: [
            { service: 'Botox', qty: 1, unitPrice: 350, total: 350 },
            { service: 'Sofwave', qty: 1, unitPrice: 2850, total: 2850 },
          ],
          monthlyPayment12: 3200,
          monthlyPayment24: 3200,
          highlighted: false,
          extras: ['Maintenance'],
          bestFor: 'Maximum outcomes',
          resultIntensity: 'Very High',
          concernsAddressed: ['wrinkles', 'laxity'],
          savingsVsStandalone: 400,
        },
      ],
      aftercarePreview: [
        {
          treatmentId: 'tx_botox',
          immediateAftercare: ['Do not lie down for 4 hours'],
          weekOneGuidance: ['No heavy gym for 24h'],
          productsRecommended: [{ product: ' SPF', reason: 'Sun defense' }],
        },
      ],
      aiSummary: {
        patientFacing: 'Great option to start with visible impact.',
        providerFacing: 'Tight control, monitor asymmetry.',
        keyHighlights: ['Start with injectable'],
        addressedConcerns: [{ concern: 'wrinkles', solution: 'Botox and Sofwave', timeline: '90 days' }],
      },
      contraindications: [],
    };

    mockMessagesCreate.mockResolvedValue({
      content: [{
        type: 'text',
        text: '```json\n' + JSON.stringify(raw, null, 2) + '\n```',
      }],
    });

    const plan = await generateAIPlan(scan, { firstName: 'Rina' }, catalog as never);

    expect(plan.planId).toContain('plan_ai_');
    expect(plan.packages).toHaveLength(3);
    expect(plan.packages[1].monthlyPayment12).toBe(calculateMonthlyPayment(1200, 0.1499, 12));
    expect(plan.recommendations.primary).toHaveLength(1);
    expect(plan.recommendations.primary[0].sessionsRequired).toBe(1);
    expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockMessagesCreate.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-sonnet-4-20250514');
    expect(callArgs.max_tokens).toBe(8192);
    expect(callArgs.messages[0].content).toContain('Generate a personalized Mastermind treatment plan');
    expect(plan.packages[1].savingsVsStandalone).toBeGreaterThan(0);
  });

  it('generateAIPlan falls back to rule-based generation when Anthropic response fails', async () => {
    const fallbackPlan = mockMastermindPlan();
    mockMessagesCreate.mockRejectedValue(new Error('anthropic down'));
    mockGenerateMastermindPlan.mockReturnValue(fallbackPlan);

    const plan = await generateAIPlan(scan, { firstName: 'Rina' }, catalog as never);

    expect(plan.planId).toContain('plan_ai_');
    expect(plan.recommendations.primary).toEqual(fallbackPlan.recommendations.primary);
    expect(mockGenerateMastermindPlan).toHaveBeenCalledWith(scan, { firstName: 'Rina' });
  });
});
