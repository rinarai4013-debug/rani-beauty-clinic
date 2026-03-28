import {
  generateUpsellRecommendations,
  analyzeBatchUpsells,
  COMPATIBILITY_MATRIX,
} from '../upsell-engine';
import type {
  UpsellInput,
  UpsellClientProfile,
  AddOnService,
  MembershipPlanInfo,
  RetailProduct,
} from '../upsell-engine';

// ── HELPERS ──

function makeClient(overrides: Partial<UpsellClientProfile> = {}): UpsellClientProfile {
  return {
    id: 'c1',
    name: 'Sarah Johnson',
    totalSpend: 3500,
    visitCount: 8,
    avgTicket: 437,
    purchaseHistory: [
      { date: '2026-01-15', service: 'HydraFacial', amount: 275, addOns: [], products: [], acceptedUpsell: true },
      { date: '2026-02-10', service: 'Botox', amount: 350, addOns: ['Lip Flip'], products: [], acceptedUpsell: true },
      { date: '2026-03-01', service: 'HydraFacial', amount: 275, addOns: [], products: ['SPF 50'], acceptedUpsell: false },
    ],
    servicesUsed: ['HydraFacial', 'Botox'],
    productsOwned: ['SPF 50'],
    lastVisitDate: '2026-03-01',
    preferredCategories: ['Facial', 'Injectable'],
    priceSegment: 'premium',
    ...overrides,
  };
}

const ADD_ONS: AddOnService[] = [
  { name: 'LED Light Therapy', category: 'Add-On', price: 75, duration: 15, compatibleWith: ['HydraFacial'], description: 'LED treatment' },
  { name: 'Lip Perk', category: 'Add-On', price: 50, duration: 10, compatibleWith: ['HydraFacial'], description: 'Lip treatment' },
  { name: 'PRP Enhancement', category: 'Add-On', price: 200, duration: 15, compatibleWith: ['RF Microneedling'], description: 'PRP boost' },
];

const PLANS: MembershipPlanInfo[] = [
  { tier: 'Halo', monthlyPrice: 149, annualSavings: 298, benefits: ['Credits', '10% off'] },
  { tier: 'Glow', monthlyPrice: 249, annualSavings: 498, benefits: ['Credits', '15% off'] },
  { tier: 'Elite', monthlyPrice: 449, annualSavings: 898, benefits: ['Credits', '20% off'] },
];

const PRODUCTS: RetailProduct[] = [
  { name: 'Vitamin C Serum', category: 'Serum', price: 85, margin: 0.60, complementsServices: ['HydraFacial'], description: 'Brightening serum' },
  { name: 'Retinol Serum', category: 'Serum', price: 95, margin: 0.60, complementsServices: ['Botox'], description: 'Anti-aging serum' },
  { name: 'SPF 50', category: 'Sun', price: 45, margin: 0.65, complementsServices: ['HydraFacial'], description: 'Sunscreen' },
];

function makeInput(overrides: Partial<UpsellInput> = {}): UpsellInput {
  return {
    client: makeClient(),
    currentService: 'HydraFacial',
    visitContext: 'check-in',
    availableAddOns: ADD_ONS,
    membershipPlans: PLANS,
    productCatalog: PRODUCTS,
    ...overrides,
  };
}

// ── TESTS ──

