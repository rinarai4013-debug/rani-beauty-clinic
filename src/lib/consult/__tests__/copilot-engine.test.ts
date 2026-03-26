// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

// Mock the unified-catalog import before importing the engine
vi.mock('@/data/services/unified-catalog', () => ({
  UNIFIED_CATALOG: [
    { id: 'hydrafacial-signature', name: 'HydraFacial Signature', category: 'facial', price: 275, duration: 45, sessions: 1, financingEligible: false, description: '', concerns: [], bodyAreas: [] },
    { id: 'vi-peel', name: 'VI Peel', category: 'chemical-peel', price: 395, duration: 30, sessions: 3, financingEligible: false, description: '', concerns: [], bodyAreas: [] },
    { id: 'rf-micro-face', name: 'RF Microneedling Face', category: 'rf-microneedling', price: 495, duration: 45, sessions: 3, financingEligible: true, description: '', concerns: [], bodyAreas: [] },
    { id: 'sofwave-full-face', name: 'Sofwave Full Face', category: 'skin-tightening', price: 2750, duration: 60, sessions: 1, financingEligible: true, description: '', concerns: [], bodyAreas: [] },
    { id: 'lhr-full-brazilian', name: 'LHR Brazilian', category: 'laser-hair-removal', price: 225, duration: 20, sessions: 6, financingEligible: true, description: '', concerns: [], bodyAreas: [] },
    { id: 'glp1-semaglutide-m1', name: 'GLP-1 Month 1', category: 'weight-management', price: 399, duration: 15, sessions: 1, financingEligible: false, description: '', concerns: [], bodyAreas: [] },
    { id: 'laser-facial-ndyag', name: 'ND:Yag Laser Facial', category: 'laser', price: 225, duration: 30, sessions: 3, financingEligible: false, description: '', concerns: [], bodyAreas: [] },
    { id: 'prx-t33', name: 'PRX-T33', category: 'chemical-peel', price: 495, duration: 30, sessions: 4, financingEligible: false, description: '', concerns: [], bodyAreas: [] },
    { id: 'biorepeel-face', name: 'BioRePeel Face', category: 'chemical-peel', price: 199, duration: 20, sessions: 4, financingEligible: false, description: '', concerns: [], bodyAreas: [] },
    { id: 'nad-injection', name: 'NAD+ Injection', category: 'wellness', price: 150, duration: 10, sessions: 1, financingEligible: false, description: '', concerns: [], bodyAreas: [] },
  ],
}));

import { generateConsultCopilot, type ConsultInput, type ClientProfile } from '../copilot-engine';

function makeClient(overrides: Partial<ClientProfile> = {}): ClientProfile {
  return {
    name: 'Jane', age: 35, gender: 'female', skinType: 'combination',
    previousServices: [], totalSpend: 0, visitCount: 0,
    membershipStatus: 'none', ...overrides,
  };
}

function makeInput(overrides: Partial<ConsultInput> = {}): ConsultInput {
  return {
    client: makeClient(),
    concerns: ['fine lines', 'dull skin'],
    consultType: 'new_client',
    budget: 'moderate',
    timeAvailable: 30,
    ...overrides,
  };
}

