/**
 * Rani Beauty Clinic - Weekly CEO Briefing Email Generator
 *
 * Generates a comprehensive weekly rollup sent every Monday at 6:00 AM PST.
 * Covers week-over-week performance, top services, provider utilization,
 * retention, marketing channels, compliance, inventory, and cash flow.
 */

import {
  WeeklyBriefingData,
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
  getWeekStart,
  getLastWeekStart,
  getLastWeekEnd,
  formatDate,
} from './data-fetchers';
import {
  briefingLayout,
  section,
  kpiRow,
  dataTable,
  calloutBox,
  quickLinksBar,
  emptyState,
  formatCurrency,
  formatNumber,
  formatPercent,
  generatePlainText,
} from './email-template';

// ── Main generator ───────────────────────────────────────────

export async function generateWeeklyBriefing(): Promise<RenderedBriefing> {
  const data = await gatherWeeklyData();
  const html = renderWeeklyHtml(data);
  const text = generatePlainText(html);

  return {
    subject: `Weekly Rollup: ${formatCurrency(data.currentWeekRevenue)} Revenue | ${formatPercent(data.weekOverWeekChange)} WoW | ${data.weekStart} to ${data.weekEnd}`,
    preheader: `${formatCurrency(data.currentWeekRevenue)} this week (${formatPercent(data.weekOverWeekChange)} vs last week). Top wins and priorities inside.`,
    html,
    text,
    type: 'weekly',
    generatedAt: new Date().toISOString(),
    data,
  };
}

// ── Data gathering ───────────────────────────────────────────

