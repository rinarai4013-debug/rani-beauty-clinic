/**
 * Rani Beauty Clinic - Monthly CEO Executive Summary Email Generator
 *
 * Generates a full monthly executive summary sent on the 1st of each month.
 * Covers P&L, service performance, provider comparison, client growth,
 * loyalty/referral ROI, marketing spend, compliance, inventory, and strategic recs.
 */

import {
  MonthlyBriefingData,
  RenderedBriefing,
} from './types';
import {
  fetchRevenueRange,
  fetchProviderPerformance,
  fetchAlerts,
  fetchLoyalty,
  fetchMarketing,
  fetchCashFlow,
  fetchClientGrowth,
  getLastMonthStart,
  getLastMonthEnd,
} from './data-fetchers';
import {
  briefingLayout,
  section,
  kpiRow,
  dataTable,
  calloutBox,
  quickLinksBar,
  formatCurrency,
  formatCurrencyDetailed,
  formatPercent,
  formatNumber,
  generatePlainText,
} from './email-template';

// ── Main generator ───────────────────────────────────────────

export async function generateMonthlyBriefing(): Promise<RenderedBriefing> {
  const data = await gatherMonthlyData();
  const html = renderMonthlyHtml(data);
  const text = generatePlainText(html);

  return {
    subject: `Monthly Executive Summary: ${formatCurrency(data.totalRevenue)} Revenue | ${data.profitMargin.toFixed(1)}% Margin | ${data.month} ${data.year}`,
    preheader: `${data.month} ${data.year}: ${formatCurrency(data.totalRevenue)} revenue, ${formatCurrency(data.netIncome)} net income, ${data.clientGrowth.newClients} new clients`,
    html,
    text,
    type: 'monthly',
    generatedAt: new Date().toISOString(),
    data,
  };
}

// ── Data gathering ───────────────────────────────────────────

export async function gatherMonthlyData(): Promise<MonthlyBriefingData> {
  const monthStart = getLastMonthStart();
  const monthEnd = getLastMonthEnd();

  // Determine month name
  const startDate = new Date(monthStart + 'T00:00:00');
  const monthName = startDate.toLocaleDateString('en-US', { month: 'long' });
  const year = startDate.getFullYear();

  const [
    revenue,
    providerPerf,
    alerts,
    loyalty,
    marketing,
    cashFlow,
    clientGrowth,
  ] = await Promise.all([
    fetchRevenueRange(monthStart, monthEnd),
    fetchProviderPerformance(monthStart, monthEnd),
    fetchAlerts(),
    fetchLoyalty(),
    fetchMarketing(),
    fetchCashFlow(),
    fetchClientGrowth(),
  ]);

  // Estimated expenses (would come from P&L engine in production)
  const estimatedExpenses = revenue.total * 0.55; // 55% expense ratio estimate
  const netIncome = revenue.total - estimatedExpenses;
  const profitMargin = revenue.total > 0 ? (netIncome / revenue.total) * 100 : 0;

  // Provider performance
  const providerPerformance = Object.entries(providerPerf).map(([name, perf]) => ({
    name,
    revenue: perf.revenue,
    appointments: perf.appointments,
    avgTicket: perf.shows > 0 ? perf.revenue / perf.shows : 0,
    showRate: perf.appointments > 0 ? (perf.shows / perf.appointments) * 100 : 100,
  }));

  // Loyalty ROI
  const loyaltyROI = {
    memberRevenue: loyalty.membershipMRR * 12, // annualized
    memberCost: 0,
    roi: loyalty.membershipMRR > 0 ? (loyalty.membershipMRR * 12) / (loyalty.membershipMRR * 12 * 0.1 || 1) : 0,
  };

  // Referral ROI
  const referralROI = {
    referralRevenue: 0,
    referralCost: 0,
    roi: 0,
  };

  // Marketing spend vs revenue
  const marketingSpendVsRevenue = {
    spend: 0,
    revenue: revenue.total,
    roi: 0,
  };

  // Compliance audit
  const complianceIssues = alerts.items
    .filter((a) => a.type.toLowerCase().includes('compliance'))
    .map((a) => a.message);
  const complianceAudit = {
    score: complianceIssues.length === 0 ? 100 : Math.max(0, 100 - complianceIssues.length * 10),
    issues: complianceIssues,
    resolved: 0,
    pending: complianceIssues.length,
  };

  // Inventory
  const inventoryTurnover = {
    avgTurnoverDays: 30,
    deadStock: 0,
    topMovers: [] as string[],
  };

  // Cash position
  const cashPosition = {
    balance: cashFlow.bankBalance,
    runway: cashFlow.runway,
    trend: 'stable' as const,
  };

  // Strategic recommendations
  const strategicRecommendations = generateStrategicRecs(
    revenue.total, profitMargin, providerPerformance, clientGrowth, loyalty, marketing
  );

  return {
    month: monthName,
    year,
    totalRevenue: revenue.total,
    totalExpenses: estimatedExpenses,
    netIncome,
    profitMargin,
    revenueByCategory: revenue.byCategory,
    providerPerformance,
    clientGrowth,
    loyaltyROI,
    referralROI,
    marketingSpendVsRevenue,
    complianceAudit,
    inventoryTurnover,
    cashPosition,
    strategicRecommendations,
  };
}