describe('Upsell Engine', () => {
  describe('generateUpsellRecommendations', () => {
    it('should return valid structure', () => {
      const result = generateUpsellRecommendations(makeInput());
      expect(result.recommendations).toBeDefined();
      expect(result.retailSuggestions).toBeDefined();
      expect(result.ticketImpact).toBeDefined();
      expect(result.scripts).toBeDefined();
    });

    it('should return max 5 recommendations', () => {
      const result = generateUpsellRecommendations(makeInput());
      expect(result.recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should sort recommendations by propensityScore descending', () => {
      const result = generateUpsellRecommendations(makeInput());
      for (let i = 1; i < result.recommendations.length; i++) {
        expect(result.recommendations[i].propensityScore).toBeLessThanOrEqual(result.recommendations[i - 1].propensityScore);
      }
    });

    it('should suggest add-ons compatible with current service', () => {
      const result = generateUpsellRecommendations(makeInput());
      const addOns = result.recommendations.filter(r => r.type === 'add-on');
      const compatAddOns = COMPATIBILITY_MATRIX['HydraFacial']?.addOns || [];
      for (const addOn of addOns) {
        expect(compatAddOns).toContain(addOn.service);
      }
    });

    it('should not cross-sell services the client already uses', () => {
      const result = generateUpsellRecommendations(makeInput());
      const crossSells = result.recommendations.filter(r => r.type === 'cross-sell');
      for (const cs of crossSells) {
        expect(['HydraFacial', 'Botox']).not.toContain(cs.service);
      }
    });

    it('should have propensityScore between 0 and 100', () => {
      const result = generateUpsellRecommendations(makeInput());
      for (const rec of result.recommendations) {
        expect(rec.propensityScore).toBeGreaterThanOrEqual(0);
        expect(rec.propensityScore).toBeLessThanOrEqual(100);
      }
    });

    it('should include valid types', () => {
      const validTypes = ['add-on', 'upgrade', 'cross-sell', 'package', 'membership'];
      const result = generateUpsellRecommendations(makeInput());
      for (const rec of result.recommendations) {
        expect(validTypes).toContain(rec.type);
      }
    });

    it('should have valid confidence levels', () => {
      const validConfidence = ['high', 'medium', 'low'];
      const result = generateUpsellRecommendations(makeInput());
      for (const rec of result.recommendations) {
        expect(validConfidence).toContain(rec.confidence);
      }
    });
  });

  describe('Propensity Scoring', () => {
    it('should score luxury clients higher for expensive services', () => {
      const luxuryResult = generateUpsellRecommendations(makeInput({
        client: makeClient({ priceSegment: 'luxury', visitCount: 12, totalSpend: 15000 }),
      }));
      const budgetResult = generateUpsellRecommendations(makeInput({
        client: makeClient({ priceSegment: 'budget', visitCount: 2, totalSpend: 500 }),
      }));
      const luxuryAvg = luxuryResult.recommendations.reduce((s, r) => s + r.propensityScore, 0) / Math.max(1, luxuryResult.recommendations.length);
      const budgetAvg = budgetResult.recommendations.reduce((s, r) => s + r.propensityScore, 0) / Math.max(1, budgetResult.recommendations.length);
      expect(luxuryAvg).toBeGreaterThan(budgetAvg);
    });

    it('should score members higher than non-members', () => {
      const memberResult = generateUpsellRecommendations(makeInput({
        client: makeClient({ membershipStatus: 'active' }),
      }));
      const nonMemberResult = generateUpsellRecommendations(makeInput({
        client: makeClient({ membershipStatus: undefined }),
      }));
      const memberAvg = memberResult.recommendations.reduce((s, r) => s + r.propensityScore, 0) / Math.max(1, memberResult.recommendations.length);
      const nonMemberAvg = nonMemberResult.recommendations.reduce((s, r) => s + r.propensityScore, 0) / Math.max(1, nonMemberResult.recommendations.length);
      expect(memberAvg).toBeGreaterThanOrEqual(nonMemberAvg);
    });

    it('should score repeat visitors higher', () => {
      const frequentResult = generateUpsellRecommendations(makeInput({
        client: makeClient({ visitCount: 15 }),
      }));
      const rareResult = generateUpsellRecommendations(makeInput({
        client: makeClient({ visitCount: 1 }),
      }));
      const freqAvg = frequentResult.recommendations.reduce((s, r) => s + r.propensityScore, 0) / Math.max(1, frequentResult.recommendations.length);
      const rareAvg = rareResult.recommendations.reduce((s, r) => s + r.propensityScore, 0) / Math.max(1, rareResult.recommendations.length);
      expect(freqAvg).toBeGreaterThan(rareAvg);
    });
  });

  describe('Membership Conversion', () => {
    it('should suggest membership for non-members with 2+ visits', () => {
      const result = generateUpsellRecommendations(makeInput({
        client: makeClient({ membershipStatus: undefined, visitCount: 5 }),
      }));
      expect(result.membershipConversion).toBeDefined();
      expect(result.membershipConversion?.eligible).toBe(true);
    });

    it('should not suggest membership for existing members', () => {
      const result = generateUpsellRecommendations(makeInput({
        client: makeClient({ membershipStatus: 'active' }),
      }));
      expect(result.membershipConversion).toBeUndefined();
    });

    it('should not suggest membership for first-time visitors', () => {
      const result = generateUpsellRecommendations(makeInput({
        client: makeClient({ visitCount: 1 }),
      }));
      expect(result.membershipConversion).toBeUndefined();
    });

    it('should include pitch in membership conversion', () => {
      const result = generateUpsellRecommendations(makeInput({
        client: makeClient({ membershipStatus: undefined, visitCount: 8 }),
      }));
      if (result.membershipConversion) {
        expect(result.membershipConversion.pitch).toBeTruthy();
        expect(result.membershipConversion.pitch.length).toBeGreaterThan(20);
      }
    });
  });

  describe('Package Upgrade', () => {
    it('should suggest package for HydraFacial', () => {
      const result = generateUpsellRecommendations(makeInput({ currentService: 'HydraFacial' }));
      expect(result.packageUpgrade).toBeDefined();
      expect(result.packageUpgrade?.suggestedPackage).toContain('HydraFacial');
    });

    it('should calculate per-session savings', () => {
      const result = generateUpsellRecommendations(makeInput({ currentService: 'HydraFacial' }));
      if (result.packageUpgrade) {
        expect(result.packageUpgrade.perSessionSavings).toBeGreaterThan(0);
      }
    });
  });

  describe('Retail Suggestions', () => {
    it('should not suggest products client already owns', () => {
      const result = generateUpsellRecommendations(makeInput());
      const ownedProducts = ['SPF 50'];
      for (const suggestion of result.retailSuggestions) {
        expect(ownedProducts).not.toContain(suggestion.product);
      }
    });

    it('should limit to 3 retail suggestions', () => {
      const result = generateUpsellRecommendations(makeInput());
      expect(result.retailSuggestions.length).toBeLessThanOrEqual(3);
    });

    it('should sort by propensity descending', () => {
      const result = generateUpsellRecommendations(makeInput());
      for (let i = 1; i < result.retailSuggestions.length; i++) {
        expect(result.retailSuggestions[i].propensity).toBeLessThanOrEqual(result.retailSuggestions[i - 1].propensity);
      }
    });
  });

  describe('Script Generation', () => {
    it('should generate scripts for recommendations', () => {
      const result = generateUpsellRecommendations(makeInput());
      expect(result.scripts.length).toBeGreaterThan(0);
    });

    it('should include fallback and objection handler', () => {
      const result = generateUpsellRecommendations(makeInput());
      for (const script of result.scripts) {
        expect(script.fallback).toBeTruthy();
        expect(script.objectionHandler).toBeTruthy();
      }
    });

    it('should personalize scripts with client first name', () => {
      const result = generateUpsellRecommendations(makeInput());
      for (const script of result.scripts) {
        expect(script.script).toContain('Sarah');
      }
    });
  });

  describe('Ticket Impact', () => {
    it('should calculate positive uplift when upsells are available', () => {
      const result = generateUpsellRecommendations(makeInput());
      expect(result.ticketImpact.projectedTicket).toBeGreaterThanOrEqual(result.ticketImpact.currentAvgTicket);
    });

    it('should calculate annual revenue impact', () => {
      const result = generateUpsellRecommendations(makeInput());
      expect(result.ticketImpact.annualRevenueImpact).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Batch Analysis', () => {
    it('should return valid batch result', () => {
      const result = analyzeBatchUpsells([], ADD_ONS, PLANS, PRODUCTS);
      expect(result.totalClientsAnalyzed).toBe(0);
      expect(result.avgPropensityScore).toBe(0);
    });

    it('should analyze multiple clients', () => {
      const clients = [
        makeClient({ id: 'c1', name: 'Client 1' }),
        makeClient({ id: 'c2', name: 'Client 2', servicesUsed: ['Botox'] }),
      ];
      const result = analyzeBatchUpsells(clients, ADD_ONS, PLANS, PRODUCTS);
      expect(result.totalClientsAnalyzed).toBe(2);
    });
  });

  describe('Compatibility Matrix', () => {
    it('should have entries for all major services', () => {
      const services = ['HydraFacial', 'Botox', 'Fillers', 'RF Microneedling', 'Sofwave', 'PicoWay', 'VI Peel'];
      for (const svc of services) {
        expect(COMPATIBILITY_MATRIX[svc]).toBeDefined();
        expect(COMPATIBILITY_MATRIX[svc].addOns.length).toBeGreaterThan(0);
        expect(COMPATIBILITY_MATRIX[svc].crossSells.length).toBeGreaterThan(0);
        expect(COMPATIBILITY_MATRIX[svc].products.length).toBeGreaterThan(0);
      }
    });

    it('should never say infusion in compatibility matrix', () => {
      for (const [, value] of Object.entries(COMPATIBILITY_MATRIX)) {
        for (const addOn of value.addOns) {
          expect(addOn.toLowerCase()).not.toContain('infusion');
        }
        for (const cs of value.crossSells) {
          expect(cs.toLowerCase()).not.toContain('infusion');
        }
      }
    });
  });
});
