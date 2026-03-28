import { describe, it, expect } from 'vitest';
import {
  generateConsultationCopilot,
  OBJECTION_HANDLERS,
  COMPETITOR_RESPONSES,
  CLOSING_TECHNIQUES,
} from '../consultation-copilot';
import type { ConsultationContext, ClientProfile, SkinConcern } from '@/types/ai-treatment';

function makeContext(overrides: Partial<ConsultationContext> = {}): ConsultationContext {
  return {
    client: {
      name: 'Jane Doe',
      age: 40,
      gender: 'female',
      skinType: 2,
      concerns: ['wrinkles', 'volume_loss'] as SkinConcern[],
      budget: 'value',
      painTolerance: 'moderate',
      downtimeAvailability: 'minimal',
      medicalHistory: {
        pregnant: false, breastfeeding: false, bloodThinners: false,
        autoimmune: false, keloidHistory: false, activeSkinInfection: false,
        recentSunExposure: false, isotretinoin: false, allergies: [], medications: [], conditions: [],
      },
    },
    consultType: 'new_client',
    interestedServices: ['Botox'],
    ...overrides,
  };
}

describe('Consultation Copilot', () => {
  describe('generateConsultationCopilot', () => {
    it('returns complete copilot result', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.suggestions).toBeDefined();
      expect(result.objectionHandlers).toBeDefined();
      expect(result.upsellPrompts).toBeDefined();
      expect(result.medicalFlags).toBeDefined();
      expect(result.financingTalkingPoints).toBeDefined();
      expect(result.competitorResponses).toBeDefined();
      expect(result.closingTechniques).toBeDefined();
      expect(result.followUpTemplates).toBeDefined();
      expect(result.conversionScore).toBeDefined();
    });

    it('generates suggestions sorted by relevance', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.suggestions.length).toBeGreaterThan(0);
      for (let i = 1; i < result.suggestions.length; i++) {
        expect(result.suggestions[i].relevanceScore).toBeLessThanOrEqual(result.suggestions[i - 1].relevanceScore);
      }
    });

    it('includes treatment suggestions', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.suggestions.some(s => s.type === 'treatment')).toBe(true);
    });

    it('includes membership suggestion for new clients', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.suggestions.some(s => s.type === 'membership')).toBe(true);
    });

    it('includes skincare suggestion', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.suggestions.some(s => s.type === 'skincare')).toBe(true);
    });
  });

  describe('Objection handling', () => {
    it('always includes price objections', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.objectionHandlers.some(o => o.category === 'price')).toBe(true);
    });

    it('includes pain objections for low pain tolerance', () => {
      const result = generateConsultationCopilot(makeContext({
        client: { ...makeContext().client, painTolerance: 'low' },
      }));
      expect(result.objectionHandlers.some(o => o.category === 'pain')).toBe(true);
    });

    it('includes downtime objections for no-downtime clients', () => {
      const result = generateConsultationCopilot(makeContext({
        client: { ...makeContext().client, downtimeAvailability: 'none' },
      }));
      expect(result.objectionHandlers.some(o => o.category === 'downtime')).toBe(true);
    });

    it('includes skepticism for new clients', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.objectionHandlers.some(o => o.category === 'skepticism')).toBe(true);
    });

    it('includes competitor objections when competitor signal present', () => {
      const result = generateConsultationCopilot(makeContext({
        engagementSignals: [{ type: 'compared_competitor' }],
      }));
      expect(result.objectionHandlers.some(o => o.category === 'competitor')).toBe(true);
    });

    it('each handler has response and follow-up', () => {
      const result = generateConsultationCopilot(makeContext());
      for (const handler of result.objectionHandlers) {
        expect(handler.response).toBeTruthy();
        expect(handler.followUp).toBeTruthy();
        expect(handler.technique).toBeTruthy();
      }
    });
  });

  describe('Upsell prompts', () => {
    it('generates upsell suggestions', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.upsellPrompts.length).toBeGreaterThan(0);
    });

    it('upsells are sorted by conversion likelihood', () => {
      const result = generateConsultationCopilot(makeContext());
      for (let i = 1; i < result.upsellPrompts.length; i++) {
        expect(result.upsellPrompts[i].conversionLikelihood).toBeLessThanOrEqual(result.upsellPrompts[i - 1].conversionLikelihood);
      }
    });

    it('includes Botox upsell for filler clients', () => {
      const result = generateConsultationCopilot(makeContext({
        interestedServices: ['Dermal Filler — Cheeks'],
      }));
      expect(result.upsellPrompts.some(u => u.suggestedAddOn === 'Botox')).toBe(true);
    });

    it('includes lip flip for lip filler clients', () => {
      const result = generateConsultationCopilot(makeContext({
        interestedServices: ['lip filler'],
      }));
      expect(result.upsellPrompts.some(u => u.suggestedAddOn.includes('Lip Flip'))).toBe(true);
    });

    it('each upsell has a pitch', () => {
      const result = generateConsultationCopilot(makeContext());
      for (const upsell of result.upsellPrompts) {
        expect(upsell.pitch).toBeTruthy();
        expect(upsell.additionalCost).toBeGreaterThan(0);
      }
    });
  });

  describe('Medical flags', () => {
    it('no flags for healthy patient', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.medicalFlags.length).toBe(0);
    });

    it('critical flag for pregnancy', () => {
      const result = generateConsultationCopilot(makeContext({
        client: {
          ...makeContext().client,
          medicalHistory: { ...makeContext().client.medicalHistory, pregnant: true },
        },
      }));
      expect(result.medicalFlags.some(f => f.severity === 'critical')).toBe(true);
    });

    it('warning for blood thinners', () => {
      const result = generateConsultationCopilot(makeContext({
        client: {
          ...makeContext().client,
          medicalHistory: { ...makeContext().client.medicalHistory, bloodThinners: true },
        },
      }));
      expect(result.medicalFlags.some(f => f.severity === 'warning')).toBe(true);
    });

    it('critical for isotretinoin', () => {
      const result = generateConsultationCopilot(makeContext({
        client: {
          ...makeContext().client,
          medicalHistory: { ...makeContext().client.medicalHistory, isotretinoin: true },
        },
      }));
      expect(result.medicalFlags.some(f => f.flag.includes('isotretinoin'))).toBe(true);
    });

    it('info for allergies', () => {
      const result = generateConsultationCopilot(makeContext({
        client: {
          ...makeContext().client,
          medicalHistory: { ...makeContext().client.medicalHistory, allergies: ['Latex'] },
        },
      }));
      expect(result.medicalFlags.some(f => f.severity === 'info')).toBe(true);
    });

    it('flags active skin infection as critical', () => {
      const result = generateConsultationCopilot(makeContext({
        client: {
          ...makeContext().client,
          medicalHistory: { ...makeContext().client.medicalHistory, activeSkinInfection: true },
        },
      }));
      expect(result.medicalFlags.some(f => f.severity === 'critical' && f.flag.includes('infection'))).toBe(true);
    });
  });

  describe('Financing points', () => {
    it('generates financing options', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.financingTalkingPoints.length).toBeGreaterThan(0);
    });

    it('includes membership option', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.financingTalkingPoints.some(f => f.option.includes('Membership'))).toBe(true);
    });

    it('each option has a talking point', () => {
      const result = generateConsultationCopilot(makeContext());
      for (const point of result.financingTalkingPoints) {
        expect(point.talkingPoint).toBeTruthy();
        expect(point.monthlyPayment).toBeGreaterThan(0);
      }
    });
  });

  describe('Closing techniques', () => {
    it('generates closing techniques', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.closingTechniques.length).toBeGreaterThan(0);
    });

    it('includes trial close for new clients', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.closingTechniques.some(t => t.approach === 'trial')).toBe(true);
    });

    it('includes urgency close when event mentioned', () => {
      const result = generateConsultationCopilot(makeContext({
        engagementSignals: [{ type: 'mentioned_event' }],
      }));
      expect(result.closingTechniques.some(t => t.approach === 'urgency')).toBe(true);
    });

    it('each technique has a script', () => {
      const result = generateConsultationCopilot(makeContext());
      for (const technique of result.closingTechniques) {
        expect(technique.script).toBeTruthy();
        expect(technique.bestFor).toBeTruthy();
      }
    });
  });

  describe('Follow-up templates', () => {
    it('generates 5 follow-up templates', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.followUpTemplates.length).toBe(5);
    });

    it('includes same day, next day, and one week', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.followUpTemplates.some(t => t.timing === 'same_day')).toBe(true);
      expect(result.followUpTemplates.some(t => t.timing === 'next_day')).toBe(true);
      expect(result.followUpTemplates.some(t => t.timing === 'one_week')).toBe(true);
    });

    it('templates include client name', () => {
      const result = generateConsultationCopilot(makeContext());
      for (const template of result.followUpTemplates) {
        expect(template.body).toContain('Jane');
      }
    });
  });

  describe('Conversion scoring', () => {
    it('returns a score 0-100', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.conversionScore.score).toBeGreaterThanOrEqual(5);
      expect(result.conversionScore.score).toBeLessThanOrEqual(95);
    });

    it('has conversion factors', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.conversionScore.factors.length).toBeGreaterThan(0);
    });

    it('has a recommendation', () => {
      const result = generateConsultationCopilot(makeContext());
      expect(result.conversionScore.recommendation).toBeTruthy();
    });

    it('positive signals increase score', () => {
      const withSignals = generateConsultationCopilot(makeContext({
        engagementSignals: [
          { type: 'asked_price' },
          { type: 'asked_results' },
          { type: 'asked_financing' },
        ],
      }));
      const without = generateConsultationCopilot(makeContext());
      expect(withSignals.conversionScore.score).toBeGreaterThan(without.conversionScore.score);
    });

    it('existing clients score higher', () => {
      const existing = generateConsultationCopilot(makeContext({ consultType: 'existing_client' }));
      const newClient = generateConsultationCopilot(makeContext({ consultType: 'new_client' }));
      expect(existing.conversionScore.score).toBeGreaterThan(newClient.conversionScore.score);
    });

    it('medical contraindications reduce score', () => {
      const pregnant = generateConsultationCopilot(makeContext({
        client: {
          ...makeContext().client,
          medicalHistory: { ...makeContext().client.medicalHistory, pregnant: true },
        },
      }));
      const healthy = generateConsultationCopilot(makeContext());
      expect(pregnant.conversionScore.score).toBeLessThan(healthy.conversionScore.score);
    });
  });

  describe('OBJECTION_HANDLERS database', () => {
    it('has 12+ objection handlers', () => {
      expect(OBJECTION_HANDLERS.length).toBeGreaterThanOrEqual(12);
    });

    it('covers all categories', () => {
      const categories = new Set(OBJECTION_HANDLERS.map(h => h.category));
      expect(categories.has('price')).toBe(true);
      expect(categories.has('pain')).toBe(true);
      expect(categories.has('downtime')).toBe(true);
      expect(categories.has('think_about_it')).toBe(true);
      expect(categories.has('competitor')).toBe(true);
      expect(categories.has('skepticism')).toBe(true);
    });

    it('no handler says infusion', () => {
      for (const handler of OBJECTION_HANDLERS) {
        expect(handler.response.toLowerCase()).not.toContain('infusion');
        expect(handler.followUp.toLowerCase()).not.toContain('infusion');
      }
    });
  });

  describe('COMPETITOR_RESPONSES database', () => {
    it('has 5 competitor responses', () => {
      expect(COMPETITOR_RESPONSES.length).toBe(5);
    });

    it('each has our advantage', () => {
      for (const resp of COMPETITOR_RESPONSES) {
        expect(resp.ourAdvantage).toBeTruthy();
        expect(resp.response).toBeTruthy();
      }
    });
  });

  describe('CLOSING_TECHNIQUES database', () => {
    it('has 6 closing techniques', () => {
      expect(CLOSING_TECHNIQUES.length).toBe(6);
    });

    it('covers multiple approaches', () => {
      const approaches = new Set(CLOSING_TECHNIQUES.map(t => t.approach));
      expect(approaches.size).toBeGreaterThanOrEqual(5);
    });
  });
});
