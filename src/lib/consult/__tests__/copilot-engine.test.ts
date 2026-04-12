import { describe, it, expect } from 'vitest';
import { generateConsultCopilot, type ConsultInput } from '../copilot-engine';

function buildInput(overrides: Partial<ConsultInput> = {}): ConsultInput {
  return {
    client: {
      name: 'Jane Doe',
      previousServices: ['HydraFacial', 'Botox'],
      visitCount: 5,
      totalSpend: 2500,
      membershipStatus: 'none',
      churnRisk: 20,
      ...overrides.client,
    },
    concerns: ['fine lines', 'skin texture'],
    consultType: 'existing_client',
    budget: 'moderate',
    timeAvailable: 60,
    ...overrides,
  };
}

describe('generateConsultCopilot', () => {
  it('returns all expected result keys', () => {
    const result = generateConsultCopilot(buildInput());
    expect(result).toHaveProperty('clientBriefing');
    expect(result).toHaveProperty('treatmentPlan');
    expect(result).toHaveProperty('talkingPoints');
    expect(result).toHaveProperty('objectionHandlers');
    expect(result).toHaveProperty('crossSellOpportunities');
    expect(result).toHaveProperty('closingStrategy');
    expect(result).toHaveProperty('followUpPlan');
    expect(result).toHaveProperty('consultScore');
  });

  it('classifies VIP clients by spend', () => {
    const base = buildInput();
    const result = generateConsultCopilot({
      ...base,
      client: { ...base.client, totalSpend: 8000, visitCount: 15 },
    });
    expect(result.clientBriefing.segment).toBe('vip');
  });

  it('classifies new clients with zero visits', () => {
    const base = buildInput();
    const result = generateConsultCopilot({
      ...base,
      consultType: 'new_client',
      client: { ...base.client, visitCount: 0, totalSpend: 0, previousServices: [] },
    });
    expect(result.clientBriefing.segment).toBe('new');
  });

  it('classifies at-risk clients by churn score', () => {
    const base = buildInput();
    const result = generateConsultCopilot({
      ...base,
      client: { ...base.client, churnRisk: 75, visitCount: 2, totalSpend: 500 },
    });
    expect(result.clientBriefing.segment).toBe('at_risk');
  });

  it('generates talking points with timing tags', () => {
    const result = generateConsultCopilot(buildInput());
    expect(result.talkingPoints.length).toBeGreaterThan(0);
    for (const point of result.talkingPoints) {
      expect(['opening', 'during', 'closing']).toContain(point.timing);
      expect(['must_say', 'should_say', 'nice_to_say']).toContain(point.priority);
    }
  });

  it('generates objection handlers', () => {
    const result = generateConsultCopilot(buildInput());
    expect(result.objectionHandlers.length).toBeGreaterThan(0);
    for (const handler of result.objectionHandlers) {
      expect(handler.objection).toBeTruthy();
      expect(handler.response).toBeTruthy();
      expect(handler.technique).toBeTruthy();
    }
  });

  it('generates treatment plan with primary and alternatives', () => {
    const result = generateConsultCopilot(buildInput());
    expect(result.treatmentPlan.primary).toBeDefined();
    expect(result.treatmentPlan.primary.service).toBeTruthy();
    expect(result.treatmentPlan.primary.price).toBeGreaterThan(0);
    expect(result.treatmentPlan.alternatives.length).toBeGreaterThanOrEqual(0);
  });

  it('generates cross-sell opportunities with likelihood scores', () => {
    const result = generateConsultCopilot(buildInput());
    for (const item of result.crossSellOpportunities) {
      expect(item.service).toBeTruthy();
      expect(item.conversionLikelihood).toBeGreaterThanOrEqual(0);
      expect(item.conversionLikelihood).toBeLessThanOrEqual(100);
    }
  });

  it('includes follow-up plan with timing slots', () => {
    const result = generateConsultCopilot(buildInput());
    expect(result.followUpPlan).toBeDefined();
    expect(result.followUpPlan.sameDay).toBeTruthy();
    expect(result.followUpPlan.nextDay).toBeTruthy();
    expect(result.followUpPlan.oneWeek).toBeTruthy();
    expect(result.followUpPlan.ifNoBook).toBeTruthy();
  });

  it('produces consultScore between 0 and 100', () => {
    const result = generateConsultCopilot(buildInput());
    expect(result.consultScore).toBeGreaterThanOrEqual(0);
    expect(result.consultScore).toBeLessThanOrEqual(100);
  });
});
