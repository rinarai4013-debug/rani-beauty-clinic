/**
 * Rani Beauty Clinic - Daily CEO Briefing Email Generator
 *
 * Generates a comprehensive daily status email for the CEO.
 * Pulls data from Airtable across all operational areas and
 * formats it as a branded HTML email (navy/gold/cream).
 *
 * Sent every morning at 6:00 AM PST via Vercel Cron.
 */

import {
  DailyBriefingData,
  ActionItem,
  RenderedBriefing,
} from './types';
import {
  fetchRevenue,
  fetchSchedule,
  fetchAlerts,
  fetchLoyalty,
  fetchReferrals,
  fetchMarketing,
  fetchCashFlow,
  fetchContentCalendar,
  fetchAIHighlights,
  getYesterday,
  getToday,
} from './data-fetchers';
import {
  briefingLayout,
  section,
  kpiRow,
  dataTable,
  alertBadge,
  actionItemRow,
  quickLinksBar,
  calloutBox,
  emptyState,
  formatCurrency,
  formatCurrencyDetailed,
  formatNumber,
  formatPercent,
  generatePlainText,
} from './email-template';

// ── Main generator ───────────────────────────────────────────

export async function generateDailyBriefing(): Promise<RenderedBriefing> {
  const data = await gatherDailyData();
  const html = renderDailyHtml(data);
  const text = generatePlainText(html);

  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return {
    subject: `Daily Briefing: ${formatCurrency(data.revenue.total)} Revenue | ${data.schedule.totalAppointments} Appointments | ${dateStr}`,
    preheader: `${formatCurrency(data.revenue.total)} revenue yesterday, ${data.schedule.totalAppointments} appointments today, ${data.alerts.bySeverity.critical} critical alerts`,
    html,
    text,
    type: 'daily',
    generatedAt: now.toISOString(),
    data,
  };
}

// ── Data gathering ───────────────────────────────────────────

export async function gatherDailyData(): Promise<DailyBriefingData> {
  const yesterday = getYesterday();
  const today = getToday();
  const now = new Date();

  // Fetch all data sources in parallel
  const [
    revenue,
    schedule,
    alerts,
    loyalty,
    referrals,
    marketing,
    cashFlow,
    contentCalendar,
    aiHighlights,
  ] = await Promise.all([
    fetchRevenue(yesterday),
    fetchSchedule(today),
    fetchAlerts(),
    fetchLoyalty(),
    fetchReferrals(),
    fetchMarketing(),
    fetchCashFlow(),
    fetchContentCalendar(),
    fetchAIHighlights(),
  ]);

  // Generate prioritized action items
  const actionItems = generateActionItems({
    revenue,
    schedule,
    alerts,
    loyalty,
    referrals,
    marketing,
    cashFlow,
    aiHighlights,
  });

  return {
    date: today,
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    revenue,
    schedule,
    alerts,
    loyalty,
    referrals,
    marketing,
    cashFlow,
    contentCalendar,
    aiHighlights,
    actionItems,
  };
}

// ── Action item generation ───────────────────────────────────

interface ActionContext {
  revenue: DailyBriefingData['revenue'];
  schedule: DailyBriefingData['schedule'];
  alerts: DailyBriefingData['alerts'];
  loyalty: DailyBriefingData['loyalty'];
  referrals: DailyBriefingData['referrals'];
  marketing: DailyBriefingData['marketing'];
  cashFlow: DailyBriefingData['cashFlow'];
  aiHighlights: DailyBriefingData['aiHighlights'];
}

