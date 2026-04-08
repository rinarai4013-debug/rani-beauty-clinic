export interface WarRoomHeroPackage {
  name: string;
  priceRange: string;
  monthlyCloseTarget: string;
  revenueRange: string;
  idealFor: string;
  components: string[];
  closingAngle: string;
}

export interface WarRoomServiceLine {
  name: string;
  monthlyTarget: string;
  objective: string;
}

export interface WarRoomKPI {
  label: string;
  target: string;
  whyItMatters: string;
}

export interface WarRoomProbability {
  scenario: string;
  probability: string;
  note: string;
}

export interface WarRoomCadenceStage {
  label: string;
  focus: string;
  actions: string[];
}

export const WAR_ROOM_HEADLINE = {
  title: '90-Day Revenue War Room',
  subtitle:
    'Engineer a six-figure spike month through high-ticket packages, financing-first consults, reactivation, and calendar compression.',
  targetMonth: '$100K spike month',
  targetWindow: 'Next 90 days',
  strategy: 'High-ticket close + financing + reactivation + provider booking days',
};

export const WAR_ROOM_SPIKE_MATH = [
  {
    label: 'Premium path',
    value: '20 x $3K + 40 x $1K',
    caption: 'Hero-package led month with financing-assisted closes',
  },
  {
    label: 'Mid-ticket path',
    value: '125 x $800',
    caption: 'Requires tight consult conversion and booked schedules',
  },
  {
    label: 'Volume path',
    value: '200 x $500',
    caption: 'Hardest path because low-ticket services dilute calendar value',
  },
] as const;

export const WAR_ROOM_HERO_PACKAGES: WarRoomHeroPackage[] = [
  {
    name: 'Summer Reset Package',
    priceRange: '$3K-$5K',
    monthlyCloseTarget: '6-10 closes',
    revenueRange: '$18K-$50K',
    idealFor: 'Patients who want injectables, skin reset, and a clear summer plan',
    components: [
      'Facial balancing consult',
      'Tox plan',
      'HydraFacial or peel cadence',
      'Laser starter series',
    ],
    closingAngle: 'Sell the full reset, not a single treatment.',
  },
  {
    name: 'Bridal / Event 90-Day Package',
    priceRange: '$3.5K-$6K',
    monthlyCloseTarget: '4-8 closes',
    revenueRange: '$14K-$48K',
    idealFor: 'Wedding, graduation, travel, birthday, and photo-season clients',
    components: [
      '90-day consult timeline',
      'Injectables roadmap',
      'Glow treatment stack',
      'Recovery and maintenance visit',
    ],
    closingAngle: 'Reverse-engineer the event date and lock the plan immediately.',
  },
  {
    name: 'Rani Doll Transformation',
    priceRange: '$4K-$6K',
    monthlyCloseTarget: '4-6 closes',
    revenueRange: '$16K-$36K',
    idealFor: 'Patients wanting a high-touch aesthetic transformation path',
    components: [
      'Skin tightening or RF microneedling consult',
      'Texture / glow package',
      'Maintenance visit',
      'Financing-based same-day close',
    ],
    closingAngle: 'Position as a full transformation path with monthly payments.',
  },
];

export const WAR_ROOM_SERVICE_LINES: WarRoomServiceLine[] = [
  {
    name: 'Laser Packages',
    monthlyTarget: '$25K',
    objective: 'Anchor recurring revenue and fill summer demand with series sales.',
  },
  {
    name: 'Injectables',
    monthlyTarget: '$20K',
    objective: 'Use themed provider days and bestie booking compression.',
  },
  {
    name: 'Skin Packages',
    monthlyTarget: '$15K',
    objective: 'Bundle facials, peels, and maintenance into package value.',
  },
  {
    name: 'Sofwave / Tightening',
    monthlyTarget: '$20K',
    objective: 'Sell transformation consults through financing-first closes.',
  },
  {
    name: 'Wellness / Membership / Retail',
    monthlyTarget: '$20K',
    objective: 'Stack recurring programs, reactivation, and prepaid value.',
  },
] as const;

export const WAR_ROOM_DAILY_KPIS: WarRoomKPI[] = [
  {
    label: 'Leads contacted in under 5 minutes',
    target: '90%+',
    whyItMatters: 'Speed-to-lead is your highest-leverage conversion edge.',
  },
  {
    label: 'Consults booked per day',
    target: '4-8',
    whyItMatters: 'Consult volume is the fuel for high-ticket closes.',
  },
  {
    label: 'Consult show rate',
    target: '75%+',
    whyItMatters: 'A booked consult that no-shows is a fake pipeline.',
  },
  {
    label: 'Consult close rate',
    target: '45%-60%',
    whyItMatters: 'This is the main variable separating $40K months from $100K spikes.',
  },
  {
    label: 'Average ticket',
    target: '$800-$1,500',
    whyItMatters: 'Six-figure months need package revenue, not low-ticket churn.',
  },
  {
    label: 'Financed same-day closes',
    target: '25%-40% of hero packages',
    whyItMatters: 'Monthly payments unlock premium package acceptance.',
  },
  {
    label: 'Reactivation revenue',
    target: '$500-$1,500/day',
    whyItMatters: 'Old leads are the fastest money in the building.',
  },
] as const;

