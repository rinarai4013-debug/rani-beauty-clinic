// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  buildFinancialSection,
  buildOperationsSection,
  buildMarketingSection,
  buildCompetitiveSection,
  buildIndustryNewsSection,
  buildPolymarketSection,
  buildAIInsightsSection,
  buildActionItems,
  buildExecutiveSummary,
  assembleMegaBriefing,
  renderMegaBriefingHTML,
  renderMegaBriefingText,
  generateAndRenderMegaBriefing,
  type MegaBriefingData,
  type FinancialSection,
  type OperationsSection,
} from '../mega-briefing';
import type { RevenueSnapshot, ScheduleSnapshot, AlertSnapshot, CashFlowSnapshot, AIHighlights } from '../types';

// ── Fixtures ──────────────────────────────────────────────────

const mockRevenue: RevenueSnapshot = {
  total: 3500,
  byProvider: { 'Dr. Rina': 2000, 'Mom': 1500 },
  byService: { 'HydraFacial': 1500, 'Botox': 2000 },
  byCategory: { 'Facial': 1500, 'Injectable': 2000 },
  byPaymentMethod: { 'Square': 3000, 'Cash': 500 },
  transactionCount: 8,
  avgTicket: 437.5,
  financingTotal: 0,
};

const mockSchedule: ScheduleSnapshot = {
  totalAppointments: 12,
  byProvider: { 'Dr. Rina': 7, 'Mom': 5 },
  byCategory: { 'Facial': 4, 'Injectable': 5, 'Consult': 3 },
  gaps: [{ provider: 'Dr. Rina', startTime: '14:00', duration: 60 }],
  consultCount: 3,
  newClientCount: 2,
};

const mockAlerts: AlertSnapshot = {
  total: 3,
  bySeverity: { critical: 1, warning: 1, info: 1 },
  items: [
    { id: '1', type: 'inventory', severity: 'critical', message: 'Low Botox stock', actionRecommended: 'Reorder', createdDate: '2026-03-25' },
    { id: '2', type: 'compliance', severity: 'warning', message: 'License renewal due', actionRecommended: 'Schedule renewal', createdDate: '2026-03-25' },
    { id: '3', type: 'review', severity: 'info', message: 'New 5-star review', actionRecommended: 'Respond', createdDate: '2026-03-25' },
  ],
};

const mockCashFlow: CashFlowSnapshot = {
  bankBalance: 45000,
  runway: 90,
  plaidConnected: true,
  monthlyBurnRate: 15000,
};

const mockAIHighlights: AIHighlights = {
  topChurnRiskClient: { name: 'Jane Smith', score: 82, lastVisit: '2026-01-15' },
  highestNoShowRisk: { clientName: 'John Doe', service: 'HydraFacial', time: '10:00 AM', score: 65 },
  revenueAnomaly: { type: 'below_target', message: 'Revenue 25% below daily target' },
};

// ── Tests ─────────────────────────────────────────────────────

