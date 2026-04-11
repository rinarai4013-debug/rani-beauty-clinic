import { describe, it, expect } from 'vitest';
import { renderWeeklyHtml } from '../weekly-ceo-email';
import type { WeeklyBriefingData } from '../types';

// ── Mock data factories ──────────────────────────────────────

function makeWeeklyData(overrides: Partial<WeeklyBriefingData> = {}): WeeklyBriefingData {
  return {
    weekStart: '2026-03-16',
    weekEnd: '2026-03-22',
    currentWeekRevenue: 32500,
    previousWeekRevenue: 28000,
    weekOverWeekChange: 16.1,
    topServices: [
      { name: 'Sofwave', revenue: 11000, count: 4 },
      { name: 'HydraFacial', revenue: 5500, count: 20 },
      { name: 'Botox', revenue: 4800, count: 16 },
      { name: 'VI Peel', revenue: 3950, count: 10 },
      { name: 'RF Microneedling', revenue: 2850, count: 6 },
      { name: 'Laser Hair Removal', revenue: 2400, count: 12 },
      { name: 'Wellness Injections', revenue: 1200, count: 15 },
      { name: 'PRX-T33', revenue: 800, count: 2 },
    ],
    providerUtilization: [
      { name: 'Rina', hoursBooked: 38, hoursAvailable: 48, rate: 79.2 },
      { name: 'Mom', hoursBooked: 30, hoursAvailable: 48, rate: 62.5 },
    ],
    clientRetentionRate: 92.3,
    newVsReturning: { new: 12, returning: 65 },
    marketingChannelPerformance: [
      { channel: 'Instagram', leads: 15, conversions: 5, revenue: 8500 },
      { channel: 'Google', leads: 10, conversions: 3, revenue: 6200 },
      { channel: 'Referral', leads: 5, conversions: 4, revenue: 5800 },
    ],
    complianceScore: 95,
    complianceScoreChange: 2,
    inventoryAlerts: [
      { product: 'HydraFacial Tips', status: 'warning', action: 'Reorder within 5 days' },
    ],
    cashFlowTrend: [],
    topWins: [
      'Revenue grew +16.1% week-over-week to $32,500',
      'Top service: Sofwave drove $11,000 in revenue',
      'Rina maintained excellent utilization above 70%',
    ],
    topPriorities: [
      'Convert 15 Instagram leads into booked consultations',
      'Win back 1 churned membership with personalized outreach',
      'Reorder HydraFacial tips before stock runs out',
    ],
    ...overrides,
  };
}

// ── Tests: renderWeeklyHtml ──────────────────────────────────