export const WAR_ROOM_BOOKING_DAYS = [
  {
    name: 'Face Card Friday',
    objective: 'Compress injectables and glow revenue into one premium booking day.',
  },
  {
    name: 'Laser Saturday',
    objective: 'Turn summer-smooth demand into recurring package revenue.',
  },
  {
    name: 'Transformation Consult Block',
    objective: 'Batch high-intent premium consults and sell the full plan.',
  },
  {
    name: 'Reactivation Power Hour',
    objective: 'Daily SMS/call burst to dormant leads and inactive patients.',
  },
] as const;

export const WAR_ROOM_90_DAY_CADENCE: WarRoomCadenceStage[] = [
  {
    label: 'Days 1-7',
    focus: 'Build the machine',
    actions: [
      'Finalize 2-3 hero packages with financing-first close language.',
      'Set weekly and monthly service-line targets on one scoreboard.',
      'Pull inactive lead, consult, and prior-patient lists for reactivation.',
      'Launch one laser offer, one transformation offer, and one injectables offer.',
    ],
  },
  {
    label: 'Days 8-30',
    focus: 'Drive consult volume',
    actions: [
      'Run daily lead follow-up and same-day consult booking discipline.',
      'Track consults booked, shows, closes, ticket size, and financed closes.',
      'Fully theme 1-2 provider booking days per week.',
      'Kill vague awareness spend and shift dollars to booked consult channels.',
    ],
  },
  {
    label: 'Days 31-60',
    focus: 'Scale winners',
    actions: [
      'Double down on the winning hero package and kill weak promos.',
      'Push prepaid series, memberships, and beauty-bank style cash collection.',
      'Increase reactivation cadence on prior consults and non-buyers.',
      'Give the strongest providers the strongest calendars.',
    ],
  },
  {
    label: 'Days 61-90',
    focus: 'Go for the spike month',
    actions: [
      'Stack transformation packages with maintenance and financing.',
      'Compress demand into fully booked premium days.',
      'Use scarcity honestly: limited booking blocks, package windows, and event timelines.',
      'Protect margins and prioritize revenue per provider hour.',
    ],
  },
];

export const WAR_ROOM_PROBABILITIES: WarRoomProbability[] = [
  {
    scenario: 'No major operating change',
    probability: '<10%',
    note: 'Six-figure month is highly unlikely without a new sales system.',
  },
  {
    scenario: 'Hard execution, inconsistent discipline',
    probability: '20%-30%',
    note: 'Possible if a few strong weeks hit, but fragile.',
  },
  {
    scenario: 'True war room with packages, financing, and reactivation',
    probability: '35%-50%',
    note: 'This is the realistic path to one six-figure spike month.',
  },
  {
    scenario: 'Exceptional execution + enough provider capacity',
    probability: '50%-60%',
    note: 'Strong shot at one spike month, still lower odds for repeatability.',
  },
] as const;

export const WAR_ROOM_GUARDRAILS = [
  'Do not use expensive debt to buy untracked ad spend.',
  'Do not flood the calendar with low-ticket discounts that burn provider capacity.',
  'Do not let financing become a substitute for package quality or clear treatment planning.',
  'Do not run awareness campaigns that cannot be tied to booked consults or bookings.',
  'Do not add new equipment payments unless demand is already proven.',
] as const;

export const WAR_ROOM_OPERATOR_CADENCE = {
  morning: [
    'Review booked consults, no-shows, and unworked leads before 10 AM.',
    'Assign same-day follow-up owners and provider booking targets.',
    'Check yesterday’s lead speed and financed close count.',
  ],
  midday: [
    'Audit ad spend against booked consults and pause low-leverage campaigns.',
    'Push reactivation SMS/call sprint to stale leads and inactive patients.',
    'Review open consults that still need same-day package presentation.',
  ],
  endOfDay: [
    'Update closes, average ticket, reactivation revenue, and next-day consult load.',
    'Flag top opportunities needing owner/provider rescue follow-up.',
    'Record what sold, what stalled, and what gets doubled down tomorrow.',
  ],
} as const;