export async function gatherWeeklyData(): Promise<WeeklyBriefingData> {
  const now = new Date();
  // "This week" = last 7 days (Monday to Sunday just completed)
  const lastWeekEnd = new Date(now);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1); // yesterday
  const lastWeekStart = new Date(lastWeekEnd);
  lastWeekStart.setDate(lastWeekStart.getDate() - 6);

  const prevWeekEnd = new Date(lastWeekStart);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekStart.getDate() - 6);

  const weekStartStr = formatDate(lastWeekStart);
  const weekEndStr = formatDate(lastWeekEnd);
  const prevStartStr = formatDate(prevWeekStart);
  const prevEndStr = formatDate(prevWeekEnd);

  const [
    currentRevenue,
    previousRevenue,
    providerPerf,
    alerts,
    loyalty,
    marketing,
    cashFlow,
    clientGrowth,
  ] = await Promise.all([
    fetchRevenueRange(weekStartStr, weekEndStr),
    fetchRevenueRange(prevStartStr, prevEndStr),
    fetchProviderPerformance(weekStartStr, weekEndStr),
    fetchAlerts(),
    fetchLoyalty(),
    fetchMarketing(),
    fetchCashFlow(),
    fetchClientGrowth(),
  ]);

  const weekOverWeekChange = previousRevenue.total > 0
    ? ((currentRevenue.total - previousRevenue.total) / previousRevenue.total) * 100
    : 0;

  // Top services
  const topServices = Object.entries(currentRevenue.byService)
    .map(([name, revenue]) => ({ name, revenue, count: 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Provider utilization (approx: 8h days, 6 working days)
  const hoursAvailable = 48; // 8h * 6 days
  const providerUtilization = Object.entries(providerPerf).map(([name, perf]) => ({
    name,
    hoursBooked: perf.appointments * 1, // approx 1h per appointment
    hoursAvailable,
    rate: Math.min((perf.appointments / hoursAvailable) * 100, 100),
  }));

  // Client retention approximation
  const totalClients = clientGrowth.totalClients || 1;
  const clientRetentionRate = totalClients > 0
    ? ((totalClients - clientGrowth.churnedClients) / totalClients) * 100
    : 100;

  // New vs returning (approximate from booking source)
  const newVsReturning = {
    new: clientGrowth.newClients,
    returning: totalClients - clientGrowth.newClients,
  };

  // Marketing channel performance (from lead sources)
  const marketingChannelPerformance = Object.entries(marketing.leadsBySource).map(([channel, leads]) => ({
    channel,
    leads,
    conversions: 0,
    revenue: 0,
  }));

  // Compliance score from alerts
  const complianceAlerts = alerts.items.filter((a) => a.type.toLowerCase().includes('compliance'));
  const complianceScore = complianceAlerts.length === 0 ? 100 : Math.max(0, 100 - complianceAlerts.length * 10);

  // Inventory alerts
  const inventoryAlerts = alerts.items
    .filter((a) => a.type.toLowerCase().includes('inventory') || a.type.toLowerCase().includes('reorder'))
    .map((a) => ({ product: a.type, status: a.severity, action: a.actionRecommended }));

  // Generate top wins and priorities
  const topWins = generateTopWins(currentRevenue.total, previousRevenue.total, topServices, providerUtilization);
  const topPriorities = generateTopPriorities(alerts, loyalty, marketing, weekOverWeekChange);

  return {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    currentWeekRevenue: currentRevenue.total,
    previousWeekRevenue: previousRevenue.total,
    weekOverWeekChange,
    topServices,
    providerUtilization,
    clientRetentionRate,
    newVsReturning,
    marketingChannelPerformance,
    complianceScore,
    complianceScoreChange: 0,
    inventoryAlerts,
    cashFlowTrend: [],
    topWins,
    topPriorities,
  };
}

// ── Win/Priority generators ──────────────────────────────────

function generateTopWins(
  currentRev: number,
  previousRev: number,
  topServices: { name: string; revenue: number }[],
  utilization: { name: string; rate: number }[]
): string[] {
  const wins: string[] = [];

  if (currentRev > previousRev) {
    wins.push(`Revenue grew ${formatPercent(((currentRev - previousRev) / (previousRev || 1)) * 100)} week-over-week to ${formatCurrency(currentRev)}`);
  }

  if (topServices.length > 0) {
    wins.push(`Top service: ${topServices[0].name} drove ${formatCurrency(topServices[0].revenue)} in revenue`);
  }

  const highUtil = utilization.filter((p) => p.rate >= 70);
  if (highUtil.length > 0) {
    wins.push(`${highUtil.map((p) => p.name).join(' & ')} maintained ${highUtil.length > 1 ? 'strong' : 'excellent'} utilization above 70%`);
  }

  if (wins.length === 0) {
    wins.push('Clinic operations running smoothly with no major incidents');
  }

  return wins.slice(0, 3);
}

function generateTopPriorities(
  alerts: { total: number; bySeverity: { critical: number; warning: number } },
  loyalty: { churnedMembers: number },
  marketing: { newLeads: number },
  wowChange: number
): string[] {
  const priorities: string[] = [];

  if (wowChange < -10) {
    priorities.push(`Address revenue decline of ${formatPercent(wowChange)} - review booking pipeline and conversion rates`);
  }

  if (alerts.bySeverity.critical > 0) {
    priorities.push(`Resolve ${alerts.bySeverity.critical} critical alert(s) before they impact operations`);
  }

  if (loyalty.churnedMembers > 0) {
    priorities.push(`Win back ${loyalty.churnedMembers} churned membership(s) with personalized outreach`);
  }

  if (marketing.newLeads > 5) {
    priorities.push(`Convert ${marketing.newLeads} new leads into booked consultations`);
  }

  if (priorities.length === 0) {
    priorities.push('Maintain momentum and focus on upselling existing clients');
    priorities.push('Review and optimize marketing spend ROI');
  }

  return priorities.slice(0, 3);
}

// ── HTML rendering ───────────────────────────────────────────

export function renderWeeklyHtml(data: WeeklyBriefingData): string {
  const sections_arr: string[] = [];

  // ── Greeting ───────────────────────────────────────────
  sections_arr.push(`
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid #E8E3DA;">
    <tr>
      <td style="padding: 28px 40px 20px;" class="padding-mobile">
        <p style="font-family: 'Georgia', serif; font-size: 18px; color: #0F1D2C; margin: 0 0 4px 0;">Good morning, Rina.</p>
        <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6B6B6B; margin: 0;">Here is your weekly performance rollup for ${data.weekStart} to ${data.weekEnd}.</p>
      </td>
    </tr>
  </table>`);

  // ── Week Overview KPIs ─────────────────────────────────
  const wowColor = data.weekOverWeekChange >= 0 ? '#22C55E' : '#EF4444';
  const overviewContent = kpiRow([
    { label: 'This Week Revenue', value: formatCurrency(data.currentWeekRevenue) },
    { label: 'Last Week Revenue', value: formatCurrency(data.previousWeekRevenue) },
    { label: 'Week-over-Week', value: formatPercent(data.weekOverWeekChange), change: data.weekOverWeekChange },
    { label: 'Retention Rate', value: `${data.clientRetentionRate.toFixed(1)}%` },
  ]);
  sections_arr.push(section('Week Overview', overviewContent, '&#128200;'));

  // ── Top Performing Services ────────────────────────────
  if (data.topServices.length > 0) {
    const serviceRows = data.topServices.slice(0, 8).map((s) => [
      s.name,
      formatCurrency(s.revenue),
      data.currentWeekRevenue > 0 ? `${((s.revenue / data.currentWeekRevenue) * 100).toFixed(0)}%` : '0%',
    ]);
    sections_arr.push(section('Top Services', dataTable(['Service', 'Revenue', 'Share'], serviceRows), '&#127942;'));
  }

  // ── Provider Utilization ───────────────────────────────
  if (data.providerUtilization.length > 0) {
    const providerRows = data.providerUtilization.map((p) => {
      const barWidth = Math.min(p.rate, 100);
      const barColor = p.rate >= 70 ? '#22C55E' : p.rate >= 50 ? '#F59E0B' : '#EF4444';
      const bar = `<div style="background-color: #E8E3DA; border-radius: 4px; height: 8px; width: 100%;"><div style="background-color: ${barColor}; border-radius: 4px; height: 8px; width: ${barWidth}%;"></div></div>`;
      return [p.name, `${p.hoursBooked}h / ${p.hoursAvailable}h`, `${p.rate.toFixed(0)}%`, bar];
    });
    sections_arr.push(section('Provider Utilization', dataTable(['Provider', 'Hours', 'Rate', 'Visual'], providerRows), '&#128101;'));
  }

  // ── Client Mix ─────────────────────────────────────────
  {
    const total = data.newVsReturning.new + data.newVsReturning.returning;
    const clientContent = kpiRow([
      { label: 'New Clients', value: String(data.newVsReturning.new), sublabel: total > 0 ? `${((data.newVsReturning.new / total) * 100).toFixed(0)}% of total` : '' },
      { label: 'Returning Clients', value: String(data.newVsReturning.returning), sublabel: total > 0 ? `${((data.newVsReturning.returning / total) * 100).toFixed(0)}% of total` : '' },
      { label: 'Retention', value: `${data.clientRetentionRate.toFixed(1)}%` },
    ]);
    sections_arr.push(section('Client Mix', clientContent, '&#128100;'));
  }

  // ── Marketing Channels ─────────────────────────────────
  if (data.marketingChannelPerformance.length > 0) {
    const channelRows = data.marketingChannelPerformance
      .sort((a, b) => b.leads - a.leads)
      .map((c) => [c.channel, String(c.leads), String(c.conversions), formatCurrency(c.revenue)]);
    sections_arr.push(section('Marketing Channels', dataTable(['Channel', 'Leads', 'Conversions', 'Revenue'], channelRows), '&#128640;'));
  }

  // ── Compliance ─────────────────────────────────────────
  {
    const scoreColor = data.complianceScore >= 90 ? '#22C55E' : data.complianceScore >= 70 ? '#F59E0B' : '#EF4444';
    const compContent = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
      <td style="padding: 12px 0; text-align: center;">
        <p style="font-family: 'Georgia', serif; font-size: 48px; font-weight: 700; color: ${scoreColor}; margin: 0;">${data.complianceScore}</p>
        <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6B6B6B; margin: 4px 0 0 0;">Compliance Score</p>
      </td>
    </tr></table>`;
    sections_arr.push(section('Compliance', compContent, '&#128737;'));
  }

  // ── Inventory Alerts ───────────────────────────────────
  if (data.inventoryAlerts.length > 0) {
    const invRows = data.inventoryAlerts.map((a) => [a.product, a.status, a.action]);
    sections_arr.push(section('Inventory Alerts', dataTable(['Product', 'Status', 'Action'], invRows), '&#128230;'));
  }

  // ── Top 3 Wins ─────────────────────────────────────────
  {
    const winsContent = data.topWins.map((win, i) =>
      `<tr><td style="padding: 8px 0; border-bottom: 1px solid #E8E3DA;">
        <span style="font-family: 'Georgia', serif; font-size: 18px; color: #C9A96E; font-weight: 700; margin-right: 12px;">${i + 1}</span>
        <span style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1A1A1A;">${win}</span>
      </td></tr>`
    ).join('');
    sections_arr.push(section("This Week's Wins", `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tbody>${winsContent}</tbody></table>`, '&#127881;'));
  }

  // ── Top 3 Priorities ───────────────────────────────────
  {
    const priContent = data.topPriorities.map((pri, i) =>
      `<tr><td style="padding: 8px 0; border-bottom: 1px solid #E8E3DA;">
        <span style="font-family: 'Georgia', serif; font-size: 18px; color: #0F1D2C; font-weight: 700; margin-right: 12px;">${i + 1}</span>
        <span style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1A1A1A;">${pri}</span>
      </td></tr>`
    ).join('');
    sections_arr.push(section('Next Week Priorities', `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tbody>${priContent}</tbody></table>`, '&#127919;'));
  }

  // ── Quick Links ────────────────────────────────────────
  sections_arr.push(quickLinksBar([
    { text: 'Dashboard', url: 'https://www.ranibeautyclinic.com/dashboard' },
    { text: 'Bookings', url: 'https://app.mangomint.com/876418' },
    { text: 'Airtable', url: 'https://airtable.com/app1SwhSfwe8GKUg4' },
    { text: 'n8n', url: 'https://ranibeautyclinic.app.n8n.cloud' },
  ]));

  return briefingLayout(
    sections_arr.join(''),
    `${formatCurrency(data.currentWeekRevenue)} this week | ${formatPercent(data.weekOverWeekChange)} WoW`,
    'Weekly CEO Rollup',
    `${data.weekStart} to ${data.weekEnd}`
  );
}
