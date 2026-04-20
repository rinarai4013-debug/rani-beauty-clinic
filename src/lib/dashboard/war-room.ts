export type HeroPackage = {
  id: string;
  name: string;
  anchorPrice: number;
  financingFrom: number;
  focus: string;
};

export type ConsultCloseStep = {
  step: string;
  title: string;
  objective: string;
};

export type ReactivationCampaign = {
  id: string;
  name: string;
  audience: string;
  channel: 'email' | 'sms' | 'mixed';
  estimatedBookings: number;
  totalEstimatedRecovery: number;
};

export type OverdueClient = {
  id: string;
  clientName: string;
  lastVisitAt: string;
  daysOverdue: number;
  estimatedRevenue: number;
  priority: 'high' | 'medium' | 'low';
};

export const WAR_ROOM_CONSULT_CLOSE_SYSTEM: ConsultCloseStep[] = [
  {
    step: '01',
    title: 'anchor on outcome',
    objective: 'confirm what success looks like before discussing logistics.',
  },
  {
    step: '02',
    title: 'present the full plan',
    objective: 'map timeline, treatment stack, and check-in cadence.',
  },
  {
    step: '03',
    title: 'offer payment path',
    objective: 'introduce financing and phased options without shrinking value.',
  },
  {
    step: '04',
    title: 'secure next action',
    objective: 'leave with a scheduled follow-up or treatment commitment.',
  },
];

export const WAR_ROOM_HERO_PACKAGES: HeroPackage[] = [
  {
    id: 'hero-laser-confidence',
    name: 'laser confidence package',
    anchorPrice: 2750,
    financingFrom: 149,
    focus: 'hair removal + long-horizon maintenance',
  },
  {
    id: 'hero-glow-ritual',
    name: 'glow ritual package',
    anchorPrice: 1450,
    financingFrom: 99,
    focus: 'hydrafacial + treatment plan cadence',
  },
  {
    id: 'hero-membership-escalation',
    name: 'membership escalation',
    anchorPrice: 199,
    financingFrom: 199,
    focus: 'ongoing skin momentum and retention',
  },
];

export const WAR_ROOM_REACTIVATION_CAMPAIGNS: ReactivationCampaign[] = [
  {
    id: 'reactivation-01',
    name: 'lapsed glow clients',
    audience: 'clients with no visit in 90+ days',
    channel: 'mixed',
    estimatedBookings: 38,
    totalEstimatedRecovery: 12160,
  },
  {
    id: 'reactivation-02',
    name: 'unfinished treatment plans',
    audience: 'clients who paused mid-plan',
    channel: 'email',
    estimatedBookings: 24,
    totalEstimatedRecovery: 15300,
  },
  {
    id: 'reactivation-03',
    name: 'membership return flow',
    audience: 'past members eligible for restart',
    channel: 'sms',
    estimatedBookings: 19,
    totalEstimatedRecovery: 9720,
  },
];

export const WAR_ROOM_OVERDUE_CLIENTS: OverdueClient[] = [
  {
    id: 'od-001',
    clientName: 'j. b.',
    lastVisitAt: '2026-01-12',
    daysOverdue: 77,
    estimatedRevenue: 1800,
    priority: 'high',
  },
  {
    id: 'od-002',
    clientName: 'm. c.',
    lastVisitAt: '2025-12-21',
    daysOverdue: 99,
    estimatedRevenue: 1250,
    priority: 'high',
  },
  {
    id: 'od-003',
    clientName: 's. t.',
    lastVisitAt: '2026-02-04',
    daysOverdue: 54,
    estimatedRevenue: 780,
    priority: 'medium',
  },
];
