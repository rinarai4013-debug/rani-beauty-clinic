import { describe, it, expect } from 'vitest';
import { renderMonthlyHtml } from '../monthly-ceo-email';
import type { MonthlyBriefingData } from '../types';

// ── Mock data factories ──────────────────────────────────────

function makeMonthlyData(overrides: Partial<MonthlyBriefingData> = {}): MonthlyBriefingData {
  return {
    month: 'February',
    year: 2026,
    totalRevenue: 128500,
    totalExpenses: 70675,
    netIncome: 57825,
    profitMargin: 45.0,
    revenueByCategory: {
      Laser: 42000,
      Facial: 28500,
      Injectable: 24000,
      Wellness: 15000,
      'Chemical Peel': 12000,
      'Body Treatment': 7000,
    },
    providerPerformance: [
      { name: 'Rina', revenue: 78000, appointments: 120, avgTicket: 650, showRate: 94.2 },
      { name: 'Mom', revenue: 50500, appointments: 95, avgTicket: 531, showRate: 91.5 },
    ],
    clientGrowth: {
      totalClients: 485,
      newClients: 42,
      churnedClients: 8,
      netGrowth: 34,
    },
    loyaltyROI: {
      memberRevenue: 54000,
      memberCost: 5400,
      roi: 10.0,
    },
    referralROI: {
      referralRevenue: 18500,
      referralCost: 2000,
      roi: 9.25,
    },
    marketingSpendVsRevenue: {
      spend: 4500,
      revenue: 128500,
      roi: 28.6,
    },
    complianceAudit: {
      score: 98,
      issues: [],
      resolved: 2,
      pending: 0,
    },
    inventoryTurnover: {
      avgTurnoverDays: 28,
      deadStock: 2,
      topMovers: ['HydraFacial Tips', 'Botox', 'VI Peel Solution'],
    },
    cashPosition: {
      balance: 185000,
      runway: 220,
      trend: 'improving',
    },
    strategicRecommendations: [
      'Strong revenue month at $128,500. Consider investing in expansion or new service lines.',
      'Revenue is heavily concentrated with Rina (61%). Diversify by building Mom\'s client base.',
      '8 memberships churned this period. Consider adding a loyalty concierge check-in call program.',
    ],
    ...overrides,
  };
}

// ── Tests: renderMonthlyHtml ─────────────────────────────────