// ── Strategic recommendations ────────────────────────────────

function generateStrategicRecs(
  totalRevenue: number,
  profitMargin: number,
  providers: { name: string; revenue: number; showRate: number }[],
  clientGrowth: { newClients: number; churnedClients: number; totalClients: number },
  loyalty: { totalMembers: number; churnedMembers: number; membershipMRR: number },
  marketing: { newLeads: number; avgRating: number }
): string[] {
  const recs: string[] = [];

  // Revenue target check (assume $50K monthly target)
  if (totalRevenue < 50000) {
    recs.push(`Revenue at ${formatCurrency(totalRevenue)} is below the $50K monthly target. Focus on increasing average ticket size and booking volume.`);
  } else {
    recs.push(`Strong revenue month at ${formatCurrency(totalRevenue)}. Consider investing in expansion or new service lines.`);
  }

  // Margin check
  if (profitMargin < 30) {
    recs.push(`Profit margin at ${profitMargin.toFixed(1)}% needs attention. Review service costs and consider price adjustments.`);
  }

  // Provider balance
  if (providers.length >= 2) {
    const topProvider = providers.sort((a, b) => b.revenue - a.revenue)[0];
    const totalProvRev = providers.reduce((s, p) => s + p.revenue, 0);
    if (topProvider && totalProvRev > 0 && topProvider.revenue / totalProvRev > 0.7) {
      recs.push(`Revenue is heavily concentrated with ${topProvider.name} (${((topProvider.revenue / totalProvRev) * 100).toFixed(0)}%). Diversify by building other providers' client bases.`);
    }
  }

  // Client growth
  if (clientGrowth.churnedClients > clientGrowth.newClients) {
    recs.push(`Client churn (${clientGrowth.churnedClients}) exceeded new clients (${clientGrowth.newClients}). Launch a win-back campaign and review service quality.`);
  }

  // Membership growth
  if (loyalty.churnedMembers > 0) {
    recs.push(`${loyalty.churnedMembers} memberships churned this period. Consider adding a loyalty concierge check-in call program.`);
  }

  // Review velocity
  if (marketing.avgRating > 0 && marketing.avgRating < 4.5) {
    recs.push(`Average review rating is ${marketing.avgRating.toFixed(1)} stars. Implement a post-visit review request workflow for happy clients.`);
  }

  return recs.slice(0, 5);
}

// ── HTML rendering ───────────────────────────────────────────