describe('Mega Briefing', () => {
  // ── Financial Section ──

  describe('buildFinancialSection', () => {
    it('should calculate pacing percentage', () => {
      const section = buildFinancialSection(mockRevenue, mockCashFlow, 40000, 80000, 10);
      expect(section.pacingPercent).toBe(50);
    });

    it('should detect ahead pacing', () => {
      const section = buildFinancialSection(mockRevenue, mockCashFlow, 70000, 80000, 10);
      expect(section.pacingPercent).toBe(88); // 70000/80000
    });

    it('should detect critical pacing when far behind', () => {
      const section = buildFinancialSection(mockRevenue, null, 5000, 80000, -50);
      expect(section.pacingStatus).toBe('critical');
    });

    it('should include cash position when available', () => {
      const section = buildFinancialSection(mockRevenue, mockCashFlow, 40000, 80000, 10);
      expect(section.cashPosition).toBe(45000);
      expect(section.runway).toBe(90);
    });

    it('should handle null cash flow', () => {
      const section = buildFinancialSection(mockRevenue, null, 40000, 80000, 10);
      expect(section.cashPosition).toBeNull();
      expect(section.runway).toBeNull();
    });

    it('should include revenue by provider', () => {
      const section = buildFinancialSection(mockRevenue, null, 40000, 80000, 10);
      expect(section.revenueByProvider['Dr. Rina']).toBe(2000);
    });

    it('should handle null revenue', () => {
      const section = buildFinancialSection(null, null, 0, 80000, 0);
      expect(section.yesterdayRevenue).toBe(0);
    });
  });

  // ── Operations Section ──

  describe('buildOperationsSection', () => {
    it('should count appointments and consults', () => {
      const section = buildOperationsSection(mockSchedule, mockAlerts);
      expect(section.todayAppointments).toBe(12);
      expect(section.todayConsults).toBe(3);
    });

    it('should count gaps', () => {
      const section = buildOperationsSection(mockSchedule, mockAlerts);
      expect(section.todayGaps).toBe(1);
    });

    it('should include alert counts by severity', () => {
      const section = buildOperationsSection(mockSchedule, mockAlerts);
      expect(section.activeAlerts.critical).toBe(1);
      expect(section.activeAlerts.warning).toBe(1);
    });

    it('should include top 5 alert items', () => {
      const section = buildOperationsSection(mockSchedule, mockAlerts);
      expect(section.alertItems.length).toBeLessThanOrEqual(5);
    });

    it('should handle null schedule', () => {
      const section = buildOperationsSection(null, null);
      expect(section.todayAppointments).toBe(0);
      expect(section.todayConsults).toBe(0);
    });

    it('should include inventory alerts', () => {
      const section = buildOperationsSection(mockSchedule, mockAlerts, [{ product: 'Botox', status: 'low' }]);
      expect(section.inventoryAlerts.length).toBe(1);
    });
  });

  // ── Marketing Section ──

  describe('buildMarketingSection', () => {
    it('should handle null ads intelligence', () => {
      const section = buildMarketingSection(null);
      expect(section.metaAds).toBeNull();
      expect(section.googleAds).toBeNull();
      expect(section.crossChannelWinner).toBeNull();
    });

    it('should include organic data', () => {
      const section = buildMarketingSection(null, { newLeads: 5, avgRating: 4.9 });
      expect(section.organic.newLeads).toBe(5);
      expect(section.organic.avgRating).toBe(4.9);
    });

    it('should default organic metrics', () => {
      const section = buildMarketingSection(null);
      expect(section.organic.avgRating).toBe(4.9);
      expect(section.organic.newLeads).toBe(0);
    });
  });

  // ── Competitive Section ──

  describe('buildCompetitiveSection', () => {
    it('should handle null competitor intelligence', () => {
      const section = buildCompetitiveSection(null);
      expect(section.topThreats.length).toBe(0);
      expect(section.marketShare).toBe(0);
    });
  });

  // ── Industry News Section ──

  describe('buildIndustryNewsSection', () => {
    it('should handle null market intelligence', () => {
      const section = buildIndustryNewsSection(null);
      expect(section.topStories.length).toBe(0);
      expect(section.fdaUpdates.length).toBe(0);
    });
  });

  // ── Polymarket Section ──

  describe('buildPolymarketSection', () => {
    it('should handle null digest', () => {
      const section = buildPolymarketSection(null);
      expect(section.topMovers.length).toBe(0);
      expect(section.overallSentiment).toBe('neutral');
    });
  });

  // ── AI Insights Section ──

  describe('buildAIInsightsSection', () => {
    it('should include churn risk clients', () => {
      const section = buildAIInsightsSection(mockAIHighlights);
      expect(section.churnEngine.length).toBe(1);
      expect(section.churnEngine[0].clientName).toBe('Jane Smith');
      expect(section.churnEngine[0].score).toBe(82);
    });

    it('should include revenue anomaly', () => {
      const section = buildAIInsightsSection(mockAIHighlights);
      expect(section.revenueAnomaly).not.toBeNull();
      expect(section.revenueAnomaly!.flag).toBe(true);
    });

    it('should handle null highlights', () => {
      const section = buildAIInsightsSection(null);
      expect(section.churnEngine.length).toBe(0);
      expect(section.revenueAnomaly).toBeNull();
    });
  });

  // ── Action Items ──

  describe('buildActionItems', () => {
    it('should generate critical items for critical pacing', () => {
      const briefing = makeBriefingPartial({ financial: { ...makeFinancial(), pacingStatus: 'critical', pacingPercent: 30 } });
      const items = buildActionItems(briefing);
      expect(items.critical.length).toBeGreaterThan(0);
    });

    it('should generate important items for critical alerts', () => {
      const briefing = makeBriefingPartial({ operations: { ...makeOperations(), activeAlerts: { critical: 2, warning: 1, info: 0 }, alertItems: [{ severity: 'critical', message: 'Test alert' }] } });
      const items = buildActionItems(briefing);
      expect(items.critical.length).toBeGreaterThan(0);
    });

    it('should generate schedule gap items', () => {
      const briefing = makeBriefingPartial({ operations: { ...makeOperations(), todayGaps: 4 } });
      const items = buildActionItems(briefing);
      expect(items.important.some(i => i.category === 'Schedule')).toBe(true);
    });

    it('should generate consult opportunistic items', () => {
      const briefing = makeBriefingPartial({ operations: { ...makeOperations(), todayConsults: 3 } });
      const items = buildActionItems(briefing);
      expect(items.opportunistic.some(i => i.category === 'Sales')).toBe(true);
    });

    it('should include source for each action', () => {
      const briefing = makeBriefingPartial({ financial: { ...makeFinancial(), pacingStatus: 'critical', pacingPercent: 20 } });
      const items = buildActionItems(briefing);
      for (const item of items.critical) {
        expect(item.source).toBeTruthy();
      }
    });
  });

  // ── Executive Summary ──

  describe('buildExecutiveSummary', () => {
    it('should describe ahead pacing positively', () => {
      const briefing = makeFullBriefing({ financial: { ...makeFinancial(), pacingStatus: 'ahead', pacingPercent: 110 } });
      const summary = buildExecutiveSummary(briefing);
      expect(summary.revenueStatus).toContain('ahead');
    });

    it('should flag critical pacing', () => {
      const briefing = makeFullBriefing({ financial: { ...makeFinancial(), pacingStatus: 'critical', pacingPercent: 20 } });
      const summary = buildExecutiveSummary(briefing);
      expect(summary.revenueStatus).toContain('critical');
    });

    it('should identify biggest opportunity', () => {
      const briefing = makeFullBriefing({ operations: { ...makeOperations(), todayConsults: 4 } });
      const summary = buildExecutiveSummary(briefing);
      expect(summary.biggestOpportunity).toBeTruthy();
    });

    it('should identify biggest risk from critical actions', () => {
      const briefing = makeFullBriefing({ financial: { ...makeFinancial(), pacingStatus: 'critical', pacingPercent: 15 } });
      const summary = buildExecutiveSummary(briefing);
      expect(summary.biggestRisk).not.toBe('No critical risks detected.');
    });

    it('should provide default messages when no issues', () => {
      const briefing = makeFullBriefing();
      const summary = buildExecutiveSummary(briefing);
      expect(summary.revenueStatus).toBeTruthy();
      expect(summary.biggestOpportunity).toBeTruthy();
      expect(summary.biggestRisk).toBeTruthy();
    });
  });

  // ── Mega Briefing Assembly ──

  describe('assembleMegaBriefing', () => {
    it('should assemble all sections', async () => {
      const data = await assembleMegaBriefing({
        revenue: mockRevenue,
        schedule: mockSchedule,
        alerts: mockAlerts,
        cashFlow: mockCashFlow,
        aiHighlights: mockAIHighlights,
        mtdRevenue: 40000,
        monthlyTarget: 80000,
      });
      expect(data.date).toBeTruthy();
      expect(data.dayOfWeek).toBeTruthy();
      expect(data.financial).toBeDefined();
      expect(data.operations).toBeDefined();
      expect(data.marketing).toBeDefined();
      expect(data.competitive).toBeDefined();
      expect(data.industryNews).toBeDefined();
      expect(data.polymarket).toBeDefined();
      expect(data.aiInsights).toBeDefined();
      expect(data.actionItems).toBeDefined();
      expect(data.executiveSummary).toBeDefined();
    });

    it('should handle all null inputs', async () => {
      const data = await assembleMegaBriefing({});
      expect(data.financial.yesterdayRevenue).toBe(0);
      expect(data.operations.todayAppointments).toBe(0);
    });
  });

  // ── HTML Rendering ──

  describe('renderMegaBriefingHTML', () => {
    it('should produce valid HTML', async () => {
      const data = await assembleMegaBriefing({ revenue: mockRevenue, schedule: mockSchedule, alerts: mockAlerts, mtdRevenue: 40000, monthlyTarget: 80000 });
      const html = renderMegaBriefingHTML(data);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });

    it('should include RANI INTELLIGENCE BRIEFING header', async () => {
      const data = await assembleMegaBriefing({});
      const html = renderMegaBriefingHTML(data);
      expect(html).toContain('RANI INTELLIGENCE BRIEFING');
    });

    it('should include all 8 section numbers', async () => {
      const data = await assembleMegaBriefing({ revenue: mockRevenue, schedule: mockSchedule, alerts: mockAlerts, aiHighlights: mockAIHighlights, mtdRevenue: 40000, monthlyTarget: 80000 });
      const html = renderMegaBriefingHTML(data);
      expect(html).toContain('Financial Snapshot');
      expect(html).toContain('Clinic Operations');
      expect(html).toContain('Marketing Performance');
      expect(html).toContain('Competitive Intelligence');
      expect(html).toContain('Industry News');
      expect(html).toContain('Polymarket');
      expect(html).toContain('AI Insights');
      expect(html).toContain('Action Items');
    });

    it('should include executive summary', async () => {
      const data = await assembleMegaBriefing({ revenue: mockRevenue, mtdRevenue: 40000, monthlyTarget: 80000 });
      const html = renderMegaBriefingHTML(data);
      expect(html).toContain('Executive Summary');
    });

    it('should include navy/gold color scheme', async () => {
      const data = await assembleMegaBriefing({});
      const html = renderMegaBriefingHTML(data);
      expect(html).toContain('#0F1D2C'); // navy
      expect(html).toContain('#C9A96E'); // gold
    });

    it('should include footer with dashboard links', async () => {
      const data = await assembleMegaBriefing({});
      const html = renderMegaBriefingHTML(data);
      expect(html).toContain('ranibeautyclinic.com/dashboard');
      expect(html).toContain('Powered by RaniOS');
    });

    it('should escape HTML in user content', async () => {
      const data = await assembleMegaBriefing({
        aiHighlights: {
          topChurnRiskClient: { name: 'Jane <script>alert("xss")</script>', score: 80, lastVisit: '2026-01-01' },
          highestNoShowRisk: null,
          revenueAnomaly: null,
        },
      });
      const html = renderMegaBriefingHTML(data);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should include responsive meta viewport', async () => {
      const data = await assembleMegaBriefing({});
      const html = renderMegaBriefingHTML(data);
      expect(html).toContain('viewport');
    });
  });

  // ── Text Rendering ──

  describe('renderMegaBriefingText', () => {
    it('should produce plain text output', async () => {
      const data = await assembleMegaBriefing({ revenue: mockRevenue, mtdRevenue: 40000, monthlyTarget: 80000 });
      const text = renderMegaBriefingText(data);
      expect(text).toContain('RANI INTELLIGENCE BRIEFING');
      expect(text).not.toContain('<');
    });

    it('should include financial data', async () => {
      const data = await assembleMegaBriefing({ revenue: mockRevenue, mtdRevenue: 40000, monthlyTarget: 80000 });
      const text = renderMegaBriefingText(data);
      expect(text).toContain('FINANCIAL SNAPSHOT');
      expect(text).toContain('Yesterday');
    });

    it('should include action items', async () => {
      const data = await assembleMegaBriefing({ revenue: mockRevenue, mtdRevenue: 5000, monthlyTarget: 80000 });
      const text = renderMegaBriefingText(data);
      expect(text).toContain('ACTION ITEMS');
    });
  });

  // ── End-to-End ──

  describe('generateAndRenderMegaBriefing', () => {
    it('should return subject, html, text, and data', async () => {
      const result = await generateAndRenderMegaBriefing({
        revenue: mockRevenue,
        schedule: mockSchedule,
        alerts: mockAlerts,
        mtdRevenue: 40000,
        monthlyTarget: 80000,
      });
      expect(result.subject).toBeTruthy();
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.text).toContain('RANI');
      expect(result.data).toBeDefined();
      expect(result.generatedAt).toBeTruthy();
    });

    it('should include pacing indicator in subject', async () => {
      const result = await generateAndRenderMegaBriefing({ mtdRevenue: 40000, monthlyTarget: 80000 });
      expect(result.subject).toContain('Rani Intelligence Briefing');
    });

    it('should include preheader from executive summary', async () => {
      const result = await generateAndRenderMegaBriefing({ revenue: mockRevenue, mtdRevenue: 40000, monthlyTarget: 80000 });
      expect(result.preheader).toBeTruthy();
      expect(result.preheader.length).toBeLessThanOrEqual(100);
    });
  });
});