describe('renderWeeklyHtml', () => {
  it('should return valid HTML', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('should include greeting', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('Good morning, Rina.');
  });

  it('should include weekly CEO rollup title', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('Weekly CEO Rollup');
  });

  it('should include week date range', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('2026-03-16');
    expect(html).toContain('2026-03-22');
  });

  it('should include current week revenue', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('$32,500');
  });

  it('should include previous week revenue', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('$28,000');
  });

  it('should include week-over-week change', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('+16.1%');
  });

  it('should include negative WoW change with correct color', () => {
    const html = renderWeeklyHtml(makeWeeklyData({ weekOverWeekChange: -8.5 }));
    expect(html).toContain('-8.5%');
    expect(html).toContain('#EF4444'); // red for negative
  });

  it('should include retention rate', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('92.3%');
  });

  it('should include top services table', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('Sofwave');
    expect(html).toContain('$11,000');
    expect(html).toContain('HydraFacial');
    expect(html).toContain('Botox');
  });

  it('should include revenue share percentage for services', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    // Sofwave: 11000/32500 = 34%
    expect(html).toContain('34%');
  });

  it('should include provider utilization', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('Rina');
    expect(html).toContain('38h / 48h');
    expect(html).toContain('79%');
  });

  it('should use green color for high utilization', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('#22C55E'); // green for 79%
  });

  it('should use yellow color for medium utilization', () => {
    const html = renderWeeklyHtml(makeWeeklyData({
      providerUtilization: [{ name: 'Test', hoursBooked: 25, hoursAvailable: 48, rate: 52 }],
    }));
    expect(html).toContain('#F59E0B'); // yellow for 52%
  });

  it('should include new vs returning clients', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('12'); // new
    expect(html).toContain('65'); // returning
  });

  it('should include marketing channels', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('Instagram');
    expect(html).toContain('Google');
    expect(html).toContain('Referral');
  });

  it('should include compliance score', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('95');
    expect(html).toContain('Compliance Score');
  });

  it('should use green for high compliance', () => {
    const html = renderWeeklyHtml(makeWeeklyData({ complianceScore: 95 }));
    expect(html).toContain('#22C55E');
  });

  it('should use yellow for medium compliance', () => {
    const html = renderWeeklyHtml(makeWeeklyData({ complianceScore: 75 }));
    expect(html).toContain('#F59E0B');
  });

  it('should use red for low compliance', () => {
    const html = renderWeeklyHtml(makeWeeklyData({ complianceScore: 55 }));
    expect(html).toContain('#EF4444');
  });

  it('should include inventory alerts', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('HydraFacial Tips');
    expect(html).toContain('Reorder within 5 days');
  });

  it('should hide inventory alerts section when empty', () => {
    const html = renderWeeklyHtml(makeWeeklyData({ inventoryAlerts: [] }));
    expect(html).not.toContain('Inventory Alerts');
  });

  it('should include top 3 wins', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('Revenue grew');
    expect(html).toContain('Sofwave drove');
    expect(html).toContain('Rina maintained');
  });

  it('should include top 3 priorities', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('Instagram leads');
    expect(html).toContain('churned membership');
    expect(html).toContain('HydraFacial tips');
  });

  it('should include numbered wins', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    // Check numbered items exist
    expect(html).toMatch(/1.*Revenue grew/s);
    expect(html).toMatch(/2.*Sofwave/s);
    expect(html).toMatch(/3.*Rina/s);
  });

  it('should include quick links', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('https://ranibeautyclinic.com/dashboard');
    expect(html).toContain('https://app.mangomint.com/876418');
  });

  it('should include RANI branding', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('RANI');
    expect(html).toContain('#0F1D2C');
    expect(html).toContain('#C9A96E');
  });

  it('should include section headers', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('Week Overview');
    expect(html).toContain('Top Services');
    expect(html).toContain('Provider Utilization');
    expect(html).toContain('Client Mix');
    expect(html).toContain('Compliance');
  });

  it('should handle zero revenue gracefully', () => {
    const html = renderWeeklyHtml(makeWeeklyData({
      currentWeekRevenue: 0,
      previousWeekRevenue: 0,
      weekOverWeekChange: 0,
      topServices: [],
    }));
    expect(html).toContain('$0');
    expect(html).not.toContain('NaN');
  });

  it('should handle empty marketing channels', () => {
    const html = renderWeeklyHtml(makeWeeklyData({ marketingChannelPerformance: [] }));
    expect(html).not.toContain('Marketing Channels');
  });

  it('should handle empty provider utilization', () => {
    const html = renderWeeklyHtml(makeWeeklyData({ providerUtilization: [] }));
    expect(html).not.toContain('Provider Utilization');
  });

  it('should include footer', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    expect(html).toContain('RaniOS Intelligence');
    expect(html).toContain('401 Olympia Ave NE');
  });

  it('should cap services at 8 rows', () => {
    const html = renderWeeklyHtml(makeWeeklyData());
    // All 8 services should be shown
    expect(html).toContain('Sofwave');
    expect(html).toContain('PRX-T33');
  });

  it('should calculate percentage correctly for client mix', () => {
    const html = renderWeeklyHtml(makeWeeklyData({
      newVsReturning: { new: 10, returning: 40 },
    }));
    // 10/50 = 20%
    expect(html).toContain('20%');
    // 40/50 = 80%
    expect(html).toContain('80%');
  });
});