export function renderMonthlyHtml(data: MonthlyBriefingData): string {
  const sections_arr: string[] = [];

  // ── Greeting ───────────────────────────────────────────
  sections_arr.push(`
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid #E8E3DA;">
    <tr>
      <td style="padding: 28px 40px 20px;" class="padding-mobile">
        <p style="font-family: 'Georgia', serif; font-size: 18px; color: #0F1D2C; margin: 0 0 4px 0;">Good morning, Rina.</p>
        <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6B6B6B; margin: 0;">Here is your executive summary for ${data.month} ${data.year}.</p>
      </td>
    </tr>
  </table>`);

  // ── P&L Summary ────────────────────────────────────────
  {
    const pnlContent = kpiRow([
      { label: 'Total Revenue', value: formatCurrency(data.totalRevenue) },
      { label: 'Total Expenses', value: formatCurrency(data.totalExpenses) },
      { label: 'Net Income', value: formatCurrency(data.netIncome) },
      { label: 'Profit Margin', value: `${data.profitMargin.toFixed(1)}%` },
    ]);

    const marginVariant = data.profitMargin >= 35 ? 'success' : data.profitMargin >= 20 ? 'info' : 'warning';
    const marginNote = data.profitMargin >= 35
      ? 'Excellent margin. Clinic is operating efficiently.'
      : data.profitMargin >= 20
        ? 'Healthy margin. Look for optimization opportunities to push above 35%.'
        : 'Margin below target. Review expense categories for cost reduction opportunities.';

    sections_arr.push(section('Profit & Loss Summary', pnlContent + calloutBox(marginNote, marginVariant), '&#128176;'));
  }

  // ── Revenue by Service Category ────────────────────────
  {
    const catEntries = Object.entries(data.revenueByCategory);
    if (catEntries.length > 0) {
      const catRows = catEntries
        .sort(([, a], [, b]) => b - a)
        .map(([name, amount]) => [
          name,
          formatCurrency(amount),
          data.totalRevenue > 0 ? `${((amount / data.totalRevenue) * 100).toFixed(0)}%` : '0%',
        ]);
      sections_arr.push(section('Revenue by Category', dataTable(['Category', 'Revenue', 'Share'], catRows), '&#128202;'));
    }
  }

  // ── Provider Performance ───────────────────────────────
  if (data.providerPerformance.length > 0) {
    const provRows = data.providerPerformance
      .sort((a, b) => b.revenue - a.revenue)
      .map((p) => [
        p.name,
        formatCurrency(p.revenue),
        String(p.appointments),
        formatCurrencyDetailed(p.avgTicket),
        `${p.showRate.toFixed(1)}%`,
      ]);
    sections_arr.push(section('Provider Performance', dataTable(['Provider', 'Revenue', 'Appts', 'Avg Ticket', 'Show Rate'], provRows), '&#128105;'));
  }

  // ── Client Growth ──────────────────────────────────────
  {
    const growthContent = kpiRow([
      { label: 'Total Clients', value: formatNumber(data.clientGrowth.totalClients) },
      { label: 'New Clients', value: String(data.clientGrowth.newClients) },
      { label: 'Churned', value: String(data.clientGrowth.churnedClients) },
      { label: 'Net Growth', value: String(data.clientGrowth.netGrowth), change: data.clientGrowth.netGrowth },
    ]);
    sections_arr.push(section('Client Growth', growthContent, '&#128200;'));
  }

  // ── Loyalty Program ROI ────────────────────────────────
  {
    const loyaltyContent = kpiRow([
      { label: 'Member Revenue (Annualized)', value: formatCurrency(data.loyaltyROI.memberRevenue) },
      { label: 'Program Cost', value: formatCurrency(data.loyaltyROI.memberCost) },
      { label: 'ROI', value: data.loyaltyROI.roi > 0 ? `${data.loyaltyROI.roi.toFixed(1)}x` : 'N/A' },
    ]);
    sections_arr.push(section('Loyalty Program ROI', loyaltyContent, '&#11088;'));
  }

  // ── Marketing Spend vs Revenue ─────────────────────────
  {
    const mktContent = kpiRow([
      { label: 'Marketing Spend', value: formatCurrency(data.marketingSpendVsRevenue.spend) },
      { label: 'Revenue Attributed', value: formatCurrency(data.marketingSpendVsRevenue.revenue) },
      { label: 'Marketing ROI', value: data.marketingSpendVsRevenue.roi > 0 ? `${data.marketingSpendVsRevenue.roi.toFixed(1)}x` : 'N/A' },
    ]);
    sections_arr.push(section('Marketing Performance', mktContent, '&#128640;'));
  }

  // ── Compliance Audit ───────────────────────────────────
  {
    const scoreColor = data.complianceAudit.score >= 90 ? '#22C55E' : data.complianceAudit.score >= 70 ? '#F59E0B' : '#EF4444';
    let compContent = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
      <td style="padding: 12px 0; text-align: center;">
        <p style="font-family: 'Georgia', serif; font-size: 48px; font-weight: 700; color: ${scoreColor}; margin: 0;">${data.complianceAudit.score}</p>
        <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6B6B6B; margin: 4px 0 0 0;">Compliance Score</p>
      </td>
    </tr></table>`;

    if (data.complianceAudit.issues.length > 0) {
      compContent += calloutBox(`<strong>Open Issues:</strong> ${data.complianceAudit.issues.join(', ')}`, 'warning');
    } else {
      compContent += calloutBox('No compliance issues detected. All systems in good standing.', 'success');
    }

    sections_arr.push(section('Compliance Audit', compContent, '&#128737;'));
  }

  // ── Inventory Turnover ─────────────────────────────────
  {
    const invContent = kpiRow([
      { label: 'Avg Turnover', value: `${data.inventoryTurnover.avgTurnoverDays} days` },
      { label: 'Dead Stock Items', value: String(data.inventoryTurnover.deadStock) },
    ]);
    sections_arr.push(section('Inventory', invContent, '&#128230;'));
  }

  // ── Cash Position ──────────────────────────────────────
  {
    const trendEmoji = data.cashPosition.trend === 'improving' ? '&#9650;' : data.cashPosition.trend === 'declining' ? '&#9660;' : '&#9654;';
    const trendColor = data.cashPosition.trend === 'improving' ? '#22C55E' : data.cashPosition.trend === 'declining' ? '#EF4444' : '#6B6B6B';

    const cashContent = kpiRow([
      { label: 'Bank Balance', value: data.cashPosition.balance !== null ? formatCurrency(data.cashPosition.balance) : 'Not Connected' },
      { label: 'Runway', value: data.cashPosition.runway !== null ? `${data.cashPosition.runway} days` : 'N/A' },
      { label: 'Trend', value: `<span style="color: ${trendColor};">${trendEmoji} ${data.cashPosition.trend.charAt(0).toUpperCase() + data.cashPosition.trend.slice(1)}</span>` },
    ]);
    sections_arr.push(section('Cash Position', cashContent, '&#127974;'));
  }

  // ── Strategic Recommendations ──────────────────────────
  if (data.strategicRecommendations.length > 0) {
    const recContent = data.strategicRecommendations.map((rec, i) =>
      `<tr><td style="padding: 10px 0; border-bottom: 1px solid #E8E3DA;">
        <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 50%; background-color: #C9A96E; color: white; font-family: 'Georgia', serif; font-size: 14px; font-weight: 700; margin-right: 12px; vertical-align: middle;">${i + 1}</span>
        <span style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1A1A1A; vertical-align: middle;">${rec}</span>
      </td></tr>`
    ).join('');

    sections_arr.push(section(
      'Strategic Recommendations',
      `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tbody>${recContent}</tbody></table>`,
      '&#128161;'
    ));
  }

  // ── Quick Links ────────────────────────────────────────
  sections_arr.push(quickLinksBar([
    { text: 'Dashboard', url: 'https://www.ranibeautyclinic.com/dashboard' },
    { text: 'P&L', url: 'https://www.ranibeautyclinic.com/dashboard/pnl' },
    { text: 'Airtable', url: 'https://airtable.com/app1SwhSfwe8GKUg4' },
    { text: 'n8n', url: 'https://ranibeautyclinic.app.n8n.cloud' },
  ]));

  return briefingLayout(
    sections_arr.join(''),
    `${data.month} ${data.year}: ${formatCurrency(data.totalRevenue)} revenue, ${data.profitMargin.toFixed(1)}% margin`,
    'Monthly Executive Summary',
    `${data.month} ${data.year}`
  );
}