// ── Helper Functions ──────────────────────────────────────────

function makeFinancial(overrides: Partial<FinancialSection> = {}): FinancialSection {
  return {
    yesterdayRevenue: 3500,
    mtdRevenue: 40000,
    monthlyTarget: 80000,
    pacingPercent: 50,
    pacingStatus: 'on_track',
    cashPosition: 45000,
    runway: 90,
    outstandingAR: 0,
    overdueInvoices: 0,
    yesterdayVsAvg: 10,
    revenueByProvider: { 'Dr. Rina': 2000, 'Mom': 1500 },
    revenueByCategory: { 'Facial': 1500, 'Injectable': 2000 },
    ...overrides,
  };
}

function makeOperations(overrides: Partial<OperationsSection> = {}): OperationsSection {
  return {
    todayAppointments: 12,
    todayGaps: 1,
    todayProviders: ['Dr. Rina', 'Mom'],
    todayConsults: 2,
    activeAlerts: { critical: 0, warning: 1, info: 1 },
    alertItems: [{ severity: 'warning', message: 'Test alert' }],
    staffTrainingCompletion: 100,
    inventoryAlerts: [],
    utilization: 75,
    ...overrides,
  };
}

function makeBriefingPartial(overrides: Partial<Omit<MegaBriefingData, 'actionItems' | 'executiveSummary'>> = {}): Omit<MegaBriefingData, 'actionItems' | 'executiveSummary'> {
  return {
    date: '2026-03-25',
    dayOfWeek: 'Tuesday',
    generatedAt: new Date().toISOString(),
    financial: makeFinancial(),
    operations: makeOperations(),
    marketing: { metaAds: null, googleAds: null, organic: { newLeads: 0, seoRankingChanges: 0, reviewVelocity: 0, newReviews7d: 0, avgRating: 4.9 }, crossChannelWinner: null, overallEfficiency: null },
    competitive: { topThreats: [], competitorMoves: [], yourPosition: { reviewRank: 0, keywordRank: null }, marketShare: 0, threatsAndOpportunities: [] },
    industryNews: { topStories: [], fdaUpdates: [], productUpdates: [], treatmentTrends: [] },
    polymarket: { topMovers: [], resolutionAlerts: [], portfolio: null, keyEvents: [], overallSentiment: 'neutral' },
    aiInsights: { churnEngine: [], revenueAnomaly: null, dynamicPricing: [], scheduleOptimizer: { utilizationRate: 0, suggestions: [] } },
    ...overrides,
  };
}

function makeFullBriefing(overrides: Partial<MegaBriefingData> = {}): MegaBriefingData {
  const partial = makeBriefingPartial(overrides);
  const actionItems = buildActionItems(partial);
  return {
    ...partial,
    actionItems,
    executiveSummary: { revenueStatus: '', biggestOpportunity: '', biggestRisk: '' },
    ...overrides,
  };
}
