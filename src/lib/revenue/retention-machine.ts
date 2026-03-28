/**
 * Client Retention Automation Engine
 *
 * Detects rebooking triggers, generates automated reminder sequences,
 * manages lapsed-client win-back campaigns, VIP white-glove retention,
 * and tracks retention ROI vs acquisition cost.
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

// ── TYPES ──

export interface RetentionInput {
  clients: RetentionClient[];
  memberships: RetentionMembership[];
  appointments: RetentionAppointment[];
  packages: RetentionPackage[];
  feedbackScores: FeedbackEntry[];
  config: RetentionConfig;
}

export interface RetentionClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  lastVisitDate: string;
  nextAppointmentDate?: string;
  totalSpend: number;
  visitCount: number;
  avgTicket: number;
  lastServices: string[];
  preferredProvider?: string;
  membershipTier?: string;
  membershipStatus?: string;
  birthdayMonth?: number;
  firstVisitDate?: string;
  preferredContact: 'sms' | 'email' | 'phone';
  churnRisk?: number; // 0-100
}

export interface RetentionMembership {
  clientId: string;
  tier: string;
  status: string;
  startDate: string;
  renewalDate: string;
  monthlyPrice: number;
  daysUntilRenewal: number;
  autoRenew: boolean;
  pauseCount: number;
}

export interface RetentionAppointment {
  clientId: string;
  service: string;
  date: string;
  status: 'completed' | 'no-show' | 'cancelled';
  provider: string;
}

export interface RetentionPackage {
  clientId: string;
  packageName: string;
  sessionsTotal: number;
  sessionsCompleted: number;
  sessionsRemaining: number;
  expirationDate?: string;
  status: string;
}

export interface FeedbackEntry {
  clientId: string;
  date: string;
  score: number; // 1-5 or NPS
  comment?: string;
  service: string;
}

export interface RetentionConfig {
  avgAcquisitionCost: number;
  avgClientLTV: number;
  rebookReminderDays: number[];
  lapsedTiers: { days: number; label: string }[];
  vipSpendThreshold: number;
}

// ── OUTPUT TYPES ──

export interface RetentionResult {
  summary: RetentionSummary;
  rebookingTriggers: RebookingTrigger[];
  rebookReminders: RebookReminder[];
  winBackCampaigns: WinBackCampaign[];
  vipRetention: VipRetentionAction[];
  membershipRenewals: MembershipRenewalAction[];
  packageCompletions: PackageCompletionAction[];
  seasonalReactivation: SeasonalReactivationCampaign[];
  birthdayTouchpoints: BirthdayTouchpoint[];
  feedbackRecovery: FeedbackRecoveryAction[];
  retentionMetrics: RetentionMetrics;
}

export interface RetentionSummary {
  totalClientsNeedingAction: number;
  urgentActions: number;
  estimatedRecoverableRevenue: number;
  retentionRate: number; // 0-100
  avgRetentionCostPerClient: number;
  retentionROI: number; // ratio of retained revenue to retention cost
}

export interface RebookingTrigger {
  clientId: string;
  clientName: string;
  service: string;
  lastVisitDate: string;
  dueDateForRebook: string;
  daysUntilDue: number;
  status: 'upcoming' | 'due-now' | 'overdue';
  estimatedRevenue: number;
  contactMethod: string;
}

export interface RebookReminder {
  clientId: string;
  clientName: string;
  service: string;
  reminderType: 'first' | 'second' | 'final';
  channel: 'sms' | 'email';
  scheduledDate: string;
  message: string;
  subject?: string;
}

export interface WinBackCampaign {
  tier: '30-day' | '60-day' | '90-day';
  clients: WinBackClient[];
  totalEstimatedRecovery: number;
  campaign: {
    channel: 'sms' | 'email' | 'phone';
    message: string;
    subject?: string;
    offer?: string;
    urgency: 'gentle' | 'moderate' | 'strong';
  };
}

export interface WinBackClient {
  clientId: string;
  clientName: string;
  daysSinceVisit: number;
  totalSpend: number;
  lastService: string;
  estimatedRevenue: number;
  winBackProbability: number; // 0-100
}

export interface VipRetentionAction {
  clientId: string;
  clientName: string;
  totalSpend: number;
  visitCount: number;
  daysSinceVisit: number;
  churnRisk: number;
  action: string;
  channel: 'personal-call' | 'handwritten-note' | 'exclusive-invite' | 'concierge-outreach';
  priority: 'critical' | 'high' | 'medium';
  script: string;
}

export interface MembershipRenewalAction {
  clientId: string;
  clientName: string;
  tier: string;
  daysUntilRenewal: number;
  monthlyPrice: number;
  autoRenew: boolean;
  retentionRisk: 'low' | 'moderate' | 'high';
  action: string;
  incentive?: string;
}

export interface PackageCompletionAction {
  clientId: string;
  clientName: string;
  packageName: string;
  sessionsRemaining: number;
  expirationDate?: string;
  action: string;
  rebookSuggestion: string;
}

export interface SeasonalReactivationCampaign {
  season: string;
  targetServices: string[];
  targetClients: string[];
  message: string;
  estimatedReactivations: number;
}

export interface BirthdayTouchpoint {
  clientId: string;
  clientName: string;
  birthdayMonth: number;
  offer: string;
  message: string;
  scheduleSendDate: string;
}

export interface FeedbackRecoveryAction {
  clientId: string;
  clientName: string;
  feedbackScore: number;
  comment?: string;
  service: string;
  date: string;
  recoveryAction: string;
  urgency: 'immediate' | 'within-24h' | 'within-week';
  script: string;
}

export interface RetentionMetrics {
  overallRetentionRate: number;
  memberRetentionRate: number;
  nonMemberRetentionRate: number;
  avgTimeBetweenVisits: number; // days
  rebookRate: number; // 0-100
  churnRate: number; // 0-100
  retentionCostPerClient: number;
  acquisitionCostPerClient: number;
  retentionVsAcquisitionRatio: number;
  lifetimeValueBySegment: { segment: string; ltv: number }[];
}

// ── REBOOK INTERVALS (days) ──

const SERVICE_REBOOK_DAYS: Record<string, number> = {
  'Botox': 90,
  'Fillers': 365,
  'Lip Filler': 365,
  'HydraFacial': 30,
  'VI Peel': 42,
  'PRX-T33': 28,
  'BioRePeel': 28,
  'RF Microneedling': 42,
  'PicoWay': 42,
  'Sofwave': 365,
  'Laser Hair Removal': 42,
  'GLP-1': 30,
  'B12 Injection': 14,
  'Glutathione Injection': 14,
  'Vitamin D3 Injection': 30,
  'Tri-Immune Injection': 14,
  'NAD+ Injection': 30,
};

// ── CORE ENGINE ──

export function analyzeRetention(input: RetentionInput): RetentionResult {
  const now = new Date();

  const rebookingTriggers = detectRebookingTriggers(input.clients, input.appointments, now);
  const rebookReminders = generateRebookReminders(rebookingTriggers, now);
  const winBackCampaigns = buildWinBackCampaigns(input.clients, now);
  const vipRetention = identifyVipRetentionActions(input.clients, input.config, now);
  const membershipRenewals = analyzeMembershipRenewals(input.memberships, input.clients);
  const packageCompletions = analyzePackageCompletions(input.packages, input.clients);
  const seasonalReactivation = buildSeasonalReactivation(input.clients, now);
  const birthdayTouchpoints = generateBirthdayTouchpoints(input.clients, now);
  const feedbackRecovery = analyzeFeedbackRecovery(input.feedbackScores, input.clients, now);
  const retentionMetrics = calculateRetentionMetrics(input);

  const totalActions = rebookingTriggers.length + winBackCampaigns.reduce((s, c) => s + c.clients.length, 0)
    + vipRetention.length + membershipRenewals.filter(m => m.retentionRisk !== 'low').length
    + feedbackRecovery.length;

  const urgentActions = rebookingTriggers.filter(t => t.status === 'overdue').length
    + vipRetention.filter(v => v.priority === 'critical').length
    + feedbackRecovery.filter(f => f.urgency === 'immediate').length;

  const estimatedRecoverable = rebookingTriggers.reduce((s, t) => s + t.estimatedRevenue, 0)
    + winBackCampaigns.reduce((s, c) => s + c.totalEstimatedRecovery, 0)
    + vipRetention.reduce((s, v) => {
      const client = input.clients.find(c => c.id === v.clientId);
      return s + (client?.avgTicket || 300);
    }, 0);

  return {
    summary: {
      totalClientsNeedingAction: totalActions,
      urgentActions,
      estimatedRecoverableRevenue: Math.round(estimatedRecoverable),
      retentionRate: retentionMetrics.overallRetentionRate,
      avgRetentionCostPerClient: retentionMetrics.retentionCostPerClient,
      retentionROI: retentionMetrics.retentionVsAcquisitionRatio,
    },
    rebookingTriggers: rebookingTriggers.slice(0, 50),
    rebookReminders: rebookReminders.slice(0, 100),
    winBackCampaigns,
    vipRetention: vipRetention.slice(0, 25),
    membershipRenewals: membershipRenewals.slice(0, 30),
    packageCompletions: packageCompletions.slice(0, 20),
    seasonalReactivation,
    birthdayTouchpoints: birthdayTouchpoints.slice(0, 20),
    feedbackRecovery: feedbackRecovery.slice(0, 15),
    retentionMetrics,
  };
}

// ── REBOOKING TRIGGER DETECTION ──

function detectRebookingTriggers(
  clients: RetentionClient[],
  appointments: RetentionAppointment[],
  now: Date,
): RebookingTrigger[] {
  const triggers: RebookingTrigger[] = [];

  for (const client of clients) {
    if (client.nextAppointmentDate) continue; // already booked
    if (client.status === 'churned') continue;

    const lastAppts = appointments
      .filter(a => a.clientId === client.id && a.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (lastAppts.length === 0) continue;

    const lastAppt = lastAppts[0];
    const rebookDays = SERVICE_REBOOK_DAYS[lastAppt.service] || 60;
    const lastDate = new Date(lastAppt.date);
    const dueDate = new Date(lastDate.getTime() + rebookDays * 86400000);
    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / 86400000);

    let status: RebookingTrigger['status'];
    if (daysUntilDue > 7) status = 'upcoming';
    else if (daysUntilDue >= -7) status = 'due-now';
    else status = 'overdue';

    // Only trigger for clients due within 14 days or overdue
    if (daysUntilDue > 14) continue;

    const servicePrice = getServicePrice(lastAppt.service);

    triggers.push({
      clientId: client.id,
      clientName: client.name,
      service: lastAppt.service,
      lastVisitDate: lastAppt.date,
      dueDateForRebook: dueDate.toISOString().split('T')[0],
      daysUntilDue,
      status,
      estimatedRevenue: servicePrice,
      contactMethod: client.preferredContact || 'sms',
    });
  }

  return triggers.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

// ── REBOOK REMINDERS ──

function generateRebookReminders(triggers: RebookingTrigger[], now: Date): RebookReminder[] {
  const reminders: RebookReminder[] = [];

  for (const trigger of triggers) {
    const firstName = trigger.clientName.split(' ')[0];

    if (trigger.status === 'upcoming') {
      // First reminder: 7 days before due
      reminders.push({
        clientId: trigger.clientId,
        clientName: trigger.clientName,
        service: trigger.service,
        reminderType: 'first',
        channel: 'sms',
        scheduledDate: addDays(now, Math.max(0, trigger.daysUntilDue - 7)),
        message: `Hi ${firstName}! Your next ${trigger.service} is coming up. Book now to maintain your beautiful results and secure your preferred time. Reply BOOK or call us! -- Rani Beauty Clinic`,
      });
    }

    if (trigger.status === 'due-now') {
      reminders.push({
        clientId: trigger.clientId,
        clientName: trigger.clientName,
        service: trigger.service,
        reminderType: 'second',
        channel: 'sms',
        scheduledDate: addDays(now, 0),
        message: `${firstName}, it is time for your ${trigger.service} maintenance! Consistent treatments deliver the best results. We have availability this week -- shall we book you in? -- Rani Beauty Clinic`,
      });
    }

    if (trigger.status === 'overdue') {
      reminders.push({
        clientId: trigger.clientId,
        clientName: trigger.clientName,
        service: trigger.service,
        reminderType: 'final',
        channel: 'email',
        scheduledDate: addDays(now, 0),
        subject: `${firstName}, we miss you at Rani Beauty Clinic`,
        message: `${firstName}, we noticed it has been a while since your last ${trigger.service}. To help you get back on track with your transformation journey, we would love to welcome you back with priority scheduling. Your results are worth maintaining -- let us help you stay on course.`,
      });
    }
  }

  return reminders;
}

// ── WIN-BACK CAMPAIGNS ──

function buildWinBackCampaigns(clients: RetentionClient[], now: Date): WinBackCampaign[] {
  const tiers: { tier: WinBackCampaign['tier']; minDays: number; maxDays: number; urgency: WinBackCampaign['campaign']['urgency'] }[] = [
    { tier: '30-day', minDays: 30, maxDays: 60, urgency: 'gentle' },
    { tier: '60-day', minDays: 60, maxDays: 90, urgency: 'moderate' },
    { tier: '90-day', minDays: 90, maxDays: 999, urgency: 'strong' },
  ];

  return tiers.map(tierConfig => {
    const tierClients = clients
      .filter(c => {
        if (!c.lastVisitDate || c.nextAppointmentDate) return false;
        const days = Math.floor((now.getTime() - new Date(c.lastVisitDate).getTime()) / 86400000);
        return days >= tierConfig.minDays && days < tierConfig.maxDays;
      })
      .map(c => {
        const days = Math.floor((now.getTime() - new Date(c.lastVisitDate).getTime()) / 86400000);
        return {
          clientId: c.id,
          clientName: c.name,
          daysSinceVisit: days,
          totalSpend: c.totalSpend,
          lastService: c.lastServices[0] || 'treatment',
          estimatedRevenue: c.avgTicket || 300,
          winBackProbability: calculateWinBackProbability(days, c.visitCount, c.totalSpend),
        };
      })
      .sort((a, b) => b.winBackProbability - a.winBackProbability);

    const totalRecovery = tierClients.reduce(
      (s, c) => s + c.estimatedRevenue * (c.winBackProbability / 100),
      0,
    );

    return {
      tier: tierConfig.tier,
      clients: tierClients.slice(0, 50),
      totalEstimatedRecovery: Math.round(totalRecovery),
      campaign: buildCampaignMessage(tierConfig.tier, tierConfig.urgency),
    };
  });
}

function calculateWinBackProbability(daysSinceVisit: number, visitCount: number, totalSpend: number): number {
  let prob = 50;

  // More visits = higher probability of return
  if (visitCount > 10) prob += 20;
  else if (visitCount > 5) prob += 15;
  else if (visitCount > 2) prob += 5;

  // High spenders more likely to return
  if (totalSpend > 5000) prob += 15;
  else if (totalSpend > 2000) prob += 10;

  // Longer absence = lower probability
  if (daysSinceVisit > 120) prob -= 25;
  else if (daysSinceVisit > 90) prob -= 15;
  else if (daysSinceVisit > 60) prob -= 5;

  return Math.min(95, Math.max(5, prob));
}

function buildCampaignMessage(tier: string, urgency: 'gentle' | 'moderate' | 'strong'): WinBackCampaign['campaign'] {
  const campaigns: Record<string, WinBackCampaign['campaign']> = {
    'gentle': {
      channel: 'sms',
      message: 'We have been thinking of you! It has been a little while and we would love to see you back at Rani Beauty Clinic. Your transformation journey continues -- book your next visit today.',
      urgency: 'gentle',
    },
    'moderate': {
      channel: 'email',
      subject: 'We miss you at Rani Beauty Clinic',
      message: 'It has been a while since your last visit, and we want to make sure you are staying on track with your aesthetic goals. Come back this month and enjoy priority scheduling with your preferred provider.',
      offer: 'Complimentary add-on service with your next booking',
      urgency: 'moderate',
    },
    'strong': {
      channel: 'phone',
      message: 'Personal call from the clinic. We value your relationship and want to understand if there is anything we can do better. Offer a complimentary consultation to reassess their goals and create a fresh treatment plan.',
      offer: 'Complimentary consultation + 15% off return visit',
      urgency: 'strong',
    },
  };

  return campaigns[urgency];
}

// ── VIP RETENTION ──

function identifyVipRetentionActions(
  clients: RetentionClient[],
  config: RetentionConfig,
  now: Date,
): VipRetentionAction[] {
  const actions: VipRetentionAction[] = [];

  const vips = clients.filter(c => c.totalSpend >= config.vipSpendThreshold);

  for (const vip of vips) {
    if (!vip.lastVisitDate) continue;

    const daysSince = Math.floor((now.getTime() - new Date(vip.lastVisitDate).getTime()) / 86400000);
    const churnRisk = vip.churnRisk || estimateChurnRisk(daysSince, vip.visitCount);

    if (churnRisk < 30 && daysSince < 30) continue; // healthy VIP

    let priority: VipRetentionAction['priority'];
    let action: string;
    let channel: VipRetentionAction['channel'];
    let script: string;
    const firstName = vip.name.split(' ')[0];

    if (churnRisk >= 70 || daysSince > 90) {
      priority = 'critical';
      channel = 'personal-call';
      action = 'Immediate personal call from preferred provider or clinic manager';
      script = `${firstName}, this is [Provider] from Rani Beauty Clinic. I wanted to reach out personally because you are one of our most valued clients. I noticed we have not seen you in a while and wanted to check in. Is there anything I can help with regarding your treatment plan? We have some exciting new options I think you would love.`;
    } else if (churnRisk >= 50 || daysSince > 60) {
      priority = 'high';
      channel = 'concierge-outreach';
      action = 'Concierge-level outreach with exclusive offer';
      script = `${firstName}, as a VIP at Rani Beauty Clinic, we want to ensure you continue receiving the exceptional care you deserve. I have reserved a preferred time slot for you this week. May I book you in?`;
    } else {
      priority = 'medium';
      channel = 'handwritten-note';
      action = 'Handwritten note with personalized recommendation';
      script = `Dear ${firstName}, Thank you for being a cherished part of the Rani family. I was thinking about your goals and believe [specific treatment] would be a wonderful next step in your journey. I would love to discuss it with you at your next visit. Warmly, [Provider]`;
    }

    actions.push({
      clientId: vip.id,
      clientName: vip.name,
      totalSpend: vip.totalSpend,
      visitCount: vip.visitCount,
      daysSinceVisit: daysSince,
      churnRisk,
      action,
      channel,
      priority,
      script,
    });
  }

  return actions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ── MEMBERSHIP RENEWALS ──

function analyzeMembershipRenewals(
  memberships: RetentionMembership[],
  clients: RetentionClient[],
): MembershipRenewalAction[] {
  const actions: MembershipRenewalAction[] = [];

  for (const mem of memberships) {
    if (mem.status !== 'active') continue;
    if (mem.daysUntilRenewal > 30) continue;

    const client = clients.find(c => c.id === mem.clientId);
    if (!client) continue;

    let retentionRisk: MembershipRenewalAction['retentionRisk'];
    let action: string;
    let incentive: string | undefined;

    if (mem.pauseCount >= 2 || (client.churnRisk && client.churnRisk > 60)) {
      retentionRisk = 'high';
      action = 'Personal outreach to discuss membership value and address concerns';
      incentive = 'Offer one month free or tier upgrade trial to retain';
    } else if (!mem.autoRenew || mem.pauseCount >= 1) {
      retentionRisk = 'moderate';
      action = 'Send renewal reminder emphasizing benefits used and savings earned';
      incentive = 'Highlight total savings from membership this year';
    } else {
      retentionRisk = 'low';
      action = 'Auto-renewal confirmation with thank-you message';
    }

    actions.push({
      clientId: mem.clientId,
      clientName: client.name,
      tier: mem.tier,
      daysUntilRenewal: mem.daysUntilRenewal,
      monthlyPrice: mem.monthlyPrice,
      autoRenew: mem.autoRenew,
      retentionRisk,
      action,
      incentive,
    });
  }

  return actions.sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
}

// ── PACKAGE COMPLETIONS ──

function analyzePackageCompletions(packages: RetentionPackage[], clients: RetentionClient[]): PackageCompletionAction[] {
  const actions: PackageCompletionAction[] = [];

  for (const pkg of packages) {
    if (pkg.status !== 'active') continue;
    if (pkg.sessionsRemaining > 2) continue; // only flag when nearly done

    const client = clients.find(c => c.id === pkg.clientId);
    if (!client) continue;

    let action: string;
    let rebookSuggestion: string;

    if (pkg.sessionsRemaining === 0) {
      action = 'Package completed -- immediate rebooking opportunity';
      rebookSuggestion = `Congratulations on completing your ${pkg.packageName}! To maintain your results, we recommend continuing with individual sessions or upgrading to a membership for ongoing savings.`;
    } else if (pkg.sessionsRemaining === 1) {
      action = 'Final session approaching -- discuss continuation plan';
      rebookSuggestion = `You have one session left in your ${pkg.packageName}. Let us plan your next steps to keep your momentum going!`;
    } else {
      action = 'Two sessions remaining -- pre-sell next package';
      rebookSuggestion = `As you near the end of your ${pkg.packageName}, now is the perfect time to discuss your next package and lock in your results.`;
    }

    actions.push({
      clientId: pkg.clientId,
      clientName: client.name,
      packageName: pkg.packageName,
      sessionsRemaining: pkg.sessionsRemaining,
      expirationDate: pkg.expirationDate,
      action,
      rebookSuggestion,
    });
  }

  return actions;
}

// ── SEASONAL REACTIVATION ──

function buildSeasonalReactivation(clients: RetentionClient[], now: Date): SeasonalReactivationCampaign[] {
  const month = now.getMonth() + 1; // 1-indexed
  const campaigns: SeasonalReactivationCampaign[] = [];

  const seasonalMap: Record<number, { season: string; services: string[]; message: string }> = {
    1: { season: 'New Year Refresh', services: ['HydraFacial', 'GLP-1', 'Botox'], message: 'Start the new year with a fresh glow. Your skin (and body) will thank you.' },
    2: { season: 'Valentine\'s Prep', services: ['Lip Filler', 'Botox', 'HydraFacial'], message: 'Look and feel your most confident this Valentine\'s season.' },
    3: { season: 'Spring Awakening', services: ['VI Peel', 'PicoWay', 'PRX-T33'], message: 'Shed winter skin and reveal your spring glow with our renewal treatments.' },
    4: { season: 'Wedding Season Prep', services: ['Sofwave', 'Botox', 'Fillers', 'HydraFacial'], message: 'Whether you are the bride, guest, or just glow-curious -- start your prep now.' },
    5: { season: 'Summer Ready', services: ['Laser Hair Removal', 'HydraFacial', 'B12 Injection'], message: 'Get summer-ready with smooth skin and an inner glow that matches.' },
    6: { season: 'Summer Glow', services: ['HydraFacial', 'Glutathione Injection', 'B12 Injection'], message: 'Keep your summer glow going strong with our rejuvenating treatments.' },
    7: { season: 'Mid-Year Reset', services: ['NAD+ Injection', 'HydraFacial', 'GLP-1'], message: 'Half the year down -- treat yourself to a mid-year wellness reset.' },
    8: { season: 'Back-to-Routine', services: ['RF Microneedling', 'VI Peel', 'PRX-T33'], message: 'Summer is winding down -- time to repair sun damage and restore your skin.' },
    9: { season: 'Fall Skin Revival', services: ['VI Peel', 'PicoWay', 'RF Microneedling', 'PRX-T33'], message: 'Fall is the best time for aggressive skin treatments. Book your revival series now.' },
    10: { season: 'Pre-Holiday Prep', services: ['Botox', 'Fillers', 'Sofwave'], message: 'Get holiday-ready! Injectable and skin tightening treatments need 2-4 weeks to settle.' },
    11: { season: 'Holiday Glow', services: ['Botox', 'Lip Filler', 'HydraFacial'], message: 'Tis the season to glow. Perfect your look for holiday parties and family photos.' },
    12: { season: 'Year-End Treat', services: ['HydraFacial', 'Botox', 'NAD+ Injection'], message: 'You deserve it. Close out the year with a luxurious treatment on us (well, almost).' },
  };

  const current = seasonalMap[month];
  if (current) {
    const targetClients = clients
      .filter(c => {
        const days = Math.floor((now.getTime() - new Date(c.lastVisitDate || '2020-01-01').getTime()) / 86400000);
        return days > 30 && !c.nextAppointmentDate;
      })
      .slice(0, 100)
      .map(c => c.name);

    campaigns.push({
      season: current.season,
      targetServices: current.services,
      targetClients,
      message: current.message,
      estimatedReactivations: Math.round(targetClients.length * 0.15),
    });
  }

  return campaigns;
}

// ── BIRTHDAY TOUCHPOINTS ──

function generateBirthdayTouchpoints(clients: RetentionClient[], now: Date): BirthdayTouchpoint[] {
  const currentMonth = now.getMonth() + 1;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

  return clients
    .filter(c => c.birthdayMonth === currentMonth || c.birthdayMonth === nextMonth)
    .map(c => {
      const firstName = c.name.split(' ')[0];
      const isThisMonth = c.birthdayMonth === currentMonth;

      return {
        clientId: c.id,
        clientName: c.name,
        birthdayMonth: c.birthdayMonth!,
        offer: c.membershipTier
          ? 'Complimentary upgrade add-on + birthday gift bag'
          : '20% off any single treatment this month',
        message: `Happy Birthday, ${firstName}! To celebrate your special day, we have a gift waiting for you at Rani Beauty Clinic. ${c.membershipTier ? 'As a valued member, enjoy a complimentary upgrade add-on with your next treatment!' : 'Enjoy 20% off any single treatment this month!'} We cannot wait to pamper you.`,
        scheduleSendDate: isThisMonth
          ? addDays(now, 0) // send now
          : addDays(now, 15), // next month - send mid-month
      };
    });
}

// ── FEEDBACK RECOVERY ──

function analyzeFeedbackRecovery(
  feedback: FeedbackEntry[],
  clients: RetentionClient[],
  now: Date,
): FeedbackRecoveryAction[] {
  const actions: FeedbackRecoveryAction[] = [];
  const recentFeedback = feedback.filter(f => {
    const days = Math.floor((now.getTime() - new Date(f.date).getTime()) / 86400000);
    return days <= 7;
  });

  for (const fb of recentFeedback) {
    if (fb.score >= 4) continue; // good feedback, no recovery needed

    const client = clients.find(c => c.id === fb.clientId);
    if (!client) continue;

    const firstName = client.name.split(' ')[0];

    let urgency: FeedbackRecoveryAction['urgency'];
    let recoveryAction: string;
    let script: string;

    if (fb.score <= 2) {
      urgency = 'immediate';
      recoveryAction = 'Immediate call from clinic manager to address concerns and offer resolution';
      script = `${firstName}, I am personally reaching out because your experience did not meet the standard we hold ourselves to. I want to understand what happened and make it right. Would you be available for a brief call?`;
    } else {
      urgency = 'within-24h';
      recoveryAction = 'Follow-up message acknowledging feedback and offering to discuss';
      script = `${firstName}, thank you for sharing your feedback about your recent ${fb.service}. We take every client experience seriously and would love the opportunity to exceed your expectations next time. Is there anything specific we can improve?`;
    }

    actions.push({
      clientId: fb.clientId,
      clientName: client.name,
      feedbackScore: fb.score,
      comment: fb.comment,
      service: fb.service,
      date: fb.date,
      recoveryAction,
      urgency,
      script,
    });
  }

  return actions.sort((a, b) => {
    const urgencyOrder = { immediate: 0, 'within-24h': 1, 'within-week': 2 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
}

// ── RETENTION METRICS ──

function calculateRetentionMetrics(input: RetentionInput): RetentionMetrics {
  const { clients, config } = input;
  const now = new Date();

  const activeClients = clients.filter(c => {
    if (!c.lastVisitDate) return false;
    const days = Math.floor((now.getTime() - new Date(c.lastVisitDate).getTime()) / 86400000);
    return days <= 90;
  });

  const members = clients.filter(c => c.membershipStatus === 'active');
  const nonMembers = clients.filter(c => c.membershipStatus !== 'active' && c.visitCount > 0);

  const retainedMembers = members.filter(m => {
    const days = Math.floor((now.getTime() - new Date(m.lastVisitDate || '2020-01-01').getTime()) / 86400000);
    return days <= 90;
  });

  const retainedNonMembers = nonMembers.filter(c => {
    const days = Math.floor((now.getTime() - new Date(c.lastVisitDate || '2020-01-01').getTime()) / 86400000);
    return days <= 90;
  });

  const totalWithVisits = clients.filter(c => c.visitCount > 0).length;
  const overallRetention = totalWithVisits > 0 ? (activeClients.length / totalWithVisits) * 100 : 0;
  const memberRetention = members.length > 0 ? (retainedMembers.length / members.length) * 100 : 0;
  const nonMemberRetention = nonMembers.length > 0 ? (retainedNonMembers.length / nonMembers.length) * 100 : 0;

  // Average time between visits
  const visitGaps: number[] = [];
  for (const client of clients) {
    if (client.visitCount > 1 && client.firstVisitDate && client.lastVisitDate) {
      const totalDays = Math.floor(
        (new Date(client.lastVisitDate).getTime() - new Date(client.firstVisitDate).getTime()) / 86400000,
      );
      const avgGap = totalDays / (client.visitCount - 1);
      if (avgGap > 0) visitGaps.push(avgGap);
    }
  }
  const avgTimeBetweenVisits = visitGaps.length > 0
    ? Math.round(visitGaps.reduce((s, g) => s + g, 0) / visitGaps.length)
    : 30;

  const rebookCount = clients.filter(c => c.visitCount >= 2).length;
  const rebookRate = totalWithVisits > 0 ? (rebookCount / totalWithVisits) * 100 : 0;
  const churnRate = 100 - overallRetention;

  const retentionCost = 15; // estimated cost per retention touchpoint
  const acquisitionCost = config.avgAcquisitionCost || 150;

  return {
    overallRetentionRate: Math.round(overallRetention),
    memberRetentionRate: Math.round(memberRetention),
    nonMemberRetentionRate: Math.round(nonMemberRetention),
    avgTimeBetweenVisits,
    rebookRate: Math.round(rebookRate),
    churnRate: Math.round(churnRate),
    retentionCostPerClient: retentionCost,
    acquisitionCostPerClient: acquisitionCost,
    retentionVsAcquisitionRatio: Math.round((acquisitionCost / Math.max(1, retentionCost)) * 10) / 10,
    lifetimeValueBySegment: [
      { segment: 'VIP (Elite Members)', ltv: Math.round(config.avgClientLTV * 3) },
      { segment: 'Regular Members', ltv: Math.round(config.avgClientLTV * 1.8) },
      { segment: 'Frequent Non-Members', ltv: Math.round(config.avgClientLTV) },
      { segment: 'Occasional Visitors', ltv: Math.round(config.avgClientLTV * 0.4) },
      { segment: 'One-Visit Wonders', ltv: Math.round(config.avgClientLTV * 0.15) },
    ],
  };
}

// ── HELPERS ──

function getServicePrice(service: string): number {
  const prices: Record<string, number> = {
    'Botox': 350, 'Fillers': 650, 'Lip Filler': 550, 'HydraFacial': 275,
    'VI Peel': 395, 'PRX-T33': 495, 'RF Microneedling': 650, 'Sofwave': 3500,
    'PicoWay': 475, 'Laser Hair Removal': 200, 'BioRePeel': 350,
    'GLP-1': 499, 'B12 Injection': 35, 'Glutathione Injection': 100,
    'Vitamin D3 Injection': 50, 'Tri-Immune Injection': 75, 'NAD+ Injection': 300,
  };
  return prices[service] || 300;
}

function estimateChurnRisk(daysSinceVisit: number, visitCount: number): number {
  let risk = 20;
  if (daysSinceVisit > 120) risk += 50;
  else if (daysSinceVisit > 90) risk += 35;
  else if (daysSinceVisit > 60) risk += 20;
  else if (daysSinceVisit > 30) risk += 10;

  if (visitCount <= 1) risk += 20;
  else if (visitCount <= 3) risk += 10;
  else if (visitCount > 10) risk -= 10;

  return Math.min(100, Math.max(0, risk));
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export { SERVICE_REBOOK_DAYS };