describe('renderMonthlyHtml', () => {
  it('should return valid HTML', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('should include greeting', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('Good morning, Rina.');
  });

  it('should include monthly executive summary title', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('Monthly Executive Summary');
  });

  it('should include month and year', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('February 2026');
  });

  it('should include total revenue', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('$128,500');
  });

  it('should include total expenses', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('$70,675');
  });

  it('should include net income', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('$57,825');
  });

  it('should include profit margin', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('45.0%');
  });

  it('should show green callout for good margins', () => {
    const html = renderMonthlyHtml(makeMonthlyData({ profitMargin: 45 }));
    expect(html).toContain('Excellent margin');
    expect(html).toContain('#F0FDF4'); // success bg
  });

  it('should show blue callout for decent margins', () => {
    const html = renderMonthlyHtml(makeMonthlyData({ profitMargin: 28 }));
    expect(html).toContain('Healthy margin');
    expect(html).toContain('#EFF6FF'); // info bg
  });

  it('should show yellow callout for low margins', () => {
    const html = renderMonthlyHtml(makeMonthlyData({ profitMargin: 15 }));
    expect(html).toContain('Margin below target');
    expect(html).toContain('#FFFBEB'); // warning bg
  });

  it('should include revenue by category', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('Laser');
    expect(html).toContain('$42,000');
    expect(html).toContain('Facial');
    expect(html).toContain('Injectable');
  });

  it('should include category revenue share', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    // Laser: 42000/128500 = 33%
    expect(html).toContain('33%');
  });

  it('should skip category section when empty', () => {
    const html = renderMonthlyHtml(makeMonthlyData({ revenueByCategory: {} }));
    expect(html).not.toContain('Revenue by Category');
  });

  it('should include provider performance table', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('Rina');
    expect(html).toContain('$78,000');
    expect(html).toContain('120');
    expect(html).toContain('94.2%');
  });

  it('should include Mom provider stats', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('Mom');
    expect(html).toContain('$50,500');
    expect(html).toContain('91.5%');
  });

  it('should include client growth metrics', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('485'); // total
    expect(html).toContain('42'); // new
    expect(html).toContain('34'); // net growth
  });

  it('should show positive net growth with green indicator', () => {
    const html = renderMonthlyHtml(makeMonthlyData({
      clientGrowth: { totalClients: 500, newClients: 50, churnedClients: 10, netGrowth: 40 },
    }));
    expect(html).toContain('40');
    expect(html).toContain('#22C55E'); // green
  });

  it('should include loyalty ROI', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('$54,000'); // member revenue
    expect(html).toContain('10.0x'); // ROI
  });

  it('should handle zero loyalty ROI', () => {
    const html = renderMonthlyHtml(makeMonthlyData({
      loyaltyROI: { memberRevenue: 0, memberCost: 0, roi: 0 },
    }));
    expect(html).toContain('N/A');
  });

  it('should include marketing performance', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('$4,500'); // spend
    expect(html).toContain('28.6x'); // ROI
  });

  it('should include compliance score', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('98');
    expect(html).toContain('Compliance Score');
  });

  it('should show green compliance when score >= 90', () => {
    const html = renderMonthlyHtml(makeMonthlyData({ complianceAudit: { score: 95, issues: [], resolved: 0, pending: 0 } }));
    expect(html).toContain('#22C55E');
  });

  it('should show compliance issues when present', () => {
    const html = renderMonthlyHtml(makeMonthlyData({
      complianceAudit: { score: 80, issues: ['HIPAA training overdue', 'Fire inspection pending'], resolved: 1, pending: 2 },
    }));
    expect(html).toContain('HIPAA training overdue');
    expect(html).toContain('Fire inspection pending');
  });

  it('should show no issues message when compliant', () => {
    const html = renderMonthlyHtml(makeMonthlyData({
      complianceAudit: { score: 100, issues: [], resolved: 0, pending: 0 },
    }));
    expect(html).toContain('No compliance issues detected');
  });

  it('should include inventory turnover', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('28 days');
    expect(html).toContain('2'); // dead stock
  });

  it('should include cash position', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('$185,000');
    expect(html).toContain('220 days');
  });

  it('should show improving trend in green', () => {
    const html = renderMonthlyHtml(makeMonthlyData({ cashPosition: { balance: 100000, runway: 150, trend: 'improving' } }));
    expect(html).toContain('Improving');
    expect(html).toContain('#22C55E');
  });

  it('should show declining trend in red', () => {
    const html = renderMonthlyHtml(makeMonthlyData({ cashPosition: { balance: 50000, runway: 60, trend: 'declining' } }));
    expect(html).toContain('Declining');
    expect(html).toContain('#EF4444');
  });

  it('should handle no Plaid connection', () => {
    const html = renderMonthlyHtml(makeMonthlyData({
      cashPosition: { balance: null, runway: null, trend: 'stable' },
    }));
    expect(html).toContain('Not Connected');
  });

  it('should include strategic recommendations', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('Strong revenue month');
    expect(html).toContain('concentrated with Rina');
    expect(html).toContain('loyalty concierge');
  });

  it('should number strategic recommendations', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    // Check for numbered items with gold background
    expect(html).toContain('#C9A96E'); // gold circle
  });

  it('should hide recommendations when empty', () => {
    const html = renderMonthlyHtml(makeMonthlyData({ strategicRecommendations: [] }));
    expect(html).not.toContain('Strategic Recommendations');
  });

  it('should include quick links', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('https://ranibeautyclinic.com/dashboard');
    expect(html).toContain('ranibeautyclinic.com/dashboard/pnl');
  });

  it('should include RANI branding', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('RANI');
    expect(html).toContain('#0F1D2C');
    expect(html).toContain('#C9A96E');
  });

  it('should include all section headers', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('Profit');
    expect(html).toContain('Provider Performance');
    expect(html).toContain('Client Growth');
    expect(html).toContain('Loyalty Program ROI');
    expect(html).toContain('Marketing Performance');
    expect(html).toContain('Compliance Audit');
    expect(html).toContain('Inventory');
    expect(html).toContain('Cash Position');
  });

  it('should handle zero revenue gracefully', () => {
    const html = renderMonthlyHtml(makeMonthlyData({
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      profitMargin: 0,
      revenueByCategory: {},
    }));
    expect(html).toContain('$0');
    expect(html).not.toContain('NaN');
  });

  it('should handle empty provider performance', () => {
    const html = renderMonthlyHtml(makeMonthlyData({ providerPerformance: [] }));
    expect(html).not.toContain('Provider Performance');
  });

  it('should include footer', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    expect(html).toContain('RaniOS Intelligence');
    expect(html).toContain('401 Olympia Ave NE');
    expect(html).toContain('Renton, WA 98056');
  });

  it('should sort categories by revenue descending', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    const laserIdx = html.indexOf('Laser');
    const facialIdx = html.indexOf('Facial');
    const injectableIdx = html.indexOf('Injectable');
    // In the category table, Laser should appear before Facial, before Injectable
    expect(laserIdx).toBeLessThan(facialIdx);
    expect(facialIdx).toBeLessThan(injectableIdx);
  });

  it('should sort providers by revenue descending', () => {
    const html = renderMonthlyHtml(makeMonthlyData());
    const rinaIdx = html.indexOf('$78,000');
    const momIdx = html.indexOf('$50,500');
    expect(rinaIdx).toBeLessThan(momIdx);
  });
});