export const WAR_ROOM_LEAD_PIPELINE = {
  total: 126,
  byGrade: {
    A: 18,
    B: 34,
    C: 42,
    D: 32,
  },
  byUrgency: {
    immediate: 12,
    today: 26,
    this_week: 41,
    nurture: 33,
    archive: 14,
  },
  avgScore: 63,
  hotLeads: 18,
  autoAssigned: 14,
} as const;

export const WAR_ROOM_LEAD_SCORE_CARDS = [
  {
    leadName: 'Summer Smooth Google Lead',
    leadSource: 'google_ads',
    score: {
      totalScore: 92,
      grade: 'A',
      rawScore: 94,
      decayApplied: 2,
      urgency: 'immediate',
      autoAssign: true,
      factors: [
        { dimension: 'demographic', name: 'Local fit', score: 90, weight: 0.2, weightedScore: 18, detail: 'Within target geography' },
        { dimension: 'behavioral', name: 'Page depth', score: 88, weight: 0.25, weightedScore: 22, detail: 'Viewed multiple service pages' },
        { dimension: 'engagement', name: 'Form behavior', score: 92, weight: 0.25, weightedScore: 23, detail: 'Completed consult form' },
        { dimension: 'intent', name: 'Pricing + booking', score: 97, weight: 0.3, weightedScore: 29, detail: 'High booking intent' },
      ],
      recommendation: {
        action: 'Call within 5 minutes and offer same-week consult',
        channel: 'phone',
        timing: 'Now',
        reason: 'High-intent laser lead',
      },
    },
  },
  {
    leadName: 'Facial Balancing Meta Lead',
    leadSource: 'meta_ads',
    score: {
      totalScore: 78,
      grade: 'A',
      rawScore: 82,
      decayApplied: 4,
      urgency: 'today',
      autoAssign: false,
      factors: [
        { dimension: 'demographic', name: 'Income proxy', score: 78, weight: 0.2, weightedScore: 16, detail: 'Strong fit' },
        { dimension: 'behavioral', name: 'Return visits', score: 75, weight: 0.25, weightedScore: 19, detail: 'Visited 3 times this week' },
        { dimension: 'engagement', name: 'DM + form', score: 82, weight: 0.25, weightedScore: 20, detail: 'Responded to outreach' },
        { dimension: 'intent', name: 'Service depth', score: 78, weight: 0.3, weightedScore: 23, detail: 'Strong package interest' },
      ],
      recommendation: {
        action: 'Same-day text + financing-first consult offer',
        channel: 'sms',
        timing: 'Today',
        reason: 'Good fit for hero package',
      },
    },
  },
  {
    leadName: 'Event Glow Reactivation',
    leadSource: 'email',
    score: {
      totalScore: 67,
      grade: 'B',
      rawScore: 70,
      decayApplied: 3,
      urgency: 'this_week',
      autoAssign: false,
      factors: [
        { dimension: 'demographic', name: 'Known patient', score: 84, weight: 0.2, weightedScore: 17, detail: 'Existing client' },
        { dimension: 'behavioral', name: 'Portal activity', score: 62, weight: 0.25, weightedScore: 16, detail: 'Re-opened treatment plan' },
        { dimension: 'engagement', name: 'Email clicks', score: 66, weight: 0.25, weightedScore: 17, detail: 'Clicked campaign twice' },
        { dimension: 'intent', name: 'Event timeline', score: 59, weight: 0.3, weightedScore: 17, detail: 'Needs urgency close' },
      ],
      recommendation: {
        action: 'Offer event timeline consult and glow bundle',
        channel: 'email',
        timing: 'This week',
        reason: 'Warm reactivation opportunity',
      },
    },
  },
] as const;

export const WAR_ROOM_LEAD_ACTIONS = [
  {
    title: 'Immediate call queue',
    target: '12 hot leads today',
    impact: 'Highest-converting action. Same-day calls beat passive nurture.',
  },
  {
    title: 'Financing-first consult offer',
    target: '8 package consults booked',
    impact: 'Monthly payment framing increases premium package acceptance.',
  },
  {
    title: 'Provider booking compression',
    target: '2 themed consult blocks',
    impact: 'Concentrating demand raises close energy and capacity use.',
  },
] as const;

