import type {
  CouncilAgent,
  CouncilAgentId,
  CouncilRecommendation,
  CouncilSnapshot,
  CouncilTier,
  CouncilBuildStatus,
} from '@/types/agent-council';

function recommendation(
  agentId: CouncilAgentId,
  key: string,
  title: string,
  description: string,
  severity: CouncilRecommendation['severity'],
  impact: string,
  owner: string,
): CouncilRecommendation {
  return {
    id: `${agentId}:${key}`,
    title,
    description,
    severity,
    impact,
    owner,
  };
}

export const AGENT_COUNCIL: CouncilAgent[] = [
  {
    id: 'ceo-chief-of-staff',
    name: 'CEO Chief of Staff',
    emoji: '👠',
    tier: 'crown',
    category: 'executive',
    status: 'extended',
    mission: 'Synthesize the entire clinic into a sharp daily command brief and force priority clarity.',
    ownerValue: 'Turns dashboard noise into the top 3 moves that matter today.',
    permission: 'view_executive',
    uiPath: '/dashboard/briefing',
    apiPath: '/api/dashboard/agents/ceo-chief-of-staff',
    summary: 'Executive synthesis layer over revenue, conversion, retention, ops, and compliance.',
    scorecards: [
      { label: 'Critical moves', value: '3', context: 'Owner-focus list for today' },
      { label: 'Council coverage', value: '12 agents', context: 'One command layer instead of disconnected pages' },
      { label: 'Decision horizon', value: '24-72h', context: 'Built for fast operator decisions' },
    ],
    signals: [
      { label: 'Revenue sprint status', value: 'Active', status: 'high', note: '90-day push is now integrated across revenue, leads, consult, and reactivation' },
      { label: 'Deploy confidence', value: 'Strong', status: 'medium', note: 'Smoke checks and auth hardening are in place' },
      { label: 'Ops visibility', value: 'Improved', status: 'medium', note: 'Command center now has a real executive layer' },
    ],
    recommendations: [
      recommendation('ceo-chief-of-staff', 'daily-brief', 'Run the owner brief every morning', 'Start with the council summary, then move directly into leads, consults, and reactivation before noon.', 'critical', 'Higher execution consistency and fewer missed revenue moves', 'Owner'),
      recommendation('ceo-chief-of-staff', 'weekly-review', 'Hold a weekly council review', 'Use one weekly review to decide which service lines, campaigns, and provider days get doubled down next.', 'high', 'Keeps the sprint focused on what is actually winning', 'Owner + leadership'),
      recommendation('ceo-chief-of-staff', 'action-feed', 'Treat recommendations like a queue, not inspiration', 'Every council recommendation should either be worked, deferred with reason, or dismissed intentionally.', 'medium', 'Prevents dashboard theater', 'Owner'),
    ],
    linkedRoutes: [
      { label: 'Briefing page', href: '/dashboard/briefing', type: 'page' },
      { label: 'Command center', href: '/dashboard', type: 'page' },
      { label: 'Briefing API', href: '/api/dashboard/briefing', type: 'api' },
    ],
  },
  {
    id: 'finance-strategist',
    name: 'Finance Strategist',
    emoji: '💵',
    tier: 'crown',
    category: 'finance',
    status: 'extended',
    mission: 'Translate clinic activity into cash clarity, margin protection, and forecast discipline.',
    ownerValue: 'Shows whether growth is actually helping cash flow or just creating prettier chaos.',
    permission: 'view_finance',
    uiPath: '/dashboard/finance',
    apiPath: '/api/dashboard/agents/finance-strategist',
    summary: 'Finance layer focused on runway, payment pressure, forecast pacing, and package economics.',
    scorecards: [
      { label: '90-day target', value: '$100K spike month', context: 'Finance is supporting the sprint, not slowing it' },
      { label: 'Best use case', value: 'Cash protection', context: 'Protect runway while scaling booked revenue' },
      { label: 'Decision speed', value: 'Weekly', context: 'Finance should inform every Monday plan' },
    ],
    signals: [
      { label: 'Revenue war room', value: 'Integrated', status: 'medium', note: 'Revenue targets and close goals live in the dashboard now' },
      { label: 'Build discipline', value: 'Scoped gate live', status: 'medium', note: 'Critical typecheck exists even though full repo discipline is still maturing' },
      { label: 'Debt pressure', value: 'Still high', status: 'high', note: 'Financial structure remains the main business risk outside the codebase' },
    ],
    recommendations: [
      recommendation('finance-strategist', 'weekly-stack', 'Track revenue by service line every week', 'Review laser, injectables, skin, tightening, and wellness targets as separate stacks instead of one blended revenue number.', 'critical', 'Makes it easier to find what is actually creating the sprint month', 'Owner + finance'),
      recommendation('finance-strategist', 'hero-margins', 'Protect hero-package margin', 'Do not discount premium packages into oblivion just to close them. Financing should do more of the heavy lifting.', 'high', 'Preserves cash while still driving big closes', 'Owner + consult team'),
      recommendation('finance-strategist', 'reserve-discipline', 'Preserve liquidity before expanding spend', 'Only increase discretionary spend when booked revenue and collected cash both support it.', 'high', 'Reduces survival risk', 'Owner'),
    ],
    linkedRoutes: [
      { label: 'Finance page', href: '/dashboard/finance', type: 'page' },
      { label: 'Revenue page', href: '/dashboard/revenue', type: 'page' },
      { label: 'Finance overview API', href: '/api/dashboard/finance/overview', type: 'api' },
      { label: 'Finance forecast API', href: '/api/dashboard/finance/forecast', type: 'api' },
    ],
  },
  {
    id: 'general-google',
    name: 'General Google',
    emoji: '🟢',
    tier: 'revenue',
    category: 'ads',
    status: 'extended',
    mission: 'Protect high-intent search demand, keyword efficiency, and booked-consult alignment.',
    ownerValue: 'Makes sure search dollars are buying consult intent, not vanity clicks.',
    permission: 'view_revenue',
    uiPath: '/dashboard/marketing',
    apiPath: '/api/dashboard/agents/general-google',
    summary: 'Google search and high-intent acquisition operator focused on booked consults.',
    scorecards: [
      { label: 'Role', value: 'Intent capture', context: 'Search is where your most direct buyers live' },
      { label: 'Main KPI', value: 'Booked consults', context: 'Not just leads or clicks' },
      { label: 'Execution mode', value: 'Weekly pruning', context: 'Keywords and landing pages need constant truth-telling' },
    ],
    signals: [
      { label: 'Search intent fit', value: 'Needs active tuning', status: 'medium', note: 'The system can now route winning offers into the dashboard' },
      { label: 'Landing page alignment', value: 'Improving', status: 'medium', note: 'Website and lead-war-room surfaces are now aligned' },
      { label: 'Budget discipline', value: 'Critical', status: 'high', note: 'Search spend should only scale with booked consult proof' },
    ],
    recommendations: [
      recommendation('general-google', 'keyword-focus', 'Focus spend on hero-package and consult-intent terms', 'Push budget toward search that can realistically close into laser, injectables, and premium skin plans.', 'critical', 'Higher-quality lead flow', 'Marketing'),
      recommendation('general-google', 'landing-match', 'Match every ad group to one clear offer page', 'Do not send premium search traffic into vague service pages with no obvious consult path.', 'high', 'Better conversion from click to consult', 'Marketing + website'),
      recommendation('general-google', 'kill-waste', 'Pause non-booking search terms fast', 'Anything that clicks but does not book should be demoted quickly during the 90-day sprint.', 'medium', 'Protects ad efficiency', 'Marketing'),
    ],
    linkedRoutes: [
      { label: 'Marketing page', href: '/dashboard/marketing', type: 'page' },
      { label: 'Ads War Machine', href: '/dashboard/ads-war-machine', type: 'page' },
      { label: 'Marketing overview API', href: '/api/dashboard/marketing', type: 'api' },
    ],
  },
  {
    id: 'meta-commander',
    name: 'Meta Commander',
    emoji: '🔵',
    tier: 'revenue',
    category: 'ads',
    status: 'extended',
    mission: 'Control creative fatigue, retargeting pressure, and paid-social lead quality.',
    ownerValue: 'Prevents Meta from becoming an expensive content hobby.',
    permission: 'view_revenue',
    uiPath: '/dashboard/marketing',
    apiPath: '/api/dashboard/agents/meta-commander',
    summary: 'Paid social command layer focused on lead quality, audience freshness, and retargeting outcomes.',
    scorecards: [
      { label: 'Role', value: 'Demand shaping', context: 'Meta should warm and retarget, not just entertain' },
      { label: 'Main KPI', value: 'Qualified consults', context: 'Weak leads are not a win' },
      { label: 'Best move', value: 'Retargeting loops', context: 'Use Meta to push warm traffic into booked consults' },
    ],
    signals: [
      { label: 'Meta integration', value: 'Configured later', status: 'medium', note: 'Health reported Meta Ads as not configured in preview' },
      { label: 'Creative fatigue risk', value: 'Always present', status: 'high', note: 'Premium offers need rotation and stronger framing' },
      { label: 'Retargeting value', value: 'High', status: 'medium', note: 'This is where the codebase can amplify conversion most quickly' },
    ],
    recommendations: [
      recommendation('meta-commander', 'retarget-offers', 'Retarget offer viewers with consult-first creative', 'Use Meta to bring back people who looked at package, results, or pricing pages but did not book.', 'critical', 'Warmer traffic and stronger close odds', 'Marketing'),
      recommendation('meta-commander', 'creative-rotation', 'Rotate premium creatives weekly', 'Do not let one creative carry the whole sprint; test urgency, transformation, and event-driven hooks.', 'high', 'Prevents creative decay', 'Marketing'),
      recommendation('meta-commander', 'lead-quality-loop', 'Score Meta leads against actual closes', 'The lead war room should tell you whether Meta is feeding premium buyers or just inquiries.', 'high', 'Improves budget allocation', 'Marketing + front desk'),
    ],
    linkedRoutes: [
      { label: 'Meta Ads page', href: '/dashboard/meta-ads', type: 'page' },
      { label: 'Marketing page', href: '/dashboard/marketing', type: 'page' },
      { label: 'Meta Ads API', href: '/api/dashboard/meta-ads', type: 'api' },
    ],
  },
  {
    id: 'website-colonel',
    name: 'Website Colonel',
    emoji: '🌐',
    tier: 'revenue',
    category: 'website',
    status: 'extended',
    mission: 'Reduce website friction and turn money pages into clearer booking pathways.',
    ownerValue: 'Makes the site feel less like a brochure and more like a closer.',
    permission: 'view_leads',
    uiPath: '/dashboard/marketing',
    apiPath: '/api/dashboard/agents/website-colonel',
    summary: 'Website conversion operator focused on trust, friction, CTA clarity, and flow integrity.',
    scorecards: [
      { label: 'Role', value: 'CRO command', context: 'Every page should either build trust or book a consult' },
      { label: 'Priority', value: 'Money pages first', context: 'Packages, consultation, pricing, and plan delivery' },
      { label: 'Execution', value: 'Weekly checks', context: 'Homepage polish matters less than funnel friction' },
    ],
    signals: [
      { label: 'Public route security', value: 'Hardened', status: 'medium', note: 'Core public routes are much safer than before' },
      { label: 'Lead flow integrity', value: 'Improved', status: 'medium', note: 'Contact and magic-link flows now have stronger guardrails' },
      { label: 'Conversion friction', value: 'Still a lever', status: 'high', note: 'Design and message clarity still decide whether traffic converts' },
    ],
    recommendations: [
      recommendation('website-colonel', 'money-page-focus', 'Treat the highest-intent pages as a sales floor', 'Consult, package, financing, and treatment-plan pages should get the strongest message clarity and shortest path to action.', 'critical', 'Higher lead-to-consult conversion', 'Owner + marketing'),
      recommendation('website-colonel', 'social-proof', 'Increase trust density on premium pages', 'Results, provider confidence, treatment plan clarity, and financing framing should appear where purchase friction is highest.', 'high', 'More consult confidence', 'Marketing'),
      recommendation('website-colonel', 'cta-discipline', 'Stop sending premium traffic into weak CTA journeys', 'Every hero package or ad offer should land on a page with a single obvious next step.', 'high', 'Better consult volume', 'Marketing + website'),
    ],
    linkedRoutes: [
      { label: 'Marketing page', href: '/dashboard/marketing', type: 'page' },
      { label: 'Leads page', href: '/dashboard/leads', type: 'page' },
      { label: 'Health endpoint', href: '/api/health', type: 'api' },
    ],
  },
  {
    id: 'seo-queen',
    name: 'SEO Queen',
    emoji: '🔍',
    tier: 'revenue',
    category: 'seo',
    status: 'extended',
    mission: 'Grow local search gravity, geo-page strength, and high-intent organic discovery.',
    ownerValue: 'Builds the cheapest long-term lead engine in the business.',
    permission: 'view_leads',
    uiPath: '/dashboard/marketing',
    apiPath: '/api/dashboard/agents/seo-queen',
    summary: 'SEO and local discovery layer tied to geo pages, reviews, content, and search intent.',
    scorecards: [
      { label: 'Role', value: 'Organic demand', context: 'Compounds over time unlike paid media' },
      { label: 'Main KPI', value: 'Qualified local discovery', context: 'Ranking only matters when it drives consult intent' },
      { label: 'Best move', value: 'Geo + service depth', context: 'Renton-area service content should be brutally practical' },
    ],
    signals: [
      { label: 'SEO route status', value: 'Now integrated', status: 'medium', note: 'SEO now has a real council surface instead of a dead stub' },
      { label: 'Review leverage', value: 'High', status: 'medium', note: 'Local SEO strength should be tied to reviews and service trust' },
      { label: 'Content opportunity', value: 'Open', status: 'high', note: 'Event-driven, service-driven, and local intent content still has room to grow' },
    ],
    recommendations: [
      recommendation('seo-queen', 'geo-depth', 'Build service-specific local authority', 'Expand content around the exact services driving the 90-day sprint instead of generic beauty content.', 'critical', 'More qualified organic leads', 'Marketing'),
      recommendation('seo-queen', 'review-loop', 'Turn review collection into SEO fuel', 'Reviews and response consistency should support both trust and local search strength.', 'high', 'Long-tail lead growth', 'Front desk + marketing'),
      recommendation('seo-queen', 'internal-links', 'Link money pages more aggressively', 'Use internal links to route authority toward consult and package pages, not just blog surfaces.', 'medium', 'Improves discoverability and conversion', 'Website'),
    ],
    linkedRoutes: [
      { label: 'Marketing SEO page', href: '/dashboard/marketing/seo', type: 'page' },
      { label: 'SEO API', href: '/api/dashboard/marketing/seo', type: 'api' },
      { label: 'Reviews page', href: '/dashboard/reviews', type: 'page' },
    ],
  },
  {
    id: 'conversion-duchess',
    name: 'Conversion Duchess',
    emoji: '💋',
    tier: 'revenue',
    category: 'conversion',
    status: 'real',
    mission: 'Raise consult close rate, average ticket, and same-day package capture.',
    ownerValue: 'Turns patient interest into premium revenue instead of one-off treatments.',
    permission: 'view_clients',
    uiPath: '/dashboard/consult',
    apiPath: '/api/dashboard/agents/conversion-duchess',
    summary: 'Consult close system built around full-plan selling, financing, and package structure.',
    scorecards: [
      { label: 'Consult show target', value: '75%+', context: 'Booked consults must actually arrive' },
      { label: 'Close target', value: '45%-60%', context: 'This is the number that changes the business' },
      { label: 'Ticket target', value: '$800-$1.5K', context: 'Premium months need premium ticket size' },
    ],
    signals: [
      { label: 'Consult system', value: 'Integrated', status: 'medium', note: 'A full consult close page now exists inside the dashboard' },
      { label: 'Package readiness', value: 'High', status: 'medium', note: 'Hero-package framing is now visible to the team' },
      { label: 'Financing leverage', value: 'Critical', status: 'high', note: 'This is still one of the fastest ways to unlock bigger closes' },
    ],
    recommendations: [
      recommendation('conversion-duchess', 'monthly-payment', 'Present monthly payment before momentum dies', 'Use financing to keep premium packages in the conversation before price shock kills them.', 'critical', 'Higher premium close rate', 'Providers + consult team'),
      recommendation('conversion-duchess', 'full-plan', 'Sell the full path, not phase one only', 'Patients buy confidence when the roadmap is clear. One-treatment thinking caps ticket size.', 'critical', 'Bigger closes and stronger outcomes', 'Providers'),
      recommendation('conversion-duchess', 'rescue-offer', 'Use phase-one fallback, not full retreat', 'If the full package does not close, secure the first phase with a clear next-step plan.', 'medium', 'Improves salvage rate', 'Front desk + providers'),
    ],
    linkedRoutes: [
      { label: 'Consult page', href: '/dashboard/consult', type: 'page' },
      { label: 'Consult API', href: '/api/dashboard/consult', type: 'api' },
      { label: 'Revenue page', href: '/dashboard/revenue', type: 'page' },
    ],
  },
  {
    id: 'client-journey-concierge',
    name: 'Client Journey Concierge',
    emoji: '💌',
    tier: 'revenue',
    category: 'retention',
    status: 'extended',
    mission: 'Smooth the path from lead to treatment plan to follow-up so clients feel guided, not dropped.',
    ownerValue: 'Keeps premium clients from leaking out between touchpoints.',
    permission: 'view_clients',
    uiPath: '/dashboard/reactivation',
    apiPath: '/api/dashboard/agents/client-journey-concierge',
    summary: 'Journey orchestration layer across consults, plans, communication, and rebooking.',
    scorecards: [
      { label: 'Best role', value: 'Follow-up glue', context: 'Owns what happens after the initial yes' },
      { label: 'Main KPI', value: 'Rebooking momentum', context: 'A delighted patient should move smoothly to next step' },
      { label: 'Primary surfaces', value: 'Plan + comms + reactivation', context: 'Built to reduce handoff gaps' },
    ],
    signals: [
      { label: 'Plan flow security', value: 'Improved', status: 'medium', note: 'Plan tracking and access-code handling were hardened' },
      { label: 'Email readiness', value: 'Partially configured', status: 'high', note: 'Magic-link and plan send rely on outbound email being properly configured' },
      { label: 'Journey consistency', value: 'Open lever', status: 'medium', note: 'There is still room to tighten post-consult and post-treatment follow-up' },
    ],
    recommendations: [
      recommendation('client-journey-concierge', 'same-day-followup', 'Guarantee same-day post-consult follow-up', 'Any patient who receives a plan should also receive a clear next-step nudge the same day.', 'critical', 'Higher close and rebook conversion', 'Front desk'),
      recommendation('client-journey-concierge', 'plan-clarity', 'Use treatment plans as confidence tools', 'Plans should feel like a premium concierge roadmap, not a PDF dead-end.', 'high', 'More plan-to-booked conversion', 'Providers + front desk'),
      recommendation('client-journey-concierge', 'handoff-owner', 'Assign ownership to every hot follow-up', 'Nothing premium should sit in a generic inbox without a human owner.', 'high', 'Less leakage', 'Operations'),
    ],
    linkedRoutes: [
      { label: 'Communications page', href: '/dashboard/communications', type: 'page' },
      { label: 'Plan Builder page', href: '/dashboard/plan-builder', type: 'page' },
      { label: 'Reactivation page', href: '/dashboard/reactivation', type: 'page' },
    ],
  },
  {
    id: 'retention-empress',
    name: 'Retention Empress',
    emoji: '♻️',
    tier: 'revenue',
    category: 'retention',
    status: 'real',
    mission: 'Drive reactivation, membership retention, and lapsed-client revenue recovery.',
    ownerValue: 'Turns yesterday’s client base into today’s fastest revenue source.',
    permission: 'view_clients',
    uiPath: '/dashboard/reactivation',
    apiPath: '/api/dashboard/agents/retention-empress',
    summary: 'Win-back, lapse recovery, and overdue-client command center.',
    scorecards: [
      { label: 'Daily reactivation ask', value: '$500-$1.5K', context: 'Fastest money in the building' },
      { label: 'Recovery pool', value: '$28K+', context: 'Across campaign and overdue queues' },
      { label: 'Execution rhythm', value: 'Daily', context: 'This works best as a daily habit, not a monthly idea' },
    ],
    signals: [
      { label: 'Reactivation page', value: 'Live', status: 'medium', note: 'The dashboard now has a real reactivation operating surface' },
      { label: 'Overdue client queue', value: 'Visible', status: 'medium', note: 'Team can now work a real queue instead of vague lists' },
      { label: 'Best revenue lever', value: 'High', status: 'high', note: 'Win-back is still one of the most believable 90-day growth levers' },
    ],
    recommendations: [
      recommendation('retention-empress', 'daily-burst', 'Run reactivation every day, not when you remember', 'Schedule a fixed outreach block daily for lapsed and overdue clients.', 'critical', 'Direct revenue lift', 'Front desk'),
      recommendation('retention-empress', 'vip-human-touch', 'Escalate high-value dormant clients to a human close', 'VIP and prior high-spend clients should not sit in nurture automation alone.', 'high', 'Higher win-back rate', 'Owner + providers'),
      recommendation('retention-empress', 'priority-offer', 'Use scheduling priority and plan-based offers before blanket discounts', 'Preserve brand and margin while still giving people a reason to come back now.', 'medium', 'Stronger retention economics', 'Front desk + marketing'),
    ],
    linkedRoutes: [
      { label: 'Reactivation page', href: '/dashboard/reactivation', type: 'page' },
      { label: 'Reactivation API', href: '/api/dashboard/reactivation', type: 'api' },
      { label: 'Revenue optimizer retention API', href: '/api/dashboard/revenue-optimizer/retention', type: 'api' },
    ],
  },
  {
    id: 'operations-director',
    name: 'Operations Director',
    emoji: '🧰',
    tier: 'protection',
    category: 'operations',
    status: 'extended',
    mission: 'Reduce execution drag, tighten follow-through, and make the clinic feel coordinated instead of frantic.',
    ownerValue: 'Prevents revenue from dying in handoffs, room friction, and task chaos.',
    permission: 'view_executive',
    uiPath: '/dashboard/ops',
    apiPath: '/api/dashboard/agents/operations-director',
    summary: 'Execution operator tying together morning fires, pipeline movement, and staff action ownership.',
    scorecards: [
      { label: 'Main job', value: 'Reduce chaos', context: 'The clinic should feel managed, not improvised' },
      { label: 'Main surfaces', value: 'Ops + schedule + entries', context: 'Ops needs visibility, not wishful thinking' },
      { label: 'Best move', value: 'Daily priorities', context: 'Protect the team from scattered work' },
    ],
    signals: [
      { label: 'Ops page', value: 'Live', status: 'medium', note: 'There is already a real operations command center in the app' },
      { label: 'Action ownership', value: 'Needs discipline', status: 'high', note: 'The system can now surface moves, but the team has to actually work them' },
      { label: 'Calendar compression', value: 'High leverage', status: 'medium', note: 'Themed booking days and provider stacking are still major upside levers' },
    ],
    recommendations: [
      recommendation('operations-director', 'morning-priority', 'Start every day with the top 3 ops fires', 'Revenue goes sideways when the team starts scattered and reactive.', 'critical', 'Better throughput and calmer execution', 'Operations'),
      recommendation('operations-director', 'provider-days', 'Run themed provider days with intention', 'Compression of consults and treatments should feel engineered, not accidental.', 'high', 'Higher provider utilization and closing energy', 'Operations + providers'),
      recommendation('operations-director', 'handoff-discipline', 'Assign follow-up owners explicitly', 'The biggest ops leak is often everyone assuming someone else has it.', 'high', 'Less lead and patient leakage', 'Operations'),
    ],
    linkedRoutes: [
      { label: 'Ops page', href: '/dashboard/ops', type: 'page' },
      { label: 'Schedule optimizer page', href: '/dashboard/schedule-optimizer', type: 'page' },
      { label: 'Ops morning API', href: '/api/ops/morning', type: 'api' },
    ],
  },
  {
    id: 'compliance-guardian',
    name: 'Compliance Guardian',
    emoji: '🛡️',
    tier: 'protection',
    category: 'compliance',
    status: 'real',
    mission: 'Protect the clinic from documentation, consent, audit, and operational compliance drift.',
    ownerValue: 'Stops expensive messes before they become legal or clinical problems.',
    permission: 'view_settings',
    uiPath: '/dashboard/compliance',
    apiPath: '/api/dashboard/agents/compliance-guardian',
    summary: 'Compliance command layer across HIPAA, OSHA, licenses, consents, DEA, devices, and audit.',
    scorecards: [
      { label: 'Coverage', value: '9 areas', context: 'HIPAA through audit trail' },
      { label: 'Main posture', value: 'Protective', context: 'Revenue is not useful if compliance is sloppy' },
      { label: 'Operator need', value: 'Clear deadlines', context: 'Compliance should be visible before it is painful' },
    ],
    signals: [
      { label: 'Compliance page', value: 'Live', status: 'medium', note: 'There is already a real compliance overview in the dashboard' },
      { label: 'Documentation rigor', value: 'Important', status: 'high', note: 'As patient volume grows, charting and consent discipline matter more' },
      { label: 'Audit readiness', value: 'Improving', status: 'medium', note: 'The dashboard has better structure now, but process discipline still matters' },
    ],
    recommendations: [
      recommendation('compliance-guardian', 'consent-completeness', 'Watch consents and charting completeness aggressively', 'Never let premium growth outrun documentation quality.', 'critical', 'Lower legal and clinical risk', 'Clinical leadership'),
      recommendation('compliance-guardian', 'deadline-feed', 'Push all compliance deadlines into one visible queue', 'Licenses, training, and device maintenance should never be hidden in memory.', 'high', 'Better preparedness', 'Operations'),
      recommendation('compliance-guardian', 'audit-surface', 'Use the compliance dashboard as a real management tool', 'The page already exists. The leverage comes from using it before there is a problem.', 'medium', 'More resilient scaling', 'Owner + operations'),
    ],
    linkedRoutes: [
      { label: 'Compliance page', href: '/dashboard/compliance', type: 'page' },
      { label: 'Compliance API', href: '/api/dashboard/compliance', type: 'api' },
      { label: 'Audit page', href: '/dashboard/compliance/audit', type: 'page' },
    ],
  },
  {
    id: 'inventory-oracle',
    name: 'Inventory Oracle',
    emoji: '📦',
    tier: 'protection',
    category: 'inventory',
    status: 'extended',
    mission: 'Protect margin and treatment continuity through reorder intelligence, waste awareness, and supplier visibility.',
    ownerValue: 'Stops supply problems and margin leaks before they hit provider capacity.',
    permission: 'view_finance',
    uiPath: '/dashboard/inventory-intel',
    apiPath: '/api/dashboard/agents/inventory-oracle',
    summary: 'Inventory intelligence layer built on the existing inventory analysis engine and dashboard modules.',
    scorecards: [
      { label: 'Main job', value: 'Protect margin', context: 'Inventory mistakes quietly destroy profit' },
      { label: 'System base', value: 'Real engine', context: 'Inventory analytics route is already wired to analysis logic' },
      { label: 'Best trigger', value: 'Reorder + waste', context: 'These are the fastest places to tighten' },
    ],
    signals: [
      { label: 'Inventory engine', value: 'Live', status: 'medium', note: 'Inventory analysis route already computes structured output from entries' },
      { label: 'UI coverage', value: 'Now extended', status: 'medium', note: 'Inventory intel page is being elevated into the council' },
      { label: 'Supplier dependence', value: 'Ongoing risk', status: 'high', note: 'Supply issues can sabotage booked revenue if they stay invisible' },
    ],
    recommendations: [
      recommendation('inventory-oracle', 'reorder-alerts', 'Make reorder and expiry signals visible to operators', 'Supplies should fail gracefully in the dashboard long before they fail in a room.', 'critical', 'Fewer treatment disruptions', 'Operations + inventory'),
      recommendation('inventory-oracle', 'waste-review', 'Review waste and dead stock every week', 'The margin leak is often not one big problem, but repeated small neglect.', 'high', 'Better unit economics', 'Operations'),
      recommendation('inventory-oracle', 'supplier-scorecard', 'Track supplier reliability for critical items', 'If one vendor controls a treatment line, that dependency should be obvious.', 'medium', 'Lower execution risk', 'Operations'),
    ],
    linkedRoutes: [
      { label: 'Inventory intel page', href: '/dashboard/inventory-intel', type: 'page' },
      { label: 'Inventory page', href: '/dashboard/inventory', type: 'page' },
      { label: 'Inventory API', href: '/api/dashboard/inventory', type: 'api' },
    ],
  },
];