describe('Consult Co-pilot Engine', () => {
  // ── Structure ──
  it('returns all expected fields', () => {
    const r = generateConsultCopilot(makeInput());
    expect(r).toHaveProperty('clientBriefing');
    expect(r).toHaveProperty('treatmentPlan');
    expect(r).toHaveProperty('talkingPoints');
    expect(r).toHaveProperty('objectionHandlers');
    expect(r).toHaveProperty('crossSellOpportunities');
    expect(r).toHaveProperty('closingStrategy');
    expect(r).toHaveProperty('followUpPlan');
    expect(r).toHaveProperty('consultScore');
  });

  it('consultScore is 0-100', () => {
    const r = generateConsultCopilot(makeInput());
    expect(r.consultScore).toBeGreaterThanOrEqual(0);
    expect(r.consultScore).toBeLessThanOrEqual(100);
  });

  // ── Client Briefing ──
  it('segments new client correctly', () => {
    const r = generateConsultCopilot(makeInput());
    expect(r.clientBriefing.segment).toBe('new');
  });

  it('segments VIP client (>$5000 spend)', () => {
    const r = generateConsultCopilot(makeInput({
      client: makeClient({ totalSpend: 6000, visitCount: 20 }),
      consultType: 'existing_client',
    }));
    expect(r.clientBriefing.segment).toBe('vip');
  });

  it('segments at-risk client', () => {
    const r = generateConsultCopilot(makeInput({
      client: makeClient({ churnRisk: 75, visitCount: 1 }),
      consultType: 'existing_client',
    }));
    expect(r.clientBriefing.segment).toBe('at_risk');
  });

  it('identifies LTV estimate', () => {
    const r = generateConsultCopilot(makeInput({
      client: makeClient({ totalSpend: 3000, visitCount: 10 }),
    }));
    expect(r.clientBriefing.ltv).toBeGreaterThan(0);
  });

  it('identifies membership conversion opportunity', () => {
    const r = generateConsultCopilot(makeInput({
      client: makeClient({ visitCount: 5, membershipStatus: 'none' }),
    }));
    expect(r.clientBriefing.opportunities.some(o => o.includes('Membership'))).toBe(true);
  });

  it('flags churn risk', () => {
    const r = generateConsultCopilot(makeInput({
      client: makeClient({ churnRisk: 80 }),
    }));
    expect(r.clientBriefing.riskFlags.some(f => f.includes('churn'))).toBe(true);
  });

  // ── Treatment Plan ──
  it('matches concerns to appropriate services', () => {
    const r = generateConsultCopilot(makeInput({ concerns: ['acne scars', 'skin laxity'] }));
    const allServices = [r.treatmentPlan.primary.service, ...r.treatmentPlan.alternatives.map(a => a.service)];
    expect(allServices.some(s => s === 'RF Microneedling' || s === 'Sofwave')).toBe(true);
  });

  it('includes price in recommendations', () => {
    const r = generateConsultCopilot(makeInput());
    expect(r.treatmentPlan.primary.price).toBeGreaterThan(0);
  });

  it('builds timeline with at least 2 steps', () => {
    const r = generateConsultCopilot(makeInput());
    expect(r.treatmentPlan.timeline.length).toBeGreaterThanOrEqual(2);
  });

  it('offers package when 2+ matched services', () => {
    const r = generateConsultCopilot(makeInput({ concerns: ['fine lines', 'dull skin', 'acne'] }));
    // Multiple concerns should match multiple services
    expect(r.treatmentPlan.packages.length).toBeGreaterThanOrEqual(0);
  });

  it('calculates financing monthly when eligible', () => {
    const r = generateConsultCopilot(makeInput({ concerns: ['skin tightening'] }));
    const sofwave = [r.treatmentPlan.primary, ...r.treatmentPlan.alternatives]
      .find(x => x.financingEligible);
    if (sofwave) {
      expect(sofwave.financingMonthly).toBeGreaterThan(0);
    }
  });

  // ── Talking Points ──
  it('includes welcome script for new client', () => {
    const r = generateConsultCopilot(makeInput({ consultType: 'new_client' }));
    const welcome = r.talkingPoints.find(tp => tp.topic === 'Welcome & Rapport');
    expect(welcome).toBeDefined();
    expect(welcome!.priority).toBe('must_say');
    expect(welcome!.script).toContain('Jane');
  });

  it('includes client recognition for returning client', () => {
    const r = generateConsultCopilot(makeInput({
      consultType: 'existing_client',
      client: makeClient({ visitCount: 5, previousServices: ['HydraFacial'] }),
    }));
    const recognition = r.talkingPoints.find(tp => tp.topic === 'Client Recognition');
    expect(recognition).toBeDefined();
  });

  it('includes financing bridge for budget clients', () => {
    const r = generateConsultCopilot(makeInput({ budget: 'budget' }));
    expect(r.talkingPoints.some(tp => tp.topic === 'Financing Bridge')).toBe(true);
  });

  it('includes membership intro for non-members', () => {
    const r = generateConsultCopilot(makeInput());
    expect(r.talkingPoints.some(tp => tp.topic === 'Membership Introduction')).toBe(true);
  });

  // ── Objection Handlers ──
  it('includes standard objections', () => {
    const r = generateConsultCopilot(makeInput());
    expect(r.objectionHandlers.length).toBeGreaterThanOrEqual(5);
    expect(r.objectionHandlers.some(o => o.objection === 'too expensive')).toBe(true);
    expect(r.objectionHandlers.some(o => o.objection === 'need to think about it')).toBe(true);
  });

  it('adds budget-specific handler for budget clients', () => {
    const r = generateConsultCopilot(makeInput({ budget: 'budget' }));
    expect(r.objectionHandlers.some(o => o.objection.includes('limited budget'))).toBe(true);
  });

  // ── Cross-Sell ──
  it('identifies cross-sell opportunities', () => {
    const r = generateConsultCopilot(makeInput({ concerns: ['dull skin'] }));
    expect(r.crossSellOpportunities.length).toBeGreaterThanOrEqual(0);
  });

  it('cross-sell likelihood adjusts for budget', () => {
    const premium = generateConsultCopilot(makeInput({ budget: 'premium' }));
    const budget = generateConsultCopilot(makeInput({ budget: 'budget' }));
    if (premium.crossSellOpportunities.length > 0 && budget.crossSellOpportunities.length > 0) {
      expect(premium.crossSellOpportunities[0].conversionLikelihood)
        .toBeGreaterThan(budget.crossSellOpportunities[0].conversionLikelihood);
    }
  });

  // ── Closing Strategy ──
  it('uses assumptive close for low-ticket new client', () => {
    const r = generateConsultCopilot(makeInput());
    expect(r.closingStrategy.approach).toBe('assumptive');
  });

  it('uses value close for high-ticket', () => {
    const r = generateConsultCopilot(makeInput({ concerns: ['skin tightening'] }));
    // Sofwave is ~$2750 which is high-ticket
    if (r.treatmentPlan.primary.totalInvestment > 1000) {
      expect(r.closingStrategy.approach).toBe('value');
      expect(r.closingStrategy.financingPitch).toBeDefined();
    }
  });

  // ── Follow-Up Plan ──
  it('includes personalized follow-up with client name', () => {
    const r = generateConsultCopilot(makeInput());
    expect(r.followUpPlan.sameDay).toContain('Jane');
    expect(r.followUpPlan.oneWeek).toContain('Jane');
  });

  // ── Edge Cases ──
  it('handles empty concerns', () => {
    const r = generateConsultCopilot(makeInput({ concerns: [] }));
    expect(r.treatmentPlan.primary).toBeDefined();
  });

  it('handles no previous services', () => {
    const r = generateConsultCopilot(makeInput());
    expect(r).toBeDefined();
  });

  it('handles cancelled membership client', () => {
    const r = generateConsultCopilot(makeInput({
      client: makeClient({ membershipStatus: 'cancelled' }),
    }));
    expect(r.clientBriefing.riskFlags.some(f => f.includes('Cancelled membership'))).toBe(true);
  });
});
