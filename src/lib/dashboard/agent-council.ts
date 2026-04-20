import type { Permission } from '@/types/auth';

export type CouncilRecommendationSeverity = 'critical' | 'high' | 'medium' | 'low';

export type CouncilRecommendation = {
  id: string;
  title: string;
  description: string;
  severity: CouncilRecommendationSeverity;
  impact: string;
  owner: string;
};

export type CouncilAgent = {
  id: string;
  name: string;
  emoji: string;
  tier: 'crown' | 'revenue' | 'retention' | 'operations' | 'compliance';
  category: string;
  status: 'real' | 'extended' | 'placeholder';
  mission: string;
  ownerValue: string;
  permission: Permission;
  uiPath: string;
  apiPath: string;
  summary: string;
  recommendations: CouncilRecommendation[];
};

export type CouncilSnapshotMove = {
  id: string;
  title: string;
  owner: string;
  severity: CouncilRecommendationSeverity;
  impact: string;
};

export type CouncilSnapshot = {
  generatedAt: string;
  criticalMoves: CouncilSnapshotMove[];
  activeAgentCount: number;
  categoryCoverage: Record<string, number>;
};

function recommendation(
  agentId: string,
  key: string,
  title: string,
  description: string,
  severity: CouncilRecommendationSeverity,
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
    mission: 'turn the dashboard into a focused owner plan for today.',
    ownerValue: 'one command layer across revenue, retention, and operations.',
    permission: 'view_executive',
    uiPath: '/dashboard/briefing',
    apiPath: '/api/dashboard/agents/ceo-chief-of-staff',
    summary: 'owner-level synthesis and priority forcing function.',
    recommendations: [
      recommendation(
        'ceo-chief-of-staff',
        'daily-brief',
        'run the owner brief first thing',
        'start with top moves, then route to consult, reactivation, and schedule.',
        'critical',
        'higher execution consistency',
        'owner',
      ),
    ],
  },
  {
    id: 'finance-strategist',
    name: 'Finance Strategist',
    emoji: '💵',
    tier: 'crown',
    category: 'finance',
    status: 'extended',
    mission: 'protect runway while the clinic pushes growth.',
    ownerValue: 'keeps cash clarity tied to service-line outcomes.',
    permission: 'view_finance',
    uiPath: '/dashboard/finance',
    apiPath: '/api/dashboard/agents/finance-strategist',
    summary: 'cash discipline, margin guardrails, and revenue pacing.',
    recommendations: [
      recommendation(
        'finance-strategist',
        'hero-margin',
        'track hero-package margin weekly',
        'separate collection quality from top-line claims.',
        'high',
        'safer scaling decisions',
        'owner + finance',
      ),
    ],
  },
  {
    id: 'seo-queen',
    name: 'SEO Queen',
    emoji: '🔍',
    tier: 'revenue',
    category: 'seo',
    status: 'real',
    mission: 'turn local intent into consult demand.',
    ownerValue: 'builds compounding acquisition without paid-spend dependency.',
    permission: 'view_leads',
    uiPath: '/dashboard/marketing/seo',
    apiPath: '/api/dashboard/agents/seo-queen',
    summary: 'geo + service page growth with trust signal loops.',
    recommendations: [
      recommendation(
        'seo-queen',
        'geo-focus',
        'tie content to hero services',
        'prioritize service-plus-city pages tied to booked-consult outcomes.',
        'high',
        'higher qualified discovery',
        'marketing',
      ),
    ],
  },
  {
    id: 'conversion-duchess',
    name: 'Conversion Duchess',
    emoji: '💋',
    tier: 'revenue',
    category: 'conversion',
    status: 'real',
    mission: 'lift consult close quality and premium package adoption.',
    ownerValue: 'turns interest into high-confidence plan starts.',
    permission: 'view_clients',
    uiPath: '/dashboard/consult',
    apiPath: '/api/dashboard/agents/conversion-duchess',
    summary: 'consult scripting, financing framing, and close workflow.',
    recommendations: [
      recommendation(
        'conversion-duchess',
        'close-sequence',
        'use a consistent close sequence',
        'lead with outcomes, then map treatment plan and payment path.',
        'critical',
        'better consult close rates',
        'providers + consult team',
      ),
    ],
  },
  {
    id: 'retention-empress',
    name: 'Retention Empress',
    emoji: '🫶',
    tier: 'retention',
    category: 'reactivation',
    status: 'extended',
    mission: 'recover overdue clients with respectful re-engagement flows.',
    ownerValue: 'stabilizes recurring revenue through structured follow-up.',
    permission: 'view_clients',
    uiPath: '/dashboard/reactivation',
    apiPath: '/api/dashboard/agents/retention-empress',
    summary: 'win-back prioritization and campaign pacing.',
    recommendations: [
      recommendation(
        'retention-empress',
        'overdue-focus',
        'prioritize high-value overdue clients first',
        'sequence outreach by revenue risk and response likelihood.',
        'high',
        'faster revenue recovery',
        'front desk + owner',
      ),
    ],
  },
  {
    id: 'compliance-guardian',
    name: 'Compliance Guardian',
    emoji: '🛡️',
    tier: 'compliance',
    category: 'risk',
    status: 'extended',
    mission: 'keep risk controls visible and action-oriented.',
    ownerValue: 'reduces compliance drift through weekly review cues.',
    permission: 'view_settings',
    uiPath: '/dashboard/compliance',
    apiPath: '/api/dashboard/agents/compliance-guardian',
    summary: 'policy, audit, and incident readiness coverage.',
    recommendations: [
      recommendation(
        'compliance-guardian',
        'incident-rhythm',
        'review incidents weekly',
        'close pending items with clear owner and due dates.',
        'high',
        'lower compliance exposure',
        'operations + provider',
      ),
    ],
  },
];

export function getCouncilAgent(agentId: string): CouncilAgent | undefined {
  return AGENT_COUNCIL.find((agent) => agent.id === agentId);
}

export function getCouncilSnapshot(): CouncilSnapshot {
  const criticalMoves = AGENT_COUNCIL.flatMap((agent) =>
    agent.recommendations
      .filter((item) => item.severity === 'critical' || item.severity === 'high')
      .map((item) => ({
        id: item.id,
        title: item.title,
        owner: item.owner,
        severity: item.severity,
        impact: item.impact,
      })),
  );

  const categoryCoverage = AGENT_COUNCIL.reduce<Record<string, number>>((acc, agent) => {
    acc[agent.category] = (acc[agent.category] ?? 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    criticalMoves,
    activeAgentCount: AGENT_COUNCIL.length,
    categoryCoverage,
  };
}