export function getCouncilAgent(agentId: string) {
  return AGENT_COUNCIL.find((agent) => agent.id === agentId) ?? null;
}

export function getCouncilAgentsByTier(tier: CouncilTier) {
  return AGENT_COUNCIL.filter((agent) => agent.tier === tier);
}

export function getCouncilSnapshot(): CouncilSnapshot {
  const totalAgents = AGENT_COUNCIL.length;
  const realOrExtendedAgents = AGENT_COUNCIL.filter(
    (agent) => agent.status === 'real' || agent.status === 'extended',
  ).length;

  const tierCounts = AGENT_COUNCIL.reduce<Record<CouncilTier, number>>(
    (acc, agent) => {
      acc[agent.tier] += 1;
      return acc;
    },
    { crown: 0, revenue: 0, protection: 0, intelligence: 0 },
  );

  const agentCountByStatus = AGENT_COUNCIL.reduce<Record<CouncilBuildStatus, number>>(
    (acc, agent) => {
      acc[agent.status] += 1;
      return acc;
    },
    { real: 0, extended: 0, placeholder: 0 },
  );

  const allRecommendations = AGENT_COUNCIL.flatMap((agent) => agent.recommendations);
  const severityOrder: Record<CouncilRecommendation['severity'], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const sorted = [...allRecommendations].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  return {
    headline: 'Rani Command Council',
    summary:
      'A unified 12-agent operating layer over the existing dashboard, designed to turn scattered intelligence into daily execution.',
    totalAgents,
    realOrExtendedAgents,
    criticalMoves: sorted.filter((item) => item.severity === 'critical').slice(0, 6),
    easyWins: sorted.filter((item) => item.severity === 'medium').slice(0, 6),
    tierCounts,
    agentCountByStatus,
  };
}