export const WAR_ROOM_REACTIVATION_CAMPAIGNS = [
  {
    tier: '30-day',
    clients: [
      { clientId: 'rbc-301', clientName: 'HydraFacial lapse', daysSinceVisit: 37, totalSpend: 1200, lastService: 'HydraFacial', estimatedRevenue: 450, winBackProbability: 74 },
      { clientId: 'rbc-302', clientName: 'Laser underarms', daysSinceVisit: 42, totalSpend: 2300, lastService: 'Laser Hair Removal', estimatedRevenue: 1200, winBackProbability: 78 },
    ],
    totalEstimatedRecovery: 4800,
    campaign: {
      channel: 'sms',
      message: 'We saved a booking window for your next visit. Want the best time options?',
      offer: 'Priority scheduling + treatment credit',
      urgency: 'gentle',
    },
  },
  {
    tier: '60-day',
    clients: [
      { clientId: 'rbc-401', clientName: 'Tox maintenance', daysSinceVisit: 71, totalSpend: 3100, lastService: 'Botox', estimatedRevenue: 900, winBackProbability: 67 },
      { clientId: 'rbc-402', clientName: 'RF microneedling', daysSinceVisit: 84, totalSpend: 4200, lastService: 'RF Microneedling', estimatedRevenue: 1800, winBackProbability: 61 },
      { clientId: 'rbc-403', clientName: 'Facial balancing', daysSinceVisit: 79, totalSpend: 5200, lastService: 'Filler Consult', estimatedRevenue: 2500, winBackProbability: 58 },
    ],
    totalEstimatedRecovery: 9200,
    campaign: {
      channel: 'email',
      subject: 'Your next-step plan is ready',
      message: 'We mapped the easiest next step to keep your results moving.',
      offer: 'Upgrade into a package or maintenance plan',
      urgency: 'moderate',
    },
  },
  {
    tier: '90-day',
    clients: [
      { clientId: 'rbc-501', clientName: 'VIP filler patient', daysSinceVisit: 126, totalSpend: 8400, lastService: 'Filler', estimatedRevenue: 3000, winBackProbability: 49 },
      { clientId: 'rbc-502', clientName: 'Sofwave inquiry', daysSinceVisit: 142, totalSpend: 2600, lastService: 'Sofwave Consult', estimatedRevenue: 3500, winBackProbability: 44 },
      { clientId: 'rbc-503', clientName: 'Laser series pause', daysSinceVisit: 108, totalSpend: 3700, lastService: 'Laser Hair Removal', estimatedRevenue: 1600, winBackProbability: 52 },
    ],
    totalEstimatedRecovery: 14300,
    campaign: {
      channel: 'phone',
      message: 'This is a personal outreach push. Rebuild the relationship and sell the full reset plan.',
      offer: 'VIP consult + financing-based package path',
      urgency: 'strong',
    },
  },
] as const;

export const WAR_ROOM_OVERDUE_CLIENTS = [
  {
    clientId: 'gap-1',
    clientName: 'Laser series stalled',
    lastService: 'Laser Hair Removal',
    lastVisitDate: '2026-01-18',
    daysSinceVisit: 80,
    expectedRebookDays: 35,
    daysOverdue: 45,
    estimatedRevenue: 1400,
    urgency: 'significantly-overdue',
    preferredProvider: 'Laser team',
    contactMethod: 'sms',
  },
  {
    clientId: 'gap-2',
    clientName: 'Tox maintenance due',
    lastService: 'Botox',
    lastVisitDate: '2025-12-19',
    daysSinceVisit: 111,
    expectedRebookDays: 90,
    daysOverdue: 21,
    estimatedRevenue: 850,
    urgency: 'overdue',
    preferredProvider: 'Injector day',
    contactMethod: 'phone',
  },
  {
    clientId: 'gap-3',
    clientName: 'Skin transformation pause',
    lastService: 'RF Microneedling',
    lastVisitDate: '2025-11-26',
    daysSinceVisit: 134,
    expectedRebookDays: 60,
    daysOverdue: 74,
    estimatedRevenue: 2200,
    urgency: 'at-risk',
    preferredProvider: 'Skin specialist',
    contactMethod: 'email',
  },
] as const;

export const WAR_ROOM_CONSULT_CLOSE_SYSTEM = {
  headline: 'Financing-first consult close system',
  principles: [
    'Sell the full plan, not a single treatment.',
    'Present monthly payment before sticker shock ends the conversation.',
    'Use a clear 90-day timeline with urgency tied to results and calendar slots.',
    'Close same day whenever the patient is clinically appropriate and ready.',
  ],
  consultTargets: [
    { label: 'Consults booked / day', value: '4-8' },
    { label: 'Consult show rate', value: '75%+' },
    { label: 'Close rate', value: '45%-60%' },
    { label: 'Financed package share', value: '25%-40%' },
  ],
  scriptBlocks: [
    {
      title: 'Positioning',
      copy: 'This is not a one-treatment visit. This is the full path I would use to get you the result you actually want.',
    },
    {
      title: 'Financing pivot',
      copy: 'If you want, I can show you what this looks like as a monthly payment instead of a one-time decision.',
    },
    {
      title: 'Urgency close',
      copy: 'The best move is to lock the full plan while your timing and provider availability still line up.',
    },
    {
      title: 'Fallback',
      copy: 'If you are not ready for the full package, we can secure the first phase today and hold the rest of the plan in place.',
    },
  ],
} as const;