export function generateActionItems(ctx: ActionContext): ActionItem[] {
  const items: ActionItem[] = [];

  // Critical alerts always first
  if (ctx.alerts.bySeverity.critical > 0) {
    items.push({
      priority: 'high',
      category: 'Alerts',
      action: `Resolve ${ctx.alerts.bySeverity.critical} critical alert(s)`,
      reason: ctx.alerts.items.filter((a) => a.severity === 'critical').map((a) => a.message).join('; '),
    });
  }

  // Schedule gaps = revenue opportunity
  if (ctx.schedule.gaps.length > 0) {
    const totalGapMinutes = ctx.schedule.gaps.reduce((sum, g) => sum + g.duration, 0);
    items.push({
      priority: 'medium',
      category: 'Schedule',
      action: `Fill ${ctx.schedule.gaps.length} schedule gap(s) (${totalGapMinutes} min total)`,
      reason: 'Open slots reduce daily revenue potential. Consider same-day promos or waitlist outreach.',
    });
  }

  // Churn risk client
  if (ctx.aiHighlights.topChurnRiskClient && ctx.aiHighlights.topChurnRiskClient.score >= 70) {
    items.push({
      priority: 'high',
      category: 'Retention',
      action: `Reach out to high churn-risk client (score: ${ctx.aiHighlights.topChurnRiskClient.score})`,
      reason: 'Personal outreach from the CEO can save at-risk high-value clients.',
    });
  }

  // No-show risk
  if (ctx.aiHighlights.highestNoShowRisk && ctx.aiHighlights.highestNoShowRisk.score >= 60) {
    items.push({
      priority: 'medium',
      category: 'Schedule',
      action: `Confirm appointment at ${ctx.aiHighlights.highestNoShowRisk.time} (no-show risk: ${ctx.aiHighlights.highestNoShowRisk.score}%)`,
      reason: `${ctx.aiHighlights.highestNoShowRisk.service} - send reminder or collect deposit.`,
    });
  }

  // Low revenue day
  if (ctx.revenue.total === 0) {
    items.push({
      priority: 'high',
      category: 'Revenue',
      action: 'Investigate zero-revenue day',
      reason: 'No completed transactions yesterday. Check for system issues or if clinic was closed.',
    });
  }

  // New leads need follow-up
  if (ctx.marketing.newLeads > 0) {
    items.push({
      priority: 'medium',
      category: 'Marketing',
      action: `Follow up with ${ctx.marketing.newLeads} new lead(s)`,
      reason: 'Speed-to-lead matters. Leads contacted within 5 minutes convert 9x higher.',
    });
  }

  // Reviews
  if (ctx.marketing.reviewCount > 0 && ctx.marketing.avgRating < 4.5) {
    items.push({
      priority: 'medium',
      category: 'Reputation',
      action: 'Review and respond to recent reviews',
      reason: `Average rating is ${ctx.marketing.avgRating.toFixed(1)} stars. Respond promptly to maintain reputation.`,
    });
  }

  // Membership churn
  if (ctx.loyalty.churnedMembers > 0) {
    items.push({
      priority: 'medium',
      category: 'Loyalty',
      action: `Address ${ctx.loyalty.churnedMembers} churned membership(s)`,
      reason: 'Each membership lost reduces predictable MRR. Win-back within 30 days has highest success.',
    });
  }

  // Revenue anomaly
  if (ctx.aiHighlights.revenueAnomaly) {
    items.push({
      priority: 'medium',
      category: 'Finance',
      action: `Investigate revenue anomaly: ${ctx.aiHighlights.revenueAnomaly.type}`,
      reason: ctx.aiHighlights.revenueAnomaly.message,
    });
  }

  // Warning alerts
  if (ctx.alerts.bySeverity.warning > 0) {
    items.push({
      priority: 'low',
      category: 'Alerts',
      action: `Review ${ctx.alerts.bySeverity.warning} warning alert(s)`,
      reason: 'Non-critical issues that may escalate if unaddressed.',
    });
  }

  // Consults today
  if (ctx.schedule.consultCount > 0) {
    items.push({
      priority: 'low',
      category: 'Sales',
      action: `Prepare for ${ctx.schedule.consultCount} consultation(s) today`,
      reason: 'Review client profiles and treatment plans before consults for higher close rates.',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return items;
}

// ── HTML rendering ───────────────────────────────────────────

export function renderDailyHtml(data: DailyBriefingData): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const sections: string[] = [];

  // ── Greeting ───────────────────────────────────────────
  sections.push(`
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid #E8E3DA;">
    <tr>
      <td style="padding: 28px 40px 20px;" class="padding-mobile">
        <p style="font-family: 'Georgia', serif; font-size: 18px; color: #0F1D2C; margin: 0 0 4px 0;">Good morning, Rina.</p>
        <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6B6B6B; margin: 0;">Here is your clinic briefing for ${dateStr}.</p>
      </td>
    </tr>
  </table>`);

  // ── Revenue KPIs ───────────────────────────────────────
  const revenueContent = kpiRow([
    { label: "Yesterday's Revenue", value: formatCurrency(data.revenue.total), sublabel: `${data.revenue.transactionCount} transactions` },
    { label: 'Avg Ticket', value: formatCurrencyDetailed(data.revenue.avgTicket) },
    { label: "Today's Appointments", value: String(data.schedule.totalAppointments), sublabel: `${data.schedule.consultCount} consults` },
    { label: 'Alerts', value: String(data.alerts.total), sublabel: `${data.alerts.bySeverity.critical} critical` },
  ]);
  sections.push(section('Performance Snapshot', revenueContent, '&#128200;'));

  // ── Revenue Breakdown ──────────────────────────────────
  if (data.revenue.transactionCount > 0) {
    const providerRows = Object.entries(data.revenue.byProvider)
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount]) => [name, formatCurrency(amount), `${((amount / data.revenue.total) * 100).toFixed(0)}%`]);

    const serviceRows = Object.entries(data.revenue.byService)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => [name, formatCurrency(amount)]);

    let revenueBreakdown = '';
    if (providerRows.length > 0) {
      revenueBreakdown += `<p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #0F1D2C; margin: 0 0 8px 0;">By Provider</p>`;
      revenueBreakdown += dataTable(['Provider', 'Revenue', 'Share'], providerRows);
    }
    if (serviceRows.length > 0) {
      revenueBreakdown += `<p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #0F1D2C; margin: 16px 0 8px 0;">Top Services</p>`;
      revenueBreakdown += dataTable(['Service', 'Revenue'], serviceRows);
    }

    sections.push(section('Revenue Breakdown', revenueBreakdown, '&#128176;'));
  }

  // ── Today's Schedule ───────────────────────────────────
  {
    let schedContent = '';

    const providerRows = Object.entries(data.schedule.byProvider)
      .map(([name, count]) => [name, String(count)]);

    if (providerRows.length > 0) {
      schedContent += dataTable(['Provider', 'Appointments'], providerRows);
    }

    // Schedule gaps
    if (data.schedule.gaps.length > 0) {
      schedContent += calloutBox(
        `<strong>Schedule Gaps Found:</strong> ${data.schedule.gaps.map(
          (g) => `${g.provider} has ${g.duration}min gap at ${g.startTime}`
        ).join(', ')}. Consider filling with walk-ins or same-day promotions.`,
        'warning'
      );
    }

    if (data.schedule.totalAppointments === 0) {
      schedContent += emptyState('No appointments scheduled for today.');
    }

    sections.push(section("Today's Schedule", schedContent, '&#128197;'));
  }

  // ── Active Alerts ──────────────────────────────────────
  if (data.alerts.total > 0) {
    const alertRows = data.alerts.items.slice(0, 5).map((alert) =>
      `<tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #E8E3DA;">
          ${alertBadge(alert.severity, alert.severity.toUpperCase())}
          <span style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1A1A1A; margin-left: 8px;">${alert.message}</span>
          ${alert.actionRecommended ? `<p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6B6B6B; margin: 4px 0 0 0; padding-left: 4px;">&#8594; ${alert.actionRecommended}</p>` : ''}
        </td>
      </tr>`
    ).join('');

    sections.push(section('Active Alerts', `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tbody>${alertRows}</tbody></table>`, '&#9888;'));
  }

  // ── Loyalty Program ────────────────────────────────────
  {
    const loyaltyContent = kpiRow([
      { label: 'Active Members', value: String(data.loyalty.totalMembers) },
      { label: 'New Members', value: String(data.loyalty.newMembers), sublabel: 'last 30 days' },
      { label: 'Membership MRR', value: formatCurrency(data.loyalty.membershipMRR) },
      { label: 'Churned', value: String(data.loyalty.churnedMembers) },
    ]);

    sections.push(section('Loyalty Program', loyaltyContent, '&#11088;'));
  }

  // ── Marketing & Leads ──────────────────────────────────
  {
    const marketingContent = kpiRow([
      { label: 'New Leads', value: String(data.marketing.newLeads) },
      { label: 'Avg Rating', value: data.marketing.avgRating > 0 ? `${data.marketing.avgRating.toFixed(1)} &#9733;` : 'N/A' },
      { label: 'Recent Reviews', value: String(data.marketing.reviewCount), sublabel: 'last 7 days' },
      { label: 'Review Velocity', value: `${data.marketing.reviewVelocity.toFixed(1)}/day` },
    ]);

    sections.push(section('Marketing & Reputation', marketingContent, '&#128640;'));
  }

  // ── Cash Flow ──────────────────────────────────────────
  if (data.cashFlow.plaidConnected && data.cashFlow.bankBalance !== null) {
    const cashContent = kpiRow([
      { label: 'Bank Balance', value: formatCurrency(data.cashFlow.bankBalance) },
      { label: 'Runway', value: data.cashFlow.runway !== null ? `${data.cashFlow.runway} days` : 'N/A' },
    ]);
    sections.push(section('Cash Flow', cashContent, '&#127974;'));
  }

  // ── AI Engine Highlights ───────────────────────────────
  {
    let aiContent = '';

    if (data.aiHighlights.topChurnRiskClient) {
      aiContent += calloutBox(
        `<strong>Churn Risk:</strong> Client with score ${data.aiHighlights.topChurnRiskClient.score}/100 detected. Personal outreach recommended.`,
        data.aiHighlights.topChurnRiskClient.score >= 80 ? 'warning' : 'info'
      );
    }

    if (data.aiHighlights.highestNoShowRisk) {
      aiContent += calloutBox(
        `<strong>No-Show Risk:</strong> ${data.aiHighlights.highestNoShowRisk.service} at ${data.aiHighlights.highestNoShowRisk.time} has ${data.aiHighlights.highestNoShowRisk.score}% no-show probability. Send confirmation or collect deposit.`,
        'warning'
      );
    }

    if (data.aiHighlights.revenueAnomaly) {
      aiContent += calloutBox(
        `<strong>Revenue Anomaly:</strong> ${data.aiHighlights.revenueAnomaly.message}`,
        'info'
      );
    }

    if (!data.aiHighlights.topChurnRiskClient && !data.aiHighlights.highestNoShowRisk && !data.aiHighlights.revenueAnomaly) {
      aiContent = calloutBox('All AI engines report normal. No anomalies or high-risk items detected.', 'success');
    }

    sections.push(section('AI Engine Highlights', aiContent, '&#129302;'));
  }

  // ── Action Items ───────────────────────────────────────
  if (data.actionItems.length > 0) {
    const actionRows = data.actionItems
      .slice(0, 8)
      .map((item) => actionItemRow(item.priority, item.action, item.reason))
      .join('');

    sections.push(section(
      `Today's Action Items (${data.actionItems.length})`,
      `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tbody>${actionRows}</tbody></table>`,
      '&#9989;'
    ));
  }

  // ── Quick Links ────────────────────────────────────────
  sections.push(quickLinksBar([
    { text: 'Dashboard', url: 'https://www.ranibeautyclinic.com/dashboard' },
    { text: 'Bookings', url: 'https://app.mangomint.com/876418' },
    { text: 'Airtable', url: 'https://airtable.com/app1SwhSfwe8GKUg4' },
    { text: 'n8n', url: 'https://ranibeautyclinic.app.n8n.cloud' },
  ]));

  const bodyContent = sections.join('');
  const now2 = new Date();
  const subtitle = now2.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return briefingLayout(bodyContent, `${formatCurrency(data.revenue.total)} revenue | ${data.schedule.totalAppointments} appts | ${data.alerts.bySeverity.critical} critical alerts`, 'Daily CEO Briefing', subtitle);
}
